import * as path from 'path';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import 'axios-debug-log';
import debug from 'debug';
import Listr from 'listr';

const { promises: fsp } = fs;
const logPageLoader = debug('page-loader');

const checkExtension = ($, el) => (path.extname($(el).attr('src')) === '.png' || path.extname($(el).attr('src')) === '.jpg');

const filterAssets = ($, url) => {
  const pageUrl = new URL(url);
  const tagMap = { img: 'src', link: 'href', script: 'src' };
  return $('img, link, script')
    .filter((i, el) => $(el).attr(tagMap[el.tagName]))
    .filter((i, el) => (el.tagName === 'img' ? checkExtension($, el) : el))
    .map((i, el) => ({ el, elUrl: new URL($(el).attr(tagMap[el.tagName]), url) }))
    .filter((i, { elUrl }) => elUrl.hostname === pageUrl.hostname);
};

const tagMap = { img: 'src', link: 'href', script: 'src' };

const downloadAssets = ($, fullDirPath, assets) => assets.map((i, { el, elUrl }) => axios({
  method: 'get',
  url: `${elUrl}`,
  responseType: 'stream',
})
  .then((response) => {
    logPageLoader(`${elUrl}`);
    fsp.writeFile(path.join(fullDirPath, `${$(el).attr(tagMap[el.tagName])}`), response.data);
    return response;
  }));

const isTheUrlAbsolutely = ($, elem) => $(elem).attr(tagMap[elem.tagName]).startsWith('http');

const isLocalAsset = (pageUrl, elUrl) => pageUrl.hostname === elUrl.hostname;

const modifyImg = ($, elem, dirPath, prefix) => (checkExtension($, elem) ? $(elem).attr('src', `${dirPath}/${prefix}${$(elem).attr('src').replace(/\//g, '-')}`) : elem);
const modifyLink = ($, elem, dirPath, prefix) => {
  const normalizedStr = path.extname($(elem).attr('href')) === '.css' ? `${$(elem).attr('href').replace(/\//g, '-')}` : `${$(elem).attr('href').replace(/\//g, '-')}.html`;
  return !isTheUrlAbsolutely($, elem) ? $(elem).attr('href', `${dirPath}/${prefix}${normalizedStr}`) : elem;
};
const modifyScript = ($, elem, dirPath, prefix, pageUrl) => (!isTheUrlAbsolutely($, elem)
  ? $(elem).attr('src', `${dirPath}/${prefix}${$(elem).attr('src').replace(/\//g, '-')}`)
  : isLocalAsset(pageUrl, new URL($(elem).attr('src'))) && $(elem).attr('src', `${dirPath}/${prefix}${new URL($(elem).attr('src')).pathname.replace(/\//g, '-')}`));

const modifyHtml = ($, dirPath, prefix, url) => {
  const pageUrl = new URL(url);
  $('img, link, script').each((i, elem) => {
    switch (elem.tagName) {
      case 'img':
        modifyImg($, elem, dirPath, prefix);
        break;
      case 'link':
        modifyLink($, elem, dirPath, prefix);
        break;
      case 'script':
        modifyScript($, elem, dirPath, prefix, pageUrl);
        break;
      default:
        $(elem);
    }
  });
};

const validateHtml = ($, page) => {
  const error = () => { throw new Error('parsing error! page is not valid!'); };
  return $.parseHTML(page) === null ? error() : page;
};

const getAssets = (page, url, fullDirPath, dirPath, prefix) => {
  const $ = cheerio.load(page);
  validateHtml($, page);
  const filteredAssets = filterAssets($, url);
  const assets = downloadAssets($, fullDirPath, filteredAssets);
  modifyHtml($, dirPath, prefix, url);
  return [$.html(), assets];
};

const getCorrectName = (url, prefix = false) => {
  const normalizedHost = url.hostname.split('').map((el) => (el === '.' ? '-' : el)).join('');
  const normalizedPath = url.pathname.split('').map((el) => (el === '/' ? '-' : el)).join('');
  switch (prefix) {
    case false:
      return url.pathname !== '/' ? `${normalizedHost}${normalizedPath}` : normalizedHost;
    case true:
      return normalizedHost;
    default:
      throw new Error('unexpected prefix!');
  }
};

export default (url, dir = process.cwd()) => {
  const urlObject = new URL(url);
  const fileName = `${getCorrectName(urlObject)}.html`;
  const dirName = `${getCorrectName(urlObject)}_files`;
  const assetsName = urlObject.pathname !== '/' ? getCorrectName(urlObject, true) : `${getCorrectName(urlObject, true)}-`;
  const filePath = path.resolve(process.cwd(), dir, fileName);
  const dirPath = path.resolve(process.cwd(), dir);
  return axios.get(url)
    .then((response) => fsp.mkdir(path.resolve(process.cwd(), dir, dirName))
      .then(() => getAssets(response.data, url, dirPath, dirName, assetsName)))
    .then((data) => {
      logPageLoader(url);
      const [html, assets] = data;
      return Promise.all(assets)
        .then((items) => {
          const tasksForListr = items.map((el) => ({
            title: `${el.data.responseUrl}`,
            task: () => Promise.resolve(el),
          }));
          const tasks = new Listr(tasksForListr, { concurrent: true });
          tasks.run();
          return html;
        });
    })
    .then((html) => fsp.writeFile(filePath, html))
    .then(() => {
      const obj = { filepath: filePath };
      return obj;
    });
};
