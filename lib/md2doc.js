const nodePath = require('path');
const {
  existsDir,
  existsFile,
  createDir,
  createFile,
  copyFile,
  removeDir,
  forEachDir,
  forEachFile,
  getFileContent,
} = require('./fs');
const md2html = require('./md2html');
const logger = require('./logger');

function md2doc(config = {}) {
  const {
    output = 'site',
    target = 'doc',
    theme = 'default',
  } = config;

  if (!existsDir(target)) {
    logger.error('Target directory not found');
    return null;
  }

  removeDir(output);
  createDir(output);

  copyTheme(output, `lib/themes/${theme}`);
  const pagesPath = nodePath.join(output, 'pages');
  const pages = createPages(pagesPath, target, {});
  setupPages(pages, output);

  return pages;
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
    if (dirPages.pages.length || dirPages.dirs.length) {
      result.dirs.push(dirPages);
    }
  });

  return result;
}

function createDirPages(outputPath, filesPath, config) {
  const { ext = '.md' } = config;
  const shouldBePage = (fileName) => fileName.endsWith(ext);

  const list1 = filesPath
    .filter(({ fileName }) => !shouldBePage(fileName))
    .map(({ filePath, fileName }) => copyResource(outputPath, filePath, fileName, ext, false));

  const list2 = filesPath
    .filter(({ fileName }) => shouldBePage(fileName))
    .map(({ filePath, fileName }) => copyResource(outputPath, filePath, fileName, ext, true));

  return [...list1, ...list2];
}

function copyResource(outputPath, filePath, fileName, ext, isPage) {
  let outputFileName = fileName;
  let outputFilePath = nodePath.join(outputPath, outputFileName);
  let metadata;

  if (isPage) {
    outputFileName = `${fileName.substring(0, fileName.length - ext.length)}.html`;
    outputFilePath = nodePath.join(outputPath, outputFileName);
    let content = getFileContent(filePath);
    metadata = extractMetadataFromMd(content);
    content = md2html(content);
    createFile(outputFilePath, content);
    if (existsFile(outputFilePath)) {
      logger.warn(`Already exist a file: '${filePath}'.`);
    }
  } else {
    copyFile(filePath, outputFilePath);
  }

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

function copyTheme(outputPath, targetPath) {
  forEachFile(targetPath, (filePath) => {
    copyFile(filePath, nodePath.join(outputPath, nodePath.basename(filePath)));
  });
  forEachDir(targetPath, (dirPath) => {
    copyTheme(nodePath.join(outputPath, nodePath.basename(dirPath)), dirPath);
  });
}

function setupPages(pages, output) {
  const navMd = createNavMd(pages)
    .map((item) => item.replace(`${output}${nodePath.sep}`, ''))
    .join('\n');
  const navHtml = md2html(navMd);
  const indexHtmlContent = (getFileContent(`${output}/index.html`) || '{{ main }}')
    .replace('{{ nav }}', navHtml);

  createFile(
    nodePath.join(output, 'index.html'),
    indexHtmlContent.replace('{{ main }}', 'Documentation'),
  );

  const pagesList = [pages];
  while (pagesList.length) {
    const pageItem = pagesList.shift();
    pageItem.pages
      .filter(({ isPage }) => isPage)
      .forEach(({ outputFilePath }) => {
        const fileContent = indexHtmlContent.replace('{{ main }}', getFileContent(outputFilePath));
        createFile(outputFilePath, fileContent);
      });

    pagesList.push(...pageItem.dirs);
  }
}

function createNavMd(pages, deep = 0) {
  const result = pages.pages
    .filter(({ isPage }) => isPage)
    .map(({ outputFilePath, outputFileName }) => `${'\t'.repeat(deep)}- [${outputFileName}](/${outputFilePath})`);

  pages.dirs.forEach((item) => {
    result.push(`${'\t'.repeat(deep)}- [${item.dirName}](#)`);
    result.push(...createNavMd(item, deep + 1));
  });

  return result;
}

module.exports = md2doc;
