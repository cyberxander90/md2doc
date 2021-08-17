const mockFs = require('mock-fs');
const fs = require('fs');
const $ = require('./html-parser');

describe('html-parser', () => {
  const htmlStr = `
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h1>Hello Sir!</h1>
  <div id="content"></div>
</body>
</html>
  `.trim();
  let $doc;

  beforeEach(() => { $doc = $.loadDocument({ html: htmlStr }); });
  afterEach(() => mockFs.restore());

  describe('#loadDocument', () => {
    it('load a document from a string', () => {
      mockFs({});
      const $document = $.loadDocument({ html: htmlStr });

      $.saveTo($document, 'index.html');
      expect(fs.readFileSync('index.html', 'utf8')).toBe(`
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h1>Hello Sir!</h1>
  <div id="content"></div>
</body>
</html>
  `.trim());
    });

    it('load a document from a file', () => {
      mockFs({ 'my-file.html': htmlStr });
      const $document = $.loadDocument({ filePath: 'my-file.html' });

      $.saveTo($document, 'index.html');
      expect(fs.readFileSync('index.html', 'utf8')).toBe(`
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h1>Hello Sir!</h1>
  <div id="content"></div>
</body>
</html>
  `.trim());
    });
  });

  describe('#findAll', () => {
    it('retrieve all nodes that match selector', () => {
      const actual = $.findAll($doc, 'h1, #content')
        .map((node) => ({
          tagName: $.tagName(node),
          content: $.content(node),
        }));
      expect(actual).toEqual([
        { tagName: 'h1', content: 'Hello World!' },
        { tagName: 'h1', content: 'Hello Sir!' },
        { tagName: 'div', content: '' },
      ]);
    });
  });

  describe('#find', () => {
    it('retrieve first node that match selector', () => {
      const node = $.find($doc, 'h1, #content');
      expect($.tagName(node)).toBe('h1');
      expect($.content(node)).toBe('Hello World!');
    });
  });

  describe('#addElement', () => {
    it('add element to the document', () => {
      $.addElement($doc, '#content', '<div>Hi</div>');
      expect($.html($doc)).toBe(`
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h1>Hello Sir!</h1>
  <div id="content">
    <div>Hi</div>
  </div>
</body>
</html>`.trim());
    });
  });

  describe('#removeNode', () => {
    it('remove the node from the doc', () => {
      $.removeNode($.find($doc, '#content'));
      expect($.html($doc)).toBe(`
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h1>Hello Sir!</h1>
</body>
</html>`.trim());
    });
  });

  describe('#html', () => {
    it('return the html string', () => {
      expect($.html($doc)).toBe(`
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h1>Hello Sir!</h1>
  <div id="content"></div>
</body>
</html>`.trim());
    });
  });

  describe('#saveTo', () => {
    it('save the html string to a file', () => {
      mockFs({ 'my-file.html': htmlStr });
      $.saveTo($doc, 'index.html');
      expect(fs.readFileSync('index.html', 'utf8')).toBe(`
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!</h1>
  <h1>Hello Sir!</h1>
  <div id="content"></div>
</body>
</html>
  `.trim());
    });
  });

  describe('#tagName', () => {
    it('returns the node tag name', () => {
      const node = $.find($doc, '#content');
      expect($.tagName(node)).toBe('div');
    });
  });

  describe('#content', () => {
    it('returns the node html content', () => {
      const node = $.find($doc, 'h1');
      expect($.content(node)).toBe('Hello World!');
    });
  });

  describe('#addElementToNode', () => {
    it('add element to a node', () => {
      const node = $.find($doc, 'h1');
      $.addElementToNode(node, '<p>Yes</p>');
      expect($.html($doc)).toBe(`
<html>
<head>
  <title>Title</title>
</head>
<body>
  <h1>Hello World!<p>Yes</p>
  </h1>
  <h1>Hello Sir!</h1>
  <div id="content"></div>
</body>
</html>`.trim());
    });
  });
});
