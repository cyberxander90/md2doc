const showdown = require('showdown');

const converter = new showdown.Converter();

function md2html(content) {
  return converter.makeHtml(content);
}

module.exports = md2html;
