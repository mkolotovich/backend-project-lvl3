import * as path from 'path';
import fs from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';

const { promises: fsp } = fs;

const getImages = ($, url, fullDirPath, dirPath, prefix) => {
  const imageTag = $('img');
  const src = Array.from(imageTag).map((element) => $(element).attr('src'));
  src.forEach((el) => {
    if (path.extname(el) === '.png' || path.extname(el) === '.jpg') {
      axios({
        method: 'get',
        url: `${url}/${el}`,
        responseType: 'stream',
      })
        .then(({ data }) => {
          const normalizedStr = `${prefix}${el.replace(/\//g, '-')}`;
          return fsp.writeFile(path.join(fullDirPath, normalizedStr), data);
        });
    }
  });
  $('img').each(function modify(i, elem) {
    $(this).attr('src', `${dirPath}/${prefix}${$(elem).attr('src').replace(/\//g, '-')}`);
  });
};

const getLinks = ($, url, fullDirPath, dirPath, prefix) => {
  const linkTag = $('link');
  const src = Array.from(linkTag).map((element) => $(element).attr('href'));
  src.forEach((el) => {
    if (!el.startsWith('http')) {
      axios({
        method: 'get',
        url: `${url}/${el}`,
        responseType: 'stream',
      })
        .then(({ data }) => {
          const normalizedStr = path.extname(el) === '.css' ? `${prefix}${el.replace(/\//g, '-')}` : `${prefix}${el.replace(/\//g, '-')}.html`;
          return fsp.writeFile(path.join(fullDirPath, normalizedStr), data);
        });
    }
  });
  $('link').each(function modify(i, elem) {
    if (!$(elem).attr('href').startsWith('http')) {
      const normalizedStr = path.extname($(elem).attr('href')) === '.css' ? `${$(elem).attr('href').replace(/\//g, '-')}` : `${$(elem).attr('href').replace(/\//g, '-')}.html`;
      $(this).attr('href', `${dirPath}/${prefix}${normalizedStr}`);
    }
  });
};

const getScripts = ($, url, fullDirPath, dirPath, prefix) => {
  const scriptTag = $('script');
  const pageUrl = new URL(url);
  const src = Array.from(scriptTag).map((element) => $(element).attr('src'));
  src.forEach((el) => {
    if (el !== undefined) {
      if (!el.startsWith('http')) {
        axios({
          method: 'get',
          url: `${url}/${el}`,
          responseType: 'stream',
        })
          .then(({ data }) => {
            const normalizedStr = `${prefix}${el.replace(/\//g, '-')}`;
            return fsp.writeFile(path.join(fullDirPath, normalizedStr), data);
          });
      } else {
        const elUrl = new URL(el);
        if (pageUrl.hostname === elUrl.hostname) {
          axios({
            method: 'get',
            url: `${el}`,
            responseType: 'stream',
          })
            .then(({ data }) => {
              const normalizedStr = `${prefix}${el.replace(/\//g, '-')}`;
              return fsp.writeFile(path.join(fullDirPath, normalizedStr), data);
            });
        }
      }
    }
  });
  $('script').each(function modify(i, elem) {
    if ($(elem).attr('src') !== undefined) {
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
  getImages($, url, fullDirPath, dirPath, prefix);
  getLinks($, url, fullDirPath, dirPath, prefix);
  getScripts($, url, fullDirPath, dirPath, prefix);
  return $.html();
};

export default (url, dir = process.cwd()) => {
  const myURL = new URL(url);
  const fileName = myURL.pathname !== '/' ? `${myURL.hostname.replace(/\./g, '-')}${myURL.pathname.replace('/', '-')}.html` : `${myURL.hostname.replace(/\./g, '-')}.html`;
  const dirName = myURL.pathname !== '/' ? `${myURL.hostname.replace(/\./g, '-')}${myURL.pathname.replace('/', '-')}_files` : `${myURL.hostname.replace(/\./g, '-')}_files`;
  const assetsName = myURL.pathname !== '/' ? `${myURL.hostname.replace(/\./g, '-')}` : `${myURL.hostname.replace(/\./g, '-')}-`;
  const filePath = path.resolve(process.cwd(), dir, fileName);
  const dirPath = path.resolve(process.cwd(), dir, dirName);
  return fsp.mkdir(dirPath)
    .then(() => axios.get(url))
    .then(({ data }) => {
      const modifiedPage = getAssets(data, url, dirPath, dirName, assetsName);
      fsp.writeFile(filePath, modifiedPage);
      console.log(`Page was successfully downloaded into ${filePath}`);
      const obj = { filepath: filePath };
      return obj;
    });
};
