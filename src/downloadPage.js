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

const downloadAssets = ($, url, fullDirPath) => {
  const pageUrl = new URL(url);
  const items = { img: 'src', link: 'href', script: 'src' };
  const tagsWithAttr = $('img, link, script').filter((i, el) => $(el).attr(items[el.tagName]));
  const correctExtensions = tagsWithAttr.filter((i, el) => (el.tagName === 'img' ? checkExtension($, el) : el));
  const localAssets = correctExtensions.filter((i, el) => {
    const elUrl = new URL($(el).attr(items[el.tagName]), url);
    return elUrl.hostname === pageUrl.hostname;
  });
  const promises = localAssets.map((i, el) => {
    const requestUrl = new URL($(el).attr(items[el.tagName]), url);
    return axios({
      method: 'get',
      url: `${requestUrl}`,
      responseType: 'stream',
    })
      .then((response) => {
        logPageLoader(`${url}/${el}`);
        fsp.writeFile(path.join(fullDirPath, `${$(el).attr(items[el.tagName])}`), response.data);
        return response;
      });
  });
  return promises;
};

const isTheUrlAbsolutely = ($, elem) => {
  const items = { img: 'src', link: 'href', script: 'src' };
  return $(elem).attr(items[elem.tagName]).startsWith('http');
};

const isLocalAsset = (pageUrl, elUrl) => pageUrl.hostname === elUrl.hostname;

const modifyImg = ($, elem, dirPath, prefix) => (checkExtension($, elem) ? $(elem).attr('src', `${dirPath}/${prefix}${$(elem).attr('src').replace(/\//g, '-')}`) : elem);
const modifyLink = ($, elem, dirPath, prefix) => {
  const normalizedStr = path.extname($(elem).attr('href')) === '.css' ? `${$(elem).attr('href').replace(/\//g, '-')}` : `${$(elem).attr('href').replace(/\//g, '-')}.html`;
  return !isTheUrlAbsolutely($, elem) ? $(elem).attr('href', `${dirPath}/${prefix}${normalizedStr}`) : elem;
};
const modifyScript = ($, elem, dirPath, prefix, pageUrl) => (!isTheUrlAbsolutely($, elem) ? $(elem).attr('src', `${dirPath}/${prefix}${$(elem).attr('src').replace(/\//g, '-')}`) : isLocalAsset(pageUrl, new URL($(elem).attr('src'))) && $(elem).attr('src', `${dirPath}/${prefix}${new URL($(elem).attr('src')).pathname.replace(/\//g, '-')}`));

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
  const assets = downloadAssets($, url, fullDirPath);
  modifyHtml($, dirPath, prefix, url);
  return [$.html(), assets];
};

const getFileName = (url) => (url.pathname !== '/' ? `${url.hostname.replace(/\./g, '-')}${url.pathname.replace(/\//g, '-')}.html` : `${url.hostname.replace(/\./g, '-')}.html`);

const getDirName = (url) => (url.pathname !== '/' ? `${url.hostname.replace(/\./g, '-')}${url.pathname.replace(/\//g, '-')}_files` : `${url.hostname.replace(/\./g, '-')}_files`);

const getAssetsName = (url) => (url.pathname !== '/' ? `${url.hostname.replace(/\./g, '-')}` : `${url.hostname.replace(/\./g, '-')}-`);

export default (url, dir = process.cwd()) => {
  const urlObject = new URL(url);
  const fileName = getFileName(urlObject);
  const dirName = getDirName(urlObject);
  const assetsName = getAssetsName(urlObject);
  const filePath = path.resolve(process.cwd(), dir, fileName);
  const dirPath = path.resolve(process.cwd(), dir);
  return axios.get(url)
    .then((response) => {
      logPageLoader(url);
      return response;
    })
    .then((response) => fsp.mkdir(path.resolve(process.cwd(), dir, dirName))
      .then(() => getAssets(response.data, url, dirPath, dirName, assetsName)))
    .then((data) => {
      const [html, assets] = data;
      return Promise.all(assets)
        .then((items) => {
          items.forEach((el) => {
            const tasks = new Listr([{
              title: `${el.data.responseUrl}`,
              task: () => Promise.resolve(el),
            }], { concurrent: true });
            tasks.run();
          });
          return html;
        });
    })
    .then((html) => fsp.writeFile(filePath, html))
    .then(() => {
      const obj = { filepath: filePath };
      return obj;
    });
};
