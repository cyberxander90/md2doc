const mockFs = require('mock-fs');
const fs = require('fs');

const md2doc = require('./md2doc');
const logger = require('./logger');

jest.mock('./logger');

describe('md2doc', () => {
  const context = describe;
  const subject = md2doc;

  afterEach(() => mockFs.restore());

  context('when the output directory exists', () => {
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

  context('when the output directory does not exists', () => {
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

  context('when the target directory does not exist', () => {
    let action;

    beforeEach(() => {
      mockFs({});
      action = () => subject({ target: 'doc' });
    });

    it('throws an error', () => {
      expect(action).toThrow('Target directory not found');
    });
  });

  context('when the target directory exists', () => {
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

  context('when there are markdown files', () => {
    beforeEach(() => {
      mockFs({
        doc: {
          'file.md': '# file content',
        },
      });
      subject();
    });

    it('transform the markdown to html', () => {
      expect(fs.existsSync('site/pages/file.html')).toBeTruthy();
      expect(fs.readFileSync('site/pages/file.html', 'utf8')).toBe('<h1 id="filecontent">file content</h1>');
    });

    it('do not copy the markdown file', () => {
      expect(fs.existsSync('site/pages/file.md')).toBeFalsy();
    });
  });

  context('when there are markdown and html files with the same name', () => {
    beforeEach(() => {
      mockFs({
        doc: {
          'file.md': '# file content',
          'file.html': '<p>hi!</p>',
        },
      });
      subject();
    });

    it('transform the markdown', () => {
      expect(fs.existsSync('site/pages/file.html')).toBeTruthy();
      expect(fs.readFileSync('site/pages/file.html', 'utf8')).toBe('<h1 id="filecontent">file content</h1>');
    });

    it('log a warning', () => {
      expect(logger.warn.mock.calls.length).toBe(1);
    });
  });
});
