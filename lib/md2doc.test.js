const md2doc = require('./md2doc');

describe('md2doc', () => {
  const subject = () => md2doc();

  it('does not throw an error', () => {
    expect(() => subject()).not.toThrow();
  });
});
