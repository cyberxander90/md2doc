const showdown = require('showdown');
const $ = require('./html-parser');

const { prettifyHtml } = $;

const createMdConverter = () => {
  const converter = new showdown.Converter();
  converter.setOption('tables', true);
  converter.setOption('tasklists', true);
  return converter;
};

const mdConverter = createMdConverter();

const wrapHeaders = ({ $document, htmlStr, selector = 'body' }) => {
  const $doc = $document || $.loadDocument({ html: htmlStr, useHtml: true });
  const nodes = $.findAll($doc, `${selector} > *`);

  const getHeaderLevel = (node) => Number.parseInt(($.tagName(node).match(/^h([1-6])/) || [])[1], 10) || 0;

  const generate = ($currentSection, level = 0) => {
    while (nodes.length > 0) {
      const [currentNode] = nodes;
      const currentLevel = getHeaderLevel(currentNode);

      if (!currentLevel) {
        $.removeNode(currentNode);
        $.addElementToNode($currentSection, currentNode);
        nodes.shift();
      } else if (currentLevel > level) {
        $.addElementToNode($currentSection, '<section>');
        const newSection = $.find($doc, `${selector} section:last`);
        $.addElementToNode(newSection, currentNode);
        nodes.shift();
        $.addAttr(newSection, 'id', $.attr(currentNode, 'id'));
        $.removeAttr(currentNode, 'id');
        generate(newSection, currentLevel);
      } else {
        return;
      }
    }
  };

  generate($.find($doc, selector));
  return $.html($doc);
};

const md2html = (mdContent, { wrap } = {}) => {
  let result = mdConverter.makeHtml(mdContent);
  if (wrap) {
    result = wrapHeaders({ htmlStr: result });
  }
  return prettifyHtml(result);
};

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

    resultId = resultId
      .trim()
      .split('')
      .filter((i) => i.match(/[a-zA-Z0-9-]/))
      .join('')
      .toLowerCase();
    return {
      text: id,
      id: resultId,
      ...otherProps,
    };
  });
};

const generateTableOfContents = (htmlStr) => {
  const $document = $.loadDocument({ html: htmlStr });
  const headers = $.findAll($document, 'h1, h2, h3, h4, h5, h6')
    .map((node) => ({
      id: $.content(node),
      level: Number.parseInt($.tagName(node).replace('h', ''), 10),
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

  return md2html(generate(processedMdFiles).join('\n'), { });
};

module.exports = {
  md2html,
  generateTableOfContents,
  generateSiteNav,
  prettifyHtml,
  wrapHeaders,
};
