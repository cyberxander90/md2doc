const mockFs = require('mock-fs');
const fs = require('fs');
const {
  md2html,
  generateTableOfContents,
  generateSiteNav,
  prettifyHtml,
  HtmlParser,
} = require('./html');

describe('html-helpers', () => {
  describe('#md2html', () => {
    const subject = md2html;
    it('convert markdown to html', () => {
      [
        {
          mdContent: '# hello, markdown!',
          expected: '<h1 id="hellomarkdown">hello, markdown!</h1>',
        },
      ].forEach(({ mdContent, expected }) => expect(subject(mdContent)).toBe(expected));
    });
  });

  describe('#generateTableOfContents', () => {
    it('generate a table of contents from a list of headers', () => {
      [
        {
          headers: '<div></div>',
          expected: '<ul></ul>',
        },
        {
          headers: `
<h1>item-1</h1>
<h1>item-2</h1>
`,
          expected: `
<ul>
  <li>item-1</li>
  <li>item-2</li>
</ul>
          `.trim(),
        },
        {
          headers: `
<h2>item-1</h2>
<h2>item-2</h2>
          `,
          expected: `
<ul>
  <li>item-1</li>
  <li>item-2</li>
</ul>
          `.trim(),
        },
        {
          headers: `
<h1>item-1</h1>
<h2>item-2</h2>
<h3>item-3</h3>
          `,
          expected: `
<ul>
  <li>item-1<ul>
      <li>item-2<ul>
          <li>item-3</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>
          `.trim(),
        },
        {
          headers: `
<h1>item-1</h1>
<h2>item-2</h2>
<h3>item-3</h3>
<h2>item-4</h2>
          `,
          expected: `
<ul>
  <li>item-1<ul>
      <li>item-2<ul>
          <li>item-3</li>
        </ul>
      </li>
      <li>item-4</li>
    </ul>
  </li>
</ul>
          `.trim(),
        },
        {
          headers: `
<h2>item-1</h2>
<h2>item-2</h2>
<h5>item-3</h5>
<h3>item-4</h3>
<h2>item-5</h2>
          `,
          expected: `
<ul>
  <li>item-1</li>
  <li>item-2<ul>
      <li>item-3</li>
    </ul>
  </li>
  <li>item-4</li>
  <li>item-5</li>
</ul>
          `.trim(),
        },
        {
          headers: `
<h1>item-1</h1>
<h2>item-2</h2>
<h3>item-3</h3>
<h1>item-4</h1>
<h2>item-5</h2>
<h3>item-6</h3>
<h1>item-7</h1>
<h2>item-8</h2>
          `,
          expected: `
<ul>
  <li>item-1<ul>
      <li>item-2<ul>
          <li>item-3</li>
        </ul>
      </li>
    </ul>
  </li>
  <li>item-4<ul>
      <li>item-5<ul>
          <li>item-6</li>
        </ul>
      </li>
    </ul>
  </li>
  <li>item-7<ul>
      <li>item-8</li>
    </ul>
  </li>
</ul>
          `.trim(),
        },
      ].forEach(({ headers, expected }) => {
        const actual = generateTableOfContents(headers);
        expect(actual).toBe(expected);
      });
    });
  });

  describe('#generateSiteNav', () => {
    it('generate the site nav', () => {
      [
        {
          actual: [
            { fileLink: '/path/to/file.1.1', name: 'file.1.1' },
            { fileLink: '/path/to/file.1.2', name: 'file.1.2' },
            {
              dirName: 'dir.1.1',
              files: [
                { fileLink: '/path/to/file.2.1', name: 'file.2.1' },
                { dirName: 'dir.2.1' },
                { fileLink: '/path/to/file.2.2', name: 'file.2.2' },
                { fileLink: '/path/to/file.2.3', name: 'file.2.3' },
              ],
            },
            { fileLink: '/path/to/file.1.3', name: 'file.1.3' },
          ],
          expected: `
<ul>
  <li><a href="/path/to/file.1.1">file.1.1</a></li>
  <li><a href="/path/to/file.1.2">file.1.2</a></li>
  <li><a href="#">dir.1.1</a>
    <ul>
      <li><a href="/path/to/file.2.1">file.2.1</a></li>
      <li><a href="#">dir.2.1</a></li>
      <li><a href="/path/to/file.2.2">file.2.2</a></li>
      <li><a href="/path/to/file.2.3">file.2.3</a></li>
    </ul>
  </li>
  <li><a href="/path/to/file.1.3">file.1.3</a></li>
</ul>`.trim(),
        },
      ].forEach(({ actual, expected }) => expect(generateSiteNav(actual)).toBe(expected));
    });
  });

  describe('#prettifyHtml', () => {
    it('prettify html', () => {
      expect(prettifyHtml('<html><body><ul><li>Hello</li></ul><li>World</li></body></html>')).toBe(`
<html>
<body>
  <ul>
    <li>Hello</li>
  </ul>
  <li>World</li>
</body>
</html>`.trim());
    });
  });

  describe('#HtmlParser', () => {
    let htmlParser;
    afterEach(() => mockFs.restore());

    const validate = () => {
      it('.addElement', () => {
        htmlParser.addElement('#content', '<div>Hi</div>');
        expect(htmlParser.html()).toBe(`
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

      it('.saveTo', () => {
        htmlParser.addElement('#content', '<div>Hi</div>');
        htmlParser.saveTo('path/to/file2.html');
        expect(fs.readFileSync('path/to/file2.html', 'utf-8')).toBe(`
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

      it('.findAll', () => {
        const actual = htmlParser.findAll('h1, #content')
          .map((node) => ({
            tagName: HtmlParser.tagName(node),
            content: HtmlParser.content(node),
          }));
        expect(actual).toEqual([
          { tagName: 'h1', content: 'Hello World!' },
          { tagName: 'h1', content: 'Hello Sir!' },
          { tagName: 'div', content: '' },
        ]);
      });

      it('.remove', () => {
        htmlParser.removeElement('#content');
        expect(htmlParser.html()).toBe(`
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
    };

    describe('from a file', () => {
      beforeEach(() => {
        mockFs({
          'path/to/file.html': `
<html>
  <head><title>Title</title></head>
  <body>
    <h1>Hello World!</h1>
    <h1>Hello Sir!</h1>
    <div id="content"></div>
  </body>
</html>`.trim(),
        });
        htmlParser = new HtmlParser({ filePath: 'path/to/file.html' });
      });

      validate();
    });

    describe('from an html string', () => {
      beforeEach(() => {
        mockFs({});
        htmlParser = new HtmlParser({
          html: `
          <html>
            <head><title>Title</title></head>
            <body>
              <h1>Hello World!</h1>
              <h1>Hello Sir!</h1>
              <div id="content"></div>
            </body>
          </html>`,
        });
      });

      validate();
    });
  });
});
