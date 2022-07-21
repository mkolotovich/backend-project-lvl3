#!/usr/bin/env node

import { Command } from 'commander';
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
    downloadPage(url, output);
  })
  .parse(process.argv);
