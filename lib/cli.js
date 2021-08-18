#!/usr/bin/env node

const yargs = require('yargs');
const md2web = require('./md2web');
const server = require('./server');

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('md2web')
  .usage('$0 [args]')
  .command(
    '$0',
    'the default command',
    () => {},
    (argv) => {
      let outputDir = './out';
      if (argv.skipBuild !== 'true') {
        const build = md2web({
          outputDir: argv.outputDir,
          inputDir: argv.inputDir,
          theme: 'default',
        });
        if (build) {
          outputDir = build.outputDir;
        }
      }

      if (argv.serve === 'true') {
        server(argv.port || 8080, outputDir || './out');
      }
    },
  )
  .option('inputDir', {
    alias: 'i',
    description: `Path to directory to extract the documentation.
    Default is './'.`,
  })
  .option('outputDir', {
    alias: 'o',
    description: `Path to directory to create the web site documentation.
    Default is './out'.`,
  })
  .option('skipBuild', {
    alias: 'n',
    description: `Skip build.
    Default is 'false'.`,
  })
  .option('serve', {
    alias: 's',
    description: `Serve the output directory.
    Default is 'false'.`,
  })
  .option('port', {
    alias: 'p',
    description: `Port to serve the output directory.
    Default is '8080'.`,
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
