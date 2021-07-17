const mockFs = require('mock-fs');
const fs = require('fs');
const {
  existsDir,
  existsFile,
  createDir,
  createFile,
  removeDir,
  forEachDir,
  forEachFile,
  getFileContent,
} = require('./fs');

describe('fs', () => {
  afterEach(() => mockFs.restore());

  describe('#existsDir', () => {
    const subject = existsDir;
    let response;

    describe('when the directory exists', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            'file.txt': 'file content',
          },
        });
        response = subject('path/to/dir');
      });

      it('returns true', () => {
        expect(response).toBeTruthy();
      });
    });

    describe('when the directory does not exist', () => {
      beforeEach(() => {
        mockFs({ });
        response = subject('path/to/dir');
      });

      it('return false', () => {
        expect(response).toBeFalsy();
      });
    });
  });

  describe('#existsFile', () => {
    const subject = existsFile;
    let response;

    describe('when the file exists', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            'file.txt': 'file content',
          },
        });
        response = subject('path/to/dir/file.txt');
      });

      it('returns true', () => {
        expect(response).toBeTruthy();
      });
    });

    describe('when the file does not exist', () => {
      beforeEach(() => {
        mockFs({ });
        response = subject('path/to/dir/file.txt');
      });

      it('return false', () => {
        expect(response).toBeFalsy();
      });
    });
  });

  describe('#createDir', () => {
    const subject = createDir;

    describe('when the directory exists', () => {
      let action;

      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            'file.txt': 'file content',
          },
        });
        action = () => subject('path/to/dir');
      });

      it('do not throw an error', () => {
        expect(action).not.toThrow();
      });

      it('do not clear the directory', () => {
        action();
        expect(fs.existsSync('path/to/dir/file.txt')).toBe(true);
      });
    });

    describe('when the directory does not exist', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            'file.txt': 'file content',
          },
        });
        subject('path/to/new/dir');
      });

      it('creates the directory', () => {
        expect(fs.existsSync('path/to/new/dir')).toBe(true);
      });
    });
  });

  describe('#createFile', () => {
    const subject = createFile;

    describe('when the file exists', () => {
      let action;

      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            'file.txt': 'file content',
          },
        });
        action = () => subject('path/to/dir/file.txt', 'hello world');
      });

      it('do not throw an error', () => {
        expect(action).not.toThrow();
      });

      it('overwrite the file content', () => {
        action();
        expect(fs.existsSync('path/to/dir/file.txt')).toBe(true);
        expect(fs.readFileSync('path/to/dir/file.txt', 'utf-8')).toBe('hello world');
      });
    });

    describe('when the file does not exist', () => {
      beforeEach(() => {
        mockFs({ });
        subject('path/to/dir/file.txt', 'hello world');
      });

      it('creates the file with the content', () => {
        expect(fs.existsSync('path/to/dir/file.txt')).toBe(true);
        expect(fs.readFileSync('path/to/dir/file.txt', 'utf-8')).toBe('hello world');
      });
    });
  });

  describe('#removeDir', () => {
    const subject = removeDir;

    describe('when the directory does not exist', () => {
      let action;

      beforeEach(() => {
        mockFs({ });
        action = () => subject('path/to/new/dir');
      });

      it('does not throw an error', () => {
        expect(action).not.toThrow();
      });
    });

    describe('when the directory exists', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            'file.txt': 'file content',
          },
        });
        subject('path/to/dir');
      });

      it('remove the directory and its content', () => {
        expect(fs.existsSync('path/to/dir/file.txt')).toBeFalsy();
        expect(fs.existsSync('path/to/dir')).toBeFalsy();
      });
    });
  });

  describe('#forEachDir', () => {
    const subject = forEachDir;
    let callback;

    beforeEach(() => {
      callback = jest.fn();
    });

    describe('when the directory does not exist', () => {
      beforeEach(() => {
        mockFs({ });
        subject('path/to/dir', callback);
      });

      it('does not yield any directory', () => {
        expect(callback.mock.calls.length).toBe(0);
      });
    });

    describe('when the directory exists', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            dir1: {},
            dir2: {
              dir3: {},
            },
          },
        });
        subject('path/to/dir', callback);
      });

      it('yields all the directories in the same level', () => {
        expect(callback.mock.calls.length).toBe(2);
        expect(callback.mock.calls[0][0]).toBe('path/to/dir/dir1');
        expect(callback.mock.calls[1][0]).toBe('path/to/dir/dir2');
      });
    });

    describe('when the directory exists but it is empty', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {},
        });
        subject('path/to/dir', callback);
      });
      it('does not yield any directory', () => {
        expect(callback.mock.calls.length).toBe(0);
      });
    });
  });

  describe('#forEachFile', () => {
    const subject = forEachFile;
    let callback;

    beforeEach(() => {
      callback = jest.fn();
    });

    describe('when the directory does not exist', () => {
      beforeEach(() => {
        mockFs({ });
        subject('path/to/dir', callback);
      });

      it('does not yield any file', () => {
        expect(callback.mock.calls.length).toBe(0);
      });
    });

    describe('when the directory exists', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {
            'file.txt': 'file content',
            'file2.txt': 'file content',
            dir1: {
              'file3.txt': 'file content',
            },
          },
        });
        subject('path/to/dir', callback);
      });

      it('yields all the files in the same level', () => {
        expect(callback.mock.calls.length).toBe(2);
        expect(callback.mock.calls[0][0]).toBe('path/to/dir/file.txt');
        expect(callback.mock.calls[1][0]).toBe('path/to/dir/file2.txt');
      });
    });

    describe('when the directory exists but it is empty', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir': {},
        });
        subject('path/to/dir', callback);
      });
      it('does not yield any file', () => {
        expect(callback.mock.calls.length).toBe(0);
      });
    });
  });

  describe('#getFileContent', () => {
    const subject = getFileContent;
    let response;

    describe('when the file exists', () => {
      beforeEach(() => {
        mockFs({ 'path/to/dir/file.txt': 'file content' });
        response = subject('path/to/dir/file.txt');
      });

      it('returns the file content', () => {
        expect(response).toBe('file content');
      });
    });

    describe('when the file do not exist', () => {
      beforeEach(() => {
        mockFs({ });
        response = subject('path/to/dir/file.txt');
      });

      it('returns null', () => {
        expect(response).toBe(null);
      });
    });
  });
});
