const cheerio = require('cheerio');
const jsBeautify = require('js-beautify');
const { getFileContent, writeFile } = require('./fs');

const prettifyHtml = (htmlStr) => jsBeautify.html(htmlStr, {
  extra_liners: [],
  'indent-size': 1,
  'indent-char': '  ',
  'preserve-newlines': false,
});

const loadDocument = ({ html, filePath, useHtml }) => {
  const args = [html || getFileContent(filePath)];
  // if (!useHtml) {
  //   args.push(null, false);
  // }
  return cheerio.load(...args);
};

const findAll = ($document, selector) => {
  const result = [];
  $document(selector).each((i, node) => result.push($document(node)));
  return result;
};

const find = ($document, selector) => findAll($document, selector)[0];

const addElement = ($document, selector, element) => $document(selector).append(element);

const removeNode = (node) => node && node.remove();

const html = ($document) => prettifyHtml($document.root().html());

const saveTo = ($document, filePath) => writeFile(filePath, html($document));

const tagName = (node) => (node[0] ? node[0].tagName : '');

const content = (node) => (node ? node.text() : '');

const removeAttr = (node, attrName) => node.removeAttr(attrName);

const addAttr = (node, attrName, value) => node.attr(attrName, value);

const attr = (node, attrName) => node.attr(attrName);

const addElementToNode = (node, element) => node.append(element);

module.exports = {
  loadDocument,
  findAll,
  find,
  addElement,
  removeNode,
  html,
  saveTo,
  tagName,
  content,
  removeAttr,
  addAttr,
  attr,
  addElementToNode,
  prettifyHtml,
};
