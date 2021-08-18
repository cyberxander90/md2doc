/* eslint-disable no-unused-vars */
const path = require('path');

const logger = require('./logger');
const {
  md2html,
  generateTableOfContents,
  generateSiteNav,
  wrapHeaders,
} = require('./html');
const $ = require('./html-parser');
const {
  existsDir,
  removeDir,
  createDir,
  copyDir,
  copyFile,
  forEachFile,
  forEachDir,
  getFileContent,
  writeFile,
  existsFile,
} = require('./fs');

const validateInputDir = (inputDir) => {
  if (!existsDir(inputDir)) {
    logger.error('Input directory not found');
    return false;
  }
  return true;
};

const recreateOutputDir = (outputDir) => [removeDir(outputDir), createDir(outputDir)];

const copyTheme = (outputDir, theme) => copyDir(`lib/themes/${theme}`, outputDir);

const buildInitConfig = (currentConfig) => ({
  inputDir: '.',
  outputDir: 'out',
  theme: 'default',
  ...currentConfig,
});

const buildConfig = (dirPath, currentConfig) => ({ ...currentConfig });

const shouldProcessFile = (filePath, outputFilePath, currentConfig) => true;

const shouldProcessDir = (dirPath, outputDirPath, currentConfig, deep) => {
  const currentDirIsTheOutput = deep === 0 && dirPath === currentConfig.outputDir;
  return !currentDirIsTheOutput;
};

const isMdFile = (filePath) => filePath.endsWith('.md');

const warnIfFileExists = (p) => existsFile(p) && logger.warn(`Already exist a file: '${p}'.`);

const processMdFile = (filePath, outputFilePath, currentConfig) => {
  const outputHtmlFilePath = outputFilePath.replace(/md$/, 'html');
  const outFileContent = md2html(getFileContent(filePath));

  logger.info(`Processing md file '${filePath}' to '${outputHtmlFilePath}'`);
  warnIfFileExists(outputHtmlFilePath);
  writeFile(outputHtmlFilePath, outFileContent);
};

const processNotMdFile = (filePath, outputFilePath, currentConfig) => {
  logger.info(`Copying file '${filePath}' to '${outputFilePath}'`);
  warnIfFileExists(outputFilePath);
  copyFile(filePath, outputFilePath);
};

const getFileMetadata = (filePath, currentConfig) => {
  const fileHtmlPath = filePath.replace(/md$/, 'html');
  return {
    filePath,
    fileHtmlPath,
    fileLink: path.normalize(fileHtmlPath).replace(path.normalize(currentConfig.outputDir), ''),
    name: path.parse(fileHtmlPath).name,
  };
};

const getDirMetadata = (dirPath, currentConfig) => ({
  dirPath,
  dirName: path.parse(dirPath).name,
});

const sortProcessedMdFiles = (processedMdFiles, currentConfig) => [...processedMdFiles];

const processDir = (currentInputDirPath, currentOutputDirPath, prevConfig, deep = 0) => {
  const currentConfig = buildConfig(currentInputDirPath, prevConfig);
  const processedMdFiles = [];

  const fileProcessor = (filePath) => {
    logger.info(`Analyzing file '${filePath}'}`);

    const outputFilePath = path.join(currentOutputDirPath, path.basename(filePath));
    if (!shouldProcessFile(filePath, outputFilePath, currentConfig, deep)) {
      logger.info(`Skipping file '${filePath}'}`);
      return;
    }

    if (isMdFile(filePath)) {
      processMdFile(filePath, outputFilePath, currentConfig);
      processedMdFiles.push(getFileMetadata(outputFilePath, currentConfig));
    } else {
      processNotMdFile(filePath, outputFilePath, currentConfig);
    }
  };

  const dirProcessor = (dirPath) => {
    logger.info(`Analyzing dir '${dirPath}'}`);

    const outputDirPath = path.join(currentOutputDirPath, path.basename(dirPath));
    if (!shouldProcessDir(dirPath, outputDirPath, currentConfig, deep)) {
      logger.info(`Skipping dir '${dirPath}'}`);
      return;
    }

    const dirProcessedMdFiles = processDir(dirPath, outputDirPath, currentConfig, deep + 1);
    if (dirProcessedMdFiles.length > 0) {
      processedMdFiles.push({
        ...getDirMetadata(outputDirPath),
        files: dirProcessedMdFiles,
      });
    } else {
      logger.info(`Skipping empty dir '${dirPath}'}`);
    }
  };

  forEachFile(currentInputDirPath, fileProcessor);
  forEachDir(currentInputDirPath, dirProcessor);

  return sortProcessedMdFiles(processedMdFiles);
};

const getMdFilePaths = (processedMdFiles) => {
  const result = [];
  const flatt = (items) => {
    items.forEach(({ filePath, dirPath, files }) => {
      if (filePath) {
        result.push(filePath);
      } else if (files) {
        flatt(files);
      }
    });
  };
  flatt(processedMdFiles);
  return result;
};

const md2Web = (config) => {
  const currentConfig = buildInitConfig(config || {});
  const { inputDir, outputDir, theme } = currentConfig;

  logger.info(`Convert dir '${inputDir}' to web '${outputDir}', using the theme '${theme}'`);

  if (!validateInputDir(inputDir)) {
    return null;
  }

  recreateOutputDir(outputDir);
  const processedMdFiles = processDir(inputDir, path.join(outputDir, 'pages'), currentConfig);
  copyTheme(outputDir, theme);
  const siteNavHtml = generateSiteNav(processedMdFiles);
  const indexHtmlPath = path.join(outputDir, 'index.html');
  const indexHtml = getFileContent(indexHtmlPath);
  const mdFilePaths = getMdFilePaths(processedMdFiles);

  if (indexHtml) {
    mdFilePaths.forEach((filePath) => {
      const $indexDoc = $.loadDocument({ html: indexHtml });
      const outFilePath = filePath.replace(/md$/, 'html');
      const fileHtml = getFileContent(outFilePath);
      $.addElement($indexDoc, '#table-of-contents', generateTableOfContents(fileHtml));
      $.addElement($indexDoc, '#site-nav', siteNavHtml);
      $.addElement($indexDoc, '#main', fileHtml);
      wrapHeaders({ $document: $indexDoc, selector: '#main' });
      $.saveTo($indexDoc, outFilePath);
    });

    const $indexDoc = $.loadDocument({ html: indexHtml });
    $.removeNode($.find($indexDoc, '#table-of-contents'));
    $.addElement($indexDoc, '#site-nav', siteNavHtml);
    $.addElement($indexDoc, '#main', 'Dev Docs');
    wrapHeaders({ $document: $indexDoc, selector: '#main' });
    $.saveTo($indexDoc, indexHtmlPath);
  }

  return currentConfig;
};

module.exports = md2Web;
