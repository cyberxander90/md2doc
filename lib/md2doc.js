const nodePath = require('path');
const {
  existsDir,
  existsFile,
  createDir,
  createFile,
  removeDir,
  forEachDir,
  forEachFile,
  getFileContent,
} = require('./fs');
const md2html = require('./md2html');
const logger = require('./logger');

function md2doc({
  output = 'site',
  target = 'doc',
} = {}) {
  if (!existsDir(target)) {
    throw new Error('Target directory not found');
  }

  createCleanOutputDir(output);

  const pagesPath = nodePath.join(output, 'pages');
  const pages = createPages(pagesPath, target, {});
  if (pages) {
    setupPages(pages, output);
  }

  return pages;
}

function createCleanOutputDir(output) {
  removeDir(output);
  createDir(output);
}

function createPages(outputPath, targetPath, config) {
  const result = {
    dirName: nodePath.basename(outputPath),
  };

  createDir(outputPath);

  const filesPath = [];
  forEachFile(targetPath, (filePath) => {
    const fileName = nodePath.basename(filePath);
    filesPath.push({ filePath, fileName });
  });
  result.pages = createDirPages(outputPath, filesPath, config);

  result.dirs = [];
  forEachDir(targetPath, (dirPath) => {
    const dirName = nodePath.basename(dirPath);
    const dirPages = createPages(nodePath.join(outputPath, dirName), dirPath, config);
    if (dirPages) {
      result.dirs.push(dirPages);
    }
  });

  return result.pages.length || result.dirs.length
    ? result
    : null;
}

function createDirPages(outputPath, filesPath, config) {
  const { ext = '.md' } = config;
  const shouldBePage = (fileName) => fileName.endsWith(ext);

  filesPath
    .filter(({ fileName }) => !shouldBePage(fileName))
    .forEach(({ filePath, fileName }) => copyResource(outputPath, filePath, fileName, ext, false));

  return filesPath
    .filter(({ fileName }) => shouldBePage(fileName))
    .map(({ filePath, fileName }) => copyResource(outputPath, filePath, fileName, ext, true));
}

function copyResource(outputPath, filePath, fileName, ext, isPage) {
  let outputFileName = fileName;
  let content = getFileContent(filePath);
  let metadata;

  if (isPage) {
    outputFileName = `${fileName.substring(0, fileName.length - ext.length)}.html`;
    metadata = extractMetadataFromMd(content);
    content = md2html(content);
  }

  const outputFilePath = nodePath.join(outputPath, outputFileName);
  if (existsFile(outputFilePath)) {
    logger.warn(`Already exist a file with the same name ${filePath}`);
  }

  createFile(outputFilePath, content);
  return {
    isPage,
    outputFilePath,
    outputFileName,
    metadata,
  };
}

function extractMetadataFromMd(/* content */) {
  return {};
}

function createNavMd(pages, deep = 0) {
  const result = pages.pages.map(({ outputFilePath, outputFileName }) => `${'\t'.repeat(deep)}- [${outputFileName}](/${outputFilePath})`);

  pages.dirs.forEach((item) => {
    result.push(`${'\t'.repeat(deep)}- [${item.dirName}](#)`);
    result.push(...createNavMd(item, deep + 1));
  });

  return result;
}

function setupPages(pages, output, theme = 'default') {
  const navMd = createNavMd(pages)
    .map((item) => item.replace(`${output}${nodePath.sep}`, ''))
    .join('\n');
  const navHtml = md2html(navMd);
  const indexHtmlContent = (getFileContent(`lib/themes/${theme}/index.html`) || '{{ main }}')
    .replace('{{ nav }}', navHtml);

  createFile(
    nodePath.join(output, 'index.html'),
    indexHtmlContent.replace('{{ main }}', 'Documentation'),
  );

  const pagesList = [pages];
  while (pagesList.length) {
    const pageItem = pagesList.shift();
    pageItem.pages.forEach(({ outputFilePath }) => {
      const fileContent = indexHtmlContent
        .replace('{{ main }}', getFileContent(outputFilePath));
      createFile(outputFilePath, fileContent);
    });

    pagesList.push(...pageItem.dirs);
  }
}

module.exports = md2doc;
