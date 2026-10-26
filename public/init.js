// Подключается в <head> до отрисовки. Отдельным файлом, потому что CSP запрещает встроенные скрипты.
// 1) Тема: сохранённый выбор, иначе системная настройка.
// 2) Появление частей разделов при прокрутке. Если этот файл не загрузится, класса js не будет
//    и ничего не спрячется.
(function () {
  var d = document.documentElement, t = null;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  d.dataset.theme = t;
  d.classList.add('js');

  document.addEventListener('DOMContentLoaded', function () {
    var blocks = document.querySelectorAll('[data-reveal]');
    var show = function (el) { el.classList.add('is-in'); };
    if (!('IntersectionObserver' in window)) { blocks.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    blocks.forEach(function (el) { io.observe(el); });
  });
})();
