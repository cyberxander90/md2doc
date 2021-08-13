const mockFs = require('mock-fs');
const fs = require('fs');

const {
  existsDir,
  existsFile,
  createDir,
  writeFile,
  copyFile,
  removeDir,
  forEachDir,
  forEachFile,
  getFileContent,
  copyDir,
} = require('./fs');

describe('fs', () => {
  beforeEach(() => mockFs({
    'path/to/dir/file.txt': 'file content',
    'path/to/empty/dir': { },
  }));
  afterEach(() => mockFs.restore());

  describe('#existsDir', () => {
    let dirPath;
    const subject = () => existsDir(dirPath);

    describe('when the directory exists', () => {
      beforeEach(() => { dirPath = 'path/to/dir'; });

      it('returns true', () => expect(subject()).toBeTruthy());
    });

    describe('when the directory does not exist', () => {
      beforeEach(() => { dirPath = 'path/to/inexistent/dir'; });

      it('returns false', () => expect(subject()).toBeFalsy());
    });
  });

  describe('#existsFile', () => {
    let filePath;
    const subject = () => existsFile(filePath);

    describe('when the file exists', () => {
      beforeEach(() => { filePath = 'path/to/dir/file.txt'; });

      it('returns true', () => expect(subject()).toBeTruthy());
    });

    describe('when the file does not exist', () => {
      beforeEach(() => { filePath = 'path/to/dir/inexistent/file.txt'; });

      it('returns false', () => expect(subject()).toBeFalsy());
    });
  });

  describe('#createDir', () => {
    let dirPath;
    const subject = () => createDir(dirPath);

    describe('when the directory exists', () => {
      beforeEach(() => { dirPath = 'path/to/dir'; });

      it('do not throw an error', () => expect(() => subject()).not.toThrow());

      it('do not clear the directory', () => {
        subject();
        expect(fs.existsSync('path/to/dir/file.txt')).toBe(true);
      });
    });

    describe('when the directory does not exist', () => {
      beforeEach(() => { dirPath = 'path/to/dir2'; });

      it('creates the directory', () => {
        subject();
        expect(fs.existsSync('path/to/dir2')).toBe(true);
      });
    });
  });

  describe('#writeFile', () => {
    let filePath;
    const subject = () => writeFile(filePath, 'hello world!');

    describe('when the file exists', () => {
      beforeEach(() => { filePath = 'path/to/dir/file.txt'; });

      it('do not throw an error', () => expect(() => subject()).not.toThrow());

      it('overwrite the file content', () => {
        subject();
        expect(fs.existsSync('path/to/dir/file.txt')).toBe(true);
        expect(fs.readFileSync('path/to/dir/file.txt', 'utf-8')).toBe('hello world!');
      });
    });

    describe('when the file does not exist', () => {
      beforeEach(() => { filePath = 'path/to/new/dir/file.txt'; });

      it('creates the file with the content', () => {
        subject();
        expect(fs.existsSync('path/to/new/dir/file.txt')).toBe(true);
        expect(fs.readFileSync('path/to/new/dir/file.txt', 'utf-8')).toBe('hello world!');
      });
    });
  });

  describe('#copyFile', () => {
    let toPath;
    const subject = () => copyFile('path/to/dir/file.txt', toPath);

    beforeEach(() => mockFs({
      'path/to/dir/file.txt': 'file content',
      'path/destination/index.txt': 'hello world',
    }));

    describe('when already exist a file with the same name in the destination', () => {
      beforeEach(() => { toPath = 'path/destination/index.txt'; });

      it('overwrite the file content', () => {
        subject();
        expect(fs.readFileSync('path/destination/index.txt', 'utf-8')).toBe('file content');
      });
    });

    describe('when the destination file do not exist', () => {
      beforeEach(() => { toPath = 'path/to/new/dir/index.txt'; });

      it('creates the file with the content', () => {
        subject();
        expect(fs.readFileSync('path/to/new/dir/index.txt', 'utf-8')).toBe('file content');
      });
    });
  });

  describe('#removeDir', () => {
    let dirPath;
    const subject = () => removeDir(dirPath);

    describe('when the directory does not exist', () => {
      beforeEach(() => { dirPath = 'path/to/inexistent/dir'; });

      it('does not throw an error', () => expect(() => subject()).not.toThrow());
    });

    describe('when the directory exists', () => {
      beforeEach(() => { dirPath = 'path/to/dir'; });

      it('remove the directory and its content', () => {
        subject();
        expect(fs.existsSync('path/to/dir/file.txt')).toBeFalsy();
        expect(fs.existsSync('path/to/dir')).toBeFalsy();
      });
    });
  });

  describe('#forEachDir', () => {
    let dirPath;
    let callback;
    const subject = () => forEachDir(dirPath, callback);

    beforeEach(() => { callback = jest.fn(); });

    describe('when the directory does not exist', () => {
      beforeEach(() => { dirPath = 'path/to/inexistent/dir'; });

      it('does not yield any directory', () => {
        subject();
        expect(callback.mock.calls.length).toBe(0);
      });
    });

    describe('when the directory exists', () => {
      beforeEach(() => { dirPath = 'path/to/'; });

      it('yields all the directories in the same level', () => {
        subject();
        const { calls } = callback.mock;
        expect(calls.length).toBe(2);
        expect(calls[0][0]).toBe('path/to/dir');
        expect(calls[1][0]).toBe('path/to/empty');
      });
    });

    describe('when the directory exists but it is empty', () => {
      beforeEach(() => { dirPath = 'path/to/empty/dir'; });

      it('does not yield any directory', () => {
        subject();
        expect(callback.mock.calls.length).toBe(0);
      });
    });
  });

  describe('#forEachFile', () => {
    let dirPath;
    let callback;
    const subject = () => forEachFile(dirPath, callback);

    beforeEach(() => { callback = jest.fn(); });

    describe('when the directory does not exist', () => {
      beforeEach(() => { dirPath = 'path/to/inexistent/dir'; });

      it('does not yield any file', () => {
        subject();
        expect(callback.mock.calls.length).toBe(0);
      });
    });

    describe('when the directory exists', () => {
      beforeEach(() => {
        mockFs({
          'path/to/dir/file1.txt': 'file 1 content',
          'path/to/dir/file2.txt': 'file 2 content',
          'path/to/dir/sub/file3.txt': 'file 3 content',
        });
        dirPath = 'path/to/dir';
      });

      it('yields all the files in the same level', () => {
        subject();
        const { calls } = callback.mock;
        expect(calls.length).toBe(2);
        expect(calls[0][0]).toBe('path/to/dir/file1.txt');
        expect(calls[1][0]).toBe('path/to/dir/file2.txt');
      });
    });

    describe('when the directory exists but it is empty', () => {
      beforeEach(() => { dirPath = 'path/to/empty/dir'; });

      it('does not yield any file', () => {
        subject();
        expect(callback.mock.calls.length).toBe(0);
      });
    });
  });

  describe('#getFileContent', () => {
    let filePath;
    const subject = () => getFileContent(filePath);

    describe('when the file do not exist', () => {
      beforeEach(() => { filePath = 'path/to/inexistent/file.txt'; });

      it('returns null', () => expect(subject()).toBe(null));
    });

    describe('when the file exists', () => {
      beforeEach(() => { filePath = 'path/to/dir/file.txt'; });

      it('returns the file content', () => expect(subject()).toBe('file content'));
    });
  });

  describe('#copyDir', () => {
    let toPath;
    const subject = () => copyDir('path/to', toPath);

    describe('when the destination directory does not exist', () => {
      beforeEach(() => { toPath = 'path/new'; });

      it('copy all the files and directories to the destination', () => {
        subject();
        expect(fs.readFileSync('path/new/dir/file.txt', 'utf-8')).toBe('file content');
        expect(fs.existsSync('path/new/empty/dir')).toBe(true);
      });
    });
  });
});
