import * as path from 'path';
import { promises as fsp } from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import 'axios-debug-log';
import debug from 'debug';
import Listr from 'listr';

const logPageLoader = debug('page-loader');

const getCorrectName = (url) => {
  const normalizedHost = url.hostname.split('').map((el) => (el === '.' ? '-' : el)).join('');
  const normalizedPath = url.pathname.split('').map((el) => (el === '/' ? '-' : el)).join('');
  return url.pathname !== '/' ? `${normalizedHost}${normalizedPath}` : normalizedHost;
};

const tagMap = { img: 'src', link: 'href', script: 'src' };

const filterAssets = (page, url, dir) => {
  const $ = cheerio.load(page);
  const pageUrl = new URL(url);
  const assets = $('img, link, script')
    .filter((i, el) => $(el).attr(tagMap[el.tagName]))
    .map((i, el) => ({ el, elUrl: new URL($(el).attr(tagMap[el.tagName]), url) }))
    .filter((i, { elUrl }) => elUrl.hostname === pageUrl.hostname)
    .each((i, { el, elUrl }) => {
      switch (el.tagName) {
        case 'link':
          return path.extname($(el).attr('href')) === '.css' ? $(el).attr('href', `${dir}/${getCorrectName(elUrl)}`) : $(el).attr('href', `${dir}/${getCorrectName(elUrl)}.html`);
        default:
          return $(el).attr('src', `${dir}/${getCorrectName(elUrl)}`);
      }
    });
  return [$.html(), assets];
};

const downloadAsset = (fullDirPath, { el, elUrl }) => axios({
  method: 'get',
  url: `${elUrl}`,
  responseType: 'stream',
})
  .then((response) => {
    fsp.writeFile(path.join(fullDirPath, el.attribs[tagMap[el.tagName]]), response.data);
    return response;
  });

export default (url, dir = process.cwd()) => {
  const urlObject = new URL(url);
  const fileName = `${getCorrectName(urlObject)}.html`;
  const dirName = `${getCorrectName(urlObject)}_files`;
  const filePath = path.resolve(process.cwd(), dir, fileName);
  const dirPath = path.resolve(process.cwd(), dir);
  return axios.get(url)
    .then((response) => {
      logPageLoader('create (if not exists) directory for assets', url);
      return response;
    })
    .then((response) => fsp.mkdir(path.resolve(process.cwd(), dir, dirName))
      .then(() => filterAssets(response.data, url, dirName)))
    .then((data) => {
      const [html, assets] = data;
      logPageLoader('write html file', filePath);
      fsp.writeFile(filePath, html);
      const tasks = assets.map((i, asset) => {
        const { el, elUrl } = asset;
        logPageLoader('load asset', elUrl.toString(), el.attribs[tagMap[el.tagName]]);
        return {
          title: elUrl.toString(),
          task: () => downloadAsset(dirPath, asset),
        };
      });
      const listr = new Listr(tasks.toArray(), { concurrent: true });
      return listr.run();
    })
    .then(() => {
      const obj = { filepath: filePath };
      return obj;
    });
};
