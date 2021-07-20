const showdown = require('showdown');

const converter = new showdown.Converter();
converter.setOption('tables', true);
converter.setOption('tasklists', true);

function md2html(content) {
  return converter.makeHtml(content);
}

module.exports = md2html;
