#!/usr/bin/env node

const yargs = require('yargs');
const md2web = require('./md2web');

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('md2web')
  .usage('$0 [args]')
  .command(
    '$0',
    'the default command',
    () => {},
    (argv) => {
      md2web({
        outputDir: argv.outputDir,
        inputDir: argv.inputDir,
        theme: 'default',
      });
    },
  )
  .option('inputDir', {
    alias: 'i',
    description: `Path to directory to extract the documentation.
    Default is './doc'.`,
  })
  .option('outputDir', {
    alias: 'o',
    description: `Path to directory to create the web site documentation.
    Default is './site'.`,
  })
  .option('version', {
    alias: 'v',
    description: 'Show version number.',
  })
  .option('help', {
    alias: 'h',
    description: 'Show help.',
  })
  .argv;
