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

const convertHeadersToIds = (headers) => {
  const ids = [];
  return headers.map(({ id, ...otherProps }) => {
    let resultId = id;
    let item = ids.find((_item) => _item.id === id);
    if (!item) {
      item = { id, count: 0 };
      ids.push(item);
    }
    if (item.count > 0) {
      resultId += `-${item.count}`;
    }

    item.count += 1;

    resultId = resultId.trim().replace(/\s+/g, '').toLowerCase();
    // resultId = resultId[0] + resultId.substring(1).toLowerCase();
    return {
      text: id,
      id: resultId,
      ...otherProps,
    };
  });
};

const generateTableOfContents = (htmlStr) => {
  const htmlParser = new HtmlParser({ html: htmlStr });
  const headers = htmlParser.findAll('h1, h2, h3, h4, h5, h6')
    .map((node) => ({
      id: HtmlParser.content(node),
      level: Number.parseInt(HtmlParser.tagName(node).replace('h', ''), 10),
    }));
  const headersToId = convertHeadersToIds(headers);

  const generate = (index) => {
    let result = '<ul>';
    let i = index;

    for (i = index; i < headersToId.length; i++) {
      if (headersToId[i].level < headersToId[index].level) {
        i -= 1;
        break;
      }
      result += `<li><a href="#${headersToId[i].id}">${headersToId[i].text}</a>`;
      if (i + 1 < headersToId.length && headersToId[i + 1].level > headersToId[index].level) {
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
