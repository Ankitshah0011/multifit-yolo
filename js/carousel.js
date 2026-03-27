// Universal category carousel — each [data-carousel] cycles its images independently every 5s
// For background groups (data-bg-group), also cycles which category is visible every 5s
(function () {
  // 1. Per-category image cycling (every 5s)
  var carousels = document.querySelectorAll('[data-carousel]');
  carousels.forEach(function (container) {
    var imgs = container.querySelectorAll('img');
    if (imgs.length < 2) return;
    var current = 0;
    setInterval(function () {
      imgs[current].classList.remove('active');
      current = (current + 1) % imgs.length;
      imgs[current].classList.add('active');
    }, 5000);
  });

  // 2. Background group cycling — rotate which category is shown (for full-bg slideshows)
  var groups = {};
  document.querySelectorAll('[data-bg-group]').forEach(function (el) {
    var name = el.getAttribute('data-bg-group');
    if (!groups[name]) groups[name] = [];
    groups[name].push(el);
  });

  Object.keys(groups).forEach(function (name) {
    var items = groups[name];
    if (items.length < 2) return;
    var current = 0;
    setInterval(function () {
      items[current].classList.remove('active');
      current = (current + 1) % items.length;
      items[current].classList.add('active');
    }, 5000);
  });
})();
