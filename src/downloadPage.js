import * as path from 'path';
import fs from 'fs';
import axios from 'axios';

export default (url, dir = process.cwd()) => {
  const myURL = new URL(url);
  const fileName = `${myURL.hostname.replace(/\./g, '-')}${myURL.pathname.replace('/', '-')}.html`;
  const filePath = path.resolve(process.cwd(), dir, fileName);
  axios.get(url)
    .then(({ data }) => fs.writeFileSync(filePath, data));
  console.log(`Page was successfully downloaded into ${filePath}`);
  const obj = { filepath: filePath };
  return obj;
};
