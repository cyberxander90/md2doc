const fs = require('fs');
const nodePath = require('path');

function statsPath(path) {
  try {
    return fs.statSync(path);
  } catch (ex) {
    return null;
  }
}

function existsDir(path) {
  const stats = statsPath(path);
  return stats && stats.isDirectory();
}

function existsFile(path) {
  const stats = statsPath(path);
  return stats && stats.isFile();
}

function createDir(path) {
  return !existsDir(path) && fs.mkdirSync(path, { recursive: true });
}

function createFile(path, content = '') {
  createDir(nodePath.dirname(path));
  fs.openSync(path, 'w');
  fs.writeFileSync(path, content, 'utf8');
}

function copyFile(fromPath, toPath) {
  createDir(nodePath.dirname(toPath));
  fs.copyFileSync(fromPath, toPath);
}

function removeDir(path) {
  return existsDir(path) && fs.rmdirSync(path, { recursive: true });
}

function forEach(path, callback, { isDirectory = false, isFile = false } = {}) {
  if (!existsDir(path)) {
    return;
  }

  const dir = fs.readdirSync(path);

  dir.forEach((dirName) => {
    const newPath = nodePath.join(path, dirName);
    if ((isDirectory && existsDir(newPath)) || (isFile && existsFile(newPath))) {
      callback(newPath);
    }
  });
}

function forEachDir(path, callback) {
  forEach(path, callback, { isDirectory: true });
}

function forEachFile(path, callback) {
  forEach(path, callback, { isFile: true });
}

function getFileContent(path) {
  if (!existsFile(path)) {
    return null;
  }
  return fs.readFileSync(path, 'utf8');
}

module.exports = {
  existsDir,
  existsFile,
  createDir,
  createFile,
  copyFile,
  removeDir,
  forEachDir,
  forEachFile,
  getFileContent,
};
