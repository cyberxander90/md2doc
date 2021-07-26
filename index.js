#!/usr/bin/env node

const yargs = require('yargs');
const md2docs = require('./lib/md2docs');

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('md2docs')
  .usage('$0 [args]')
  .command(
    '$0',
    'the default command',
    () => {},
    (argv) => {
      md2docs({
        output: argv.outputDir || 'testing/site',
        target: argv.inputDir || 'testing/doc',
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
