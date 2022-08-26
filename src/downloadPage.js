import * as path from 'path';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import 'axios-debug-log';
import debug from 'debug';
import Listr from 'listr';

const { promises: fsp } = fs;
const logPageLoader = debug('page-loader');

const downloadAssets = ($, url, fullDirPath) => {
  const items = { img: 'src', link: 'href', script: 'src' };
  const promises = $('img, link, script').map((i, el) => {
    const requestUrl = new URL($(el).attr(items[el.tagName]), url);
    if ($(el).attr(items[el.tagName]) !== undefined) {
      if (!$(el).attr(items[el.tagName]).startsWith('http')) {
        return axios({
          method: 'get',
          url: `${requestUrl}`,
          responseType: 'stream',
        })
          .then((response) => {
            if (el.tagName === 'img') {
              if (path.extname($(el).attr('src')) === '.png' || path.extname($(el).attr('src')) === '.jpg') {
                logPageLoader(`${url}/${el}`);
                fsp.writeFile(path.join(fullDirPath, `${$(el).attr(items[el.tagName])}`), response.data);
              } else {
                return undefined;
              }
            } else {
              logPageLoader(`${url}/${el}`);
              fsp.writeFile(path.join(fullDirPath, `${$(el).attr(items[el.tagName])}`), response.data);
            }
            return response;
          });
      }
    }
    return undefined;
  });
  return promises;
};

const modifyHtml = ($, dirPath, prefix, url) => {
  const pageUrl = new URL(url);
  $('img, link, script').each(function modify(i, elem) {
    if (elem.tagName === 'img') {
      $(this).attr('src', `${dirPath}/${prefix}${$(elem).attr('src').replace(/\//g, '-')}`);
    } else if (elem.tagName === 'link') {
      if (!$(elem).attr('href').startsWith('http')) {
        const normalizedStr = path.extname($(elem).attr('href')) === '.css' ? `${$(elem).attr('href').replace(/\//g, '-')}` : `${$(elem).attr('href').replace(/\//g, '-')}.html`;
        $(this).attr('href', `${dirPath}/${prefix}${normalizedStr}`);
      }
    } else if ($(elem).attr('src') !== undefined) {
      if (!$(elem).attr('src').startsWith('http')) {
        $(this).attr('src', `${dirPath}/${prefix}${$(elem).attr('src').replace(/\//g, '-')}`);
      } else {
        const elUrl = new URL($(elem).attr('src'));
        if (pageUrl.hostname === elUrl.hostname) {
          $(this).attr('src', `${dirPath}/${prefix}${elUrl.pathname.replace(/\//g, '-')}`);
        }
      }
    }
  });
};

const getAssets = (page, url, fullDirPath, dirPath, prefix) => {
  const $ = cheerio.load(page);
  if ($.parseHTML(page) === null) {
    throw new Error('parsing error! page is not HTML format!');
  }
  const assets = downloadAssets($, url, fullDirPath, prefix);
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
            if (el !== undefined) {
              const tasks = new Listr([{
                title: `${el.data.responseUrl}`,
                task: () => Promise.resolve(el),
              }], { concurrent: true });
              tasks.run();
            }
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
