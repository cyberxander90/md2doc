/* eslint-disable func-names */

$(() => {
  $('nav a[href="#"]').each(function () {
    $(this).click(function () {
      $(this).toggleClass('expanded');
    });
  });
});
