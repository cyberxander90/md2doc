const {
  md2html,
  generateTableOfContents,
  generateSiteNav,
  prettifyHtml,
} = require('./html');

describe('html-helpers', () => {
  describe('#md2html', () => {
    const subject = md2html;
    it('convert markdown to html', () => {
      [
        {
          mdContent: '# hello, markdown!',
          expected: `
<html>
<head></head>
<body>
  <section id="hellomarkdown">
    <h1>hello, markdown!</h1>
  </section>
</body>
</html>`,
        },
        {
          mdContent: `
# header 1
paragraph 1

# header 2
paragraph 2

## header 3
paragraph 3
`,
          expected: `
<html>
<head></head>
<body>
  <section id="header1">
    <h1>header 1</h1>
    <p>paragraph 1</p>
  </section>
  <section id="header2">
    <h1>header 2</h1>
    <p>paragraph 2</p>
    <section id="header3">
      <h2>header 3</h2>
      <p>paragraph 3</p>
    </section>
  </section>
</body>
</html>`,
        },
        {
          mdContent: `
# header 1
paragraph 1

## header 2
paragraph 2

## header 3
paragraph 3

# header 3
paragraph 4
`,
          expected: `
<html>
<head></head>
<body>
  <section id="header1">
    <h1>header 1</h1>
    <p>paragraph 1</p>
    <section id="header2">
      <h2>header 2</h2>
      <p>paragraph 2</p>
    </section>
    <section id="header3">
      <h2>header 3</h2>
      <p>paragraph 3</p>
    </section>
  </section>
  <section id="header3-1">
    <h1>header 3</h1>
    <p>paragraph 4</p>
  </section>
</body>
</html>`,
        },
      ].forEach(({ mdContent, expected }) => expect(
        subject(mdContent, { wrap: true }),
      ).toBe(expected.trim()));
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
  <li><a href="#item-1">item-1</a></li>
  <li><a href="#item-2">item-2</a></li>
</ul>
          `.trim(),
        },
        {
          headers: `
<h1>Hello World</h1>
<h1>Hello World</h1>
<h1>bye</h1>
<h1>Hello World</h1>
`,
          expected: `
<ul>
  <li><a href="#helloworld">Hello World</a></li>
  <li><a href="#helloworld-1">Hello World</a></li>
  <li><a href="#bye">bye</a></li>
  <li><a href="#helloworld-2">Hello World</a></li>
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
  <li><a href="#item-1">item-1</a></li>
  <li><a href="#item-2">item-2</a></li>
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
  <li><a href="#item-1">item-1</a>
    <ul>
      <li><a href="#item-2">item-2</a>
        <ul>
          <li><a href="#item-3">item-3</a></li>
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
  <li><a href="#item-1">item-1</a>
    <ul>
      <li><a href="#item-2">item-2</a>
        <ul>
          <li><a href="#item-3">item-3</a></li>
        </ul>
      </li>
      <li><a href="#item-4">item-4</a></li>
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
  <li><a href="#item-1">item-1</a></li>
  <li><a href="#item-2">item-2</a>
    <ul>
      <li><a href="#item-3">item-3</a></li>
    </ul>
  </li>
  <li><a href="#item-4">item-4</a></li>
  <li><a href="#item-5">item-5</a></li>
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
  <li><a href="#item-1">item-1</a>
    <ul>
      <li><a href="#item-2">item-2</a>
        <ul>
          <li><a href="#item-3">item-3</a></li>
        </ul>
      </li>
    </ul>
  </li>
  <li><a href="#item-4">item-4</a>
    <ul>
      <li><a href="#item-5">item-5</a>
        <ul>
          <li><a href="#item-6">item-6</a></li>
        </ul>
      </li>
    </ul>
  </li>
  <li><a href="#item-7">item-7</a>
    <ul>
      <li><a href="#item-8">item-8</a></li>
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
});
