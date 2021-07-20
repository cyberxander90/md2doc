const mockFs = require('mock-fs');
const fs = require('fs');

const md2docs = require('./md2docs');
const logger = require('./logger');

jest.mock('./logger');

describe('md2docs', () => {
  const subject = md2docs;

  beforeEach(() => jest.mock('./logger'));
  afterEach(() => {
    mockFs.restore();
    jest.clearAllMocks();
  });

  describe('when the output directory exists', () => {
    beforeEach(() => {
      mockFs({
        site: {
          'file.txt': 'file content',
        },
        doc: {},
      });
      subject({ output: 'site' });
    });

    it('clear the directory contents', () => {
      expect(fs.existsSync('site')).toBeTruthy();
      expect(fs.existsSync('site/file.txt')).toBeFalsy();
    });
  });

  describe('when the output directory does not exists', () => {
    beforeEach(() => {
      mockFs({
        doc: {},
      });
      subject({ output: 'site' });
    });

    it('create a new directory', () => {
      expect(fs.existsSync('site')).toBeTruthy();
    });
  });

  describe('when the target directory does not exist', () => {
    beforeEach(() => {
      mockFs({});
      subject({ target: 'doc' });
    });

    it('logs an error', () => {
      expect(logger.error.mock.calls.length).toBe(1);
      expect(logger.error.mock.calls[0][0]).toBe('Target directory not found');
    });

    it('do not create any site', () => {
      expect(fs.existsSync('site')).toBeFalsy();
    });
  });

  describe('when the target directory exists', () => {
    beforeEach(() => {
      mockFs({
        doc: {
          'file1.txt': 'file1 content',
          dir: {
            'file2.html': 'file2 content',
          },
        },
      });
      subject({ target: 'doc' });
    });

    it('copy and keep the same files structure to the output pages', () => {
      expect(fs.existsSync('site/pages/file1.txt')).toBeTruthy();
      expect(fs.readFileSync('site/pages/file1.txt', 'utf8')).toBe('file1 content');

      expect(fs.existsSync('site/pages/dir/file2.html')).toBeTruthy();
      expect(fs.readFileSync('site/pages/dir/file2.html', 'utf8')).toBe('file2 content');
    });
  });

  describe('when there are markdown files', () => {
    beforeEach(() => {
      mockFs({
        doc: {
          'file.md': '# file content',
        },
      });
      subject();
    });

    it('transform the .md to .html', () => {
      expect(fs.existsSync('site/pages/file.html')).toBeTruthy();
      expect(fs.readFileSync('site/pages/file.html', 'utf8')).toBe('<h1 id="filecontent">file content</h1>');
    });

    it('do not copy the markdown file', () => {
      expect(fs.existsSync('site/pages/file.md')).toBeFalsy();
    });
  });

  describe('when there are markdown and html files with the same name', () => {
    beforeEach(() => {
      mockFs({
        doc: {
          'file.md': '# file content',
          'file.html': '<p>hi!</p>',
        },
      });
      subject();
    });

    it('transform the .md to .html', () => {
      expect(fs.existsSync('site/pages/file.html')).toBeTruthy();
      expect(fs.readFileSync('site/pages/file.html', 'utf8')).toBe('<h1 id="filecontent">file content</h1>');
    });

    it('log a warning', () => {
      expect(logger.warn.mock.calls.length).toBe(1);
      expect(logger.warn.mock.calls[0][0]).toBe("Already exist a file: 'doc/file.md'.");
    });
  });

  describe('themes', () => {
    beforeEach(() => {
      mockFs({
        'lib/themes/default': {
          'index.html': 'file content',
          assets: {
            'site.css': 'styles',
            'site.js': 'scripts',
          },
        },
        doc: {},
      });
      subject();
    });

    it('copy all the content inside the default theme folder to the output', () => {
      expect(fs.readFileSync('site/index.html', 'utf8')).toBe('file content');
      expect(fs.readFileSync('site/assets/site.css', 'utf8')).toBe('styles');
      expect(fs.readFileSync('site/assets/site.js', 'utf8')).toBe('scripts');
    });
  });
});
