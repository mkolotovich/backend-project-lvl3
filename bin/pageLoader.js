#!/usr/bin/env node

import { Command } from 'commander';
import Listr from 'listr';
import downloadPage from '../src/downloadPage.js';

const program = new Command();

program
  .description('some description')
  .version('0.0.1', '-V, --version', 'output the version number')
  .helpOption('-h, --help', 'display help for command')
  .option('-o, --output [dir]', `output dir (default: "${process.cwd()}")`)
  .arguments('<url>')
  .action((url) => {
    const { output } = program.opts();
    downloadPage(url, output)
      .then((obj) => {
        const [object, images] = obj;
        // console.log(`Page was successfully downloaded into ${obj.filepath}`);
        // images.forEach((tasks) => {
        //   if (tasks._tasks[0].title) {
        //     tasks.run();
        //   }
        // });
        Promise.all(images)
          .then((items) => {
            items.forEach((el) => {
              if (el !== undefined) {
                const tasks = new Listr([{
                  title: `${el.data.responseUrl}`,
                  task: () => Promise.resolve(el),
                }]);
                tasks.run();
              }
              // return tasks;
            });
          });
        console.log(`Page was successfully downloaded into ${object.filepath}`);
        process.exitCode = 0;
      })
      .catch((err) => {
        console.error('error!!!', err.message);
        throw err && process.exit(1);
      });
  })
  .parse(process.argv);
