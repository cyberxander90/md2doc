/* eslint-disable func-names */

$(() => {
  $('nav a[href="#"]').each(function () {
    $(this).click(function () {
      $(this).toggleClass('expanded');
    });
  });
});

window.addEventListener('DOMContentLoaded', () => {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const id = entry.target.getAttribute('id');
      console.log(id)
      const $el = document.querySelector(`#table-of-contents li a[href="#${id}"]`);
      if (!$el.parentElement) {
        return;
      }
      if (entry.intersectionRatio > 0) {
        $el.parentElement.classList.add('active');
      } else {
        $el.parentElement.classList.remove('active');
      }
    });
  });

  // Track all sections that have an `id` applied
  document.querySelectorAll('main section[id]').forEach((section) => {
    observer.observe(section);
  });
});
