const md2html = require('./md2html');

describe('md2html', () => {
  const subject = md2html;
  it('make the right html', () => {
    [
      [
        '# hello, markdown!',
        '<h1 id="hellomarkdown">hello, markdown!</h1>',
      ],
    ].forEach(([actual, expected]) => expect(subject(actual)).toBe(expected));
  });
});
