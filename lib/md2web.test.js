const mockFs = require('mock-fs');
const fs = require('fs');

const md2web = require('./md2web');
const logger = require('./logger');

jest.mock('./logger');

describe('md2web', () => {
  beforeEach(() => jest.mock('./logger'));
  afterEach(() => [mockFs.restore(), jest.clearAllMocks()]);

  describe('when the output directory exists', () => {
    beforeEach(() => {
      mockFs({ 'out/file.txt': 'file content' });
      md2web();
    });

    it('clear the directory contents', () => {
      expect(fs.existsSync('out')).toBeTruthy();
      expect(fs.existsSync('out/file.txt')).toBeFalsy();
    });
  });

  describe('when the output directory does not exists', () => {
    beforeEach(() => {
      mockFs({ });
      md2web();
    });

    it('create a new directory', () => {
      expect(fs.existsSync('out')).toBeTruthy();
    });
  });

  describe('when the input directory does not exist', () => {
    beforeEach(() => {
      mockFs({});
      md2web({ inputDir: 'dir' });
    });

    it('logs an error', () => {
      expect(logger.error.mock.calls.length).toBe(1);
    });

    it('do not create any site', () => {
      expect(fs.existsSync('out')).toBeFalsy();
    });
  });

  describe('when the input directory exists', () => {
    beforeEach(() => {
      mockFs({
        'file1.txt': 'file1 content',
        'dir/file2.html': 'file2 content',
      });
      md2web();
    });

    it('copy and keep the same files structure to the output pages', () => {
      expect(fs.existsSync('out/pages/file1.txt')).toBeTruthy();
      expect(fs.readFileSync('out/pages/file1.txt', 'utf8')).toBe('file1 content');

      expect(fs.existsSync('out/pages/dir/file2.html')).toBeTruthy();
      expect(fs.readFileSync('out/pages/dir/file2.html', 'utf8')).toBe('file2 content');
    });
  });

  describe('with a theme', () => {
    beforeEach(() => {
      mockFs({
        'lib/themes/default/index.html': 'file content',
        'lib/themes/default/assets/site.css': 'styles',
        'lib/themes/default/assets/site.js': 'scripts',
      });
      md2web();
    });

    it('copy all the content inside the default theme folder to the output', () => {
      expect(fs.readFileSync('out/index.html', 'utf8')).toBe(`
<html>
<head></head>
<body>file content</body>
</html>`.trim());
      expect(fs.readFileSync('out/assets/site.css', 'utf8')).toBe('styles');
      expect(fs.readFileSync('out/assets/site.js', 'utf8')).toBe('scripts');
    });
  });

  describe('when there are markdown files', () => {
    const mockInputFiles = {
      'cypress.md': `
# API
Cypress Apy

## Assertions
All Assertions 
      `,
      'django/django-3.md': `
# Django documentation
Everything you need to know about Django.

# Getting help
Having trouble? We’d like to help!
      `,
      'django/django-4.md': `
- tutorials
- guides
- references
      `,
    };

    beforeEach(() => {
      mockFs(mockInputFiles);
      md2web();
    });

    it('transform the .md to .html', () => {
      expect(fs.existsSync('out/pages/cypress.html')).toBeTruthy();
      expect(fs.existsSync('out/pages/django/django-3.html')).toBeTruthy();
      expect(fs.existsSync('out/pages/django/django-4.html')).toBeTruthy();
    });

    it('do not copy the markdown file', () => {
      expect(fs.existsSync('out/pages/cypress.md')).toBeFalsy();
      expect(fs.existsSync('out/pages/django/django-3.md')).toBeFalsy();
      expect(fs.existsSync('out/pages/django/django-4.md')).toBeFalsy();
    });

    describe('and a default theme', () => {
      beforeEach(() => {
        mockFs({
          'lib/themes/default/index.html': `
            <html>
              <body>
                <div id="site-nav"></div>
                <div id="main"></div>
                <div id="table-of-contents"></div>
              </body>
            </html>
          `,
          ...mockInputFiles,
        });
        md2web();
      });

      it('transform md to html and include the site navigation and table of contents', () => {
        expect(fs.readFileSync('out/pages/cypress.html', 'utf8')).toBe(`
<html>
<head></head>
<body>
  <div id="site-nav">
    <ul>
      <li><a href="/pages/cypress.html">cypress</a></li>
      <li><a href="#">django</a>
        <ul>
          <li><a href="/pages/django/django-3.html">django-3</a></li>
          <li><a href="/pages/django/django-4.html">django-4</a></li>
        </ul>
      </li>
    </ul>
  </div>
  <div id="main">
    <h1 id="api">API</h1>
    <p>Cypress Apy</p>
    <h2 id="assertions">Assertions</h2>
    <p>All Assertions </p>
  </div>
  <div id="table-of-contents">
    <ul>
      <li>API<ul>
          <li>Assertions</li>
        </ul>
      </li>
    </ul>
  </div>


</body>
</html>`.trim());
        expect(fs.readFileSync('out/pages/django/django-3.html', 'utf8')).toBe(`
<html>
<head></head>
<body>
  <div id="site-nav">
    <ul>
      <li><a href="/pages/cypress.html">cypress</a></li>
      <li><a href="#">django</a>
        <ul>
          <li><a href="/pages/django/django-3.html">django-3</a></li>
          <li><a href="/pages/django/django-4.html">django-4</a></li>
        </ul>
      </li>
    </ul>
  </div>
  <div id="main">
    <h1 id="djangodocumentation">Django documentation</h1>
    <p>Everything you need to know about Django.</p>
    <h1 id="gettinghelp">Getting help</h1>
    <p>Having trouble? We’d like to help!</p>
  </div>
  <div id="table-of-contents">
    <ul>
      <li>Django documentation</li>
      <li>Getting help</li>
    </ul>
  </div>


</body>
</html>`.trim());
        expect(fs.readFileSync('out/pages/django/django-4.html', 'utf8')).toBe(`
<html>
<head></head>
<body>
  <div id="site-nav">
    <ul>
      <li><a href="/pages/cypress.html">cypress</a></li>
      <li><a href="#">django</a>
        <ul>
          <li><a href="/pages/django/django-3.html">django-3</a></li>
          <li><a href="/pages/django/django-4.html">django-4</a></li>
        </ul>
      </li>
    </ul>
  </div>
  <div id="main">
    <ul>
      <li>tutorials</li>
      <li>guides</li>
      <li>references</li>
    </ul>
  </div>
  <div id="table-of-contents">
    <ul></ul>
  </div>


</body>
</html>`.trim());
      });

      it('transform the index.html to include the site navigation', () => {
        expect(fs.readFileSync('out/index.html', 'utf8')).toBe(`
<html>
<head></head>
<body>
  <div id="site-nav">
    <ul>
      <li><a href="/pages/cypress.html">cypress</a></li>
      <li><a href="#">django</a>
        <ul>
          <li><a href="/pages/django/django-3.html">django-3</a></li>
          <li><a href="/pages/django/django-4.html">django-4</a></li>
        </ul>
      </li>
    </ul>
  </div>
  <div id="main">Dev Docs</div>



</body>
</html>`.trim());
      });
    });

    describe('and already exists html files with the same name', () => {
      beforeEach(() => {
        mockFs({
          'file.md': '# file content',
          'file.html': '<p>hi!</p>',
        });
        md2web();
      });

      it('transform the .md to .html', () => {
        expect(fs.existsSync('out/pages/file.html')).toBeTruthy();
        expect(fs.readFileSync('out/pages/file.html', 'utf8')).toBe('<h1 id="filecontent">file content</h1>');
      });

      it('log a warning', () => {
        expect(logger.warn.mock.calls.length).toBe(1);
      });
    });
  });
});
