const fs = require('fs');
const path = require('path');

const statsPath = (p) => {
  try {
    return fs.statSync(p);
  } catch (ex) {
    return null;
  }
};

const existsDir = (dirPath) => statsPath(dirPath)?.isDirectory();

const existsFile = (filePath) => statsPath(filePath)?.isFile();

const createDir = (dirPath) => existsDir(dirPath) || fs.mkdirSync(dirPath, { recursive: true });

const writeFile = (filePath, content = '') => {
  createDir(path.dirname(filePath));
  fs.openSync(filePath, 'w');
  fs.writeFileSync(filePath, content, 'utf8');
};

const copyFile = (fromPath, toPath) => {
  createDir(path.dirname(toPath));
  fs.copyFileSync(fromPath, toPath);
};

const removeDir = (dirPath) => existsDir(dirPath) && fs.rmdirSync(dirPath, { recursive: true });

const forEach = (dirPath, callback) => {
  if (!existsDir(dirPath)) {
    return;
  }

  fs.readdirSync(dirPath)
    .forEach((dirName) => {
      const newPath = path.join(dirPath, dirName);
      callback(newPath, {
        isDir: existsDir(newPath),
        isFile: existsFile(newPath),
      });
    });
};

const forEachDir = (dirPath, callback) => forEach(dirPath, (p, { isDir }) => isDir && callback(p));

const forEachFile = (fileP, callback) => forEach(fileP, (p, { isFile }) => isFile && callback(p));

const getFileContent = (filePath) => (existsFile(filePath) ? fs.readFileSync(filePath, 'utf8') : null);

const copyDir = (fromPath, toPath) => {
  createDir(toPath);
  forEachFile(fromPath, (p) => copyFile(p, path.join(toPath, path.basename(p))));
  forEachDir(fromPath, (p) => {
    copyDir(p, path.join(toPath, path.basename(p)));
  });
};

module.exports = {
  existsDir,
  existsFile,
  createDir,
  writeFile,
  copyFile,
  removeDir,
  forEachDir,
  forEachFile,
  getFileContent,
  copyDir,
};
