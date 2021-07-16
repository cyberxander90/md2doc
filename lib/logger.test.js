/* eslint-disable no-console */
const logger = require('./logger');

describe('logger', () => {
  beforeEach(() => {
    console.log = jest.fn();
  });

  describe('#warn', () => {
    it('logs a warning message', () => {
      logger.warn('take care!');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('WARNING: ', 'take care!');
    });
  });

  describe('#error', () => {
    it('logs an error message', () => {
      logger.error('wrong');
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith('ERROR: ', 'wrong');
    });
  });
});
