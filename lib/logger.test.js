/* eslint-disable no-console */

const logger = require('./logger');

describe('logger', () => {
  beforeEach(() => { console.log = jest.fn(); });

  ['info', 'warn', 'error'].forEach((item) => {
    describe(`#${item}`, () => {
      it(`logs a ${item} message`, () => {
        logger[item]('take care!');
        expect(console.log).toHaveBeenCalledTimes(1);
      });
    });
  });
});
