const showdown = require('showdown');
const cheerio = require('cheerio');
const jsBeautify = require('js-beautify');
const { getFileContent, writeFile } = require('./fs');

const createMdConverter = () => {
  const converter = new showdown.Converter();
  converter.setOption('tables', true);
  converter.setOption('tasklists', true);
  return converter;
};

const mdConverter = createMdConverter();

const prettifyHtml = (htmlStr) => jsBeautify.html(htmlStr, {
  extra_liners: [],
  'indent-size': 1,
  'indent-char': '  ',
});

const md2html = (mdContent) => prettifyHtml(mdConverter.makeHtml(mdContent));

const generateTableOfContents = (htmlStr) => {
  const htmlParser = new HtmlParser({ html: htmlStr });
  const headers = htmlParser.findAll('h1, h2, h3, h4, h5, h6')
    .map((node) => ({
      id: HtmlParser.content(node),
      level: Number.parseInt(HtmlParser.tagName(node).replace('h', ''), 10),
    }));

  const generate = (index) => {
    let result = '<ul>';
    let i = index;

    for (i = index; i < headers.length; i++) {
      if (headers[i].level < headers[index].level) {
        i -= 1;
        break;
      }
      result += `<li>${headers[i].id}`;
      if (i + 1 < headers.length && headers[i + 1].level > headers[index].level) {
        const [nextIndex, subResult] = generate(i + 1);
        i = nextIndex;
        result += subResult;
      }
      result += '</li>';
    }
    result += '</ul>';

    return [i, result];
  };

  return prettifyHtml(generate(0)[1]);
};

/**
 * @param {Array<{ filePath: string?, dirPath: string?, files: ProcessedMdFiles }>} processedMdFiles
 */
const generateSiteNav = (processedMdFiles) => {
  const generate = (items, deep = 0) => {
    const result = [];

    items.forEach(({
      fileLink, name, dirName, files,
    }) => {
      if (fileLink) {
        result.push(`${'\t'.repeat(deep)}- [${name}](${fileLink})`);
      } else {
        result.push(`${'\t'.repeat(deep)}- [${dirName}](#)`);
        if (files) {
          result.push(...generate(files, deep + 1));
        }
      }
    });

    return result;
  };

  return md2html(generate(processedMdFiles).join('\n'));
};

function HtmlParser({ html, filePath }) {
  const htmlStr = html || getFileContent(filePath);
  const $ = cheerio.load(htmlStr);

  this.findAll = (selector) => {
    const result = [];
    $(selector).each((i, node) => result.push($(node)));
    return result;
  };

  this.addElement = (selector, element) => {
    $(selector).append(element);
    return this;
  };

  this.removeElement = (selector) => {
    $(selector).remove();
    return this;
  };

  this.html = () => prettifyHtml($.root().html());

  this.saveTo = (fileP) => {
    writeFile(fileP, this.html());
    return this;
  };
}

HtmlParser.tagName = (node) => (node[0] ? node[0].tagName : '');

HtmlParser.content = (node) => (node ? node.text() : '');

module.exports = {
  md2html,
  generateTableOfContents,
  generateSiteNav,
  prettifyHtml,
  HtmlParser,
};
