/* TaskMate preview: a small working copy of TaskMate's core features */
(function () {
  'use strict';

  var root = document.querySelector('[data-taskmate]');
  if (!root) return;

  var STORAGE_KEY = 'bmn-taskmate-preview-v1';
  var form = root.querySelector('[data-tm-form]');
  var list = root.querySelector('[data-tm-list]');
  var empty = root.querySelector('[data-tm-empty]');
  var filtersEl = root.querySelector('[data-tm-filters]');
  var pill = root.querySelector('[data-tm-pill]');
  var filterBtns = Array.prototype.slice.call(filtersEl.querySelectorAll('button'));
  var counts = {
    total: root.querySelector('[data-tm-count="total"]'),
    pending: root.querySelector('[data-tm-count="pending"]'),
    done: root.querySelector('[data-tm-count="done"]')
  };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var filter = 'all';
  var tasks = load() || samples();

  /* ---------- data ---------- */
  function isoDaysFromToday(n) {
    var d = new Date();
    d.setDate(d.getDate() + n);
    return toISO(d);
  }
  function toISO(d) {
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  function samples() {
    return [
      { id: uid(), title: 'Submit Java lab record', subject: 'Object Oriented Programming', deadline: isoDaysFromToday(2), done: false },
      { id: uid(), title: 'Revise linked lists', subject: 'Data Structures', deadline: isoDaysFromToday(5), done: false },
      { id: uid(), title: 'Finish maths assignment', subject: 'Mathematics', deadline: isoDaysFromToday(-1), done: true }
    ];
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      return Array.isArray(data) ? data : null;
    } catch (e) { return null; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) { /* storage unavailable: demo still works */ }
  }

  /* ---------- formatting ---------- */
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function dueText(iso, done) {
    var parts = iso.split('-');
    var due = new Date(+parts[0], +parts[1] - 1, +parts[2]);
    var today = new Date(); today.setHours(0, 0, 0, 0);
    var diff = Math.round((due - today) / 86400000);
    var label = 'Due ' + due.getDate() + ' ' + MONTHS[due.getMonth()];
    if (done) return { text: label, soon: false };
    if (diff < 0) return { text: label + ', overdue', soon: true };
    if (diff === 0) return { text: 'Due today', soon: true };
    if (diff === 1) return { text: 'Due tomorrow', soon: true };
    return { text: label + ', in ' + diff + ' days', soon: diff <= 3 };
  }

  /* ---------- render ---------- */
  function visibleTasks() {
    return tasks
      .filter(function (t) {
        if (filter === 'pending') return !t.done;
        if (filter === 'done') return t.done;
        return true;
      })
      .sort(function (a, b) {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return a.deadline < b.deadline ? -1 : a.deadline > b.deadline ? 1 : 0;
      });
  }

  function itemEl(t) {
    var li = document.createElement('li');
    li.className = 'tm-item' + (t.done ? ' is-done' : '');
    li.dataset.id = t.id;

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tm-check';
    btn.setAttribute('aria-pressed', t.done ? 'true' : 'false');
    btn.setAttribute('aria-label', (t.done ? 'Mark as pending: ' : 'Mark as completed: ') + t.title);

    var text = document.createElement('div');
    text.className = 'tm-text';

    var title = document.createElement('span');
    title.className = 'tm-task-title';
    title.textContent = t.title;

    var meta = document.createElement('div');
    meta.className = 'tm-meta';
    var subj = document.createElement('span');
    subj.className = 'tm-subject';
    subj.textContent = t.subject;
    var due = document.createElement('span');
    var d = dueText(t.deadline, t.done);
    due.className = 'tm-due' + (d.soon ? ' is-soon' : '');
    due.textContent = d.text;

    meta.append(subj, due);
    text.append(title, meta);
    li.append(btn, text);
    return li;
  }

  function render(opts) {
    opts = opts || {};
    var items = visibleTasks();
    list.textContent = '';
    items.forEach(function (t) {
      var el = itemEl(t);
      list.appendChild(el);
      if (!reduceMotion && window.gsap && (opts.animateAll || opts.newId === t.id)) {
        gsap.fromTo(el, { opacity: 0, y: opts.newId ? -10 : 8 }, {
          opacity: 1, y: 0, duration: 0.45, ease: 'power3.out',
          delay: opts.animateAll ? items.indexOf(t) * 0.05 : 0, clearProps: 'transform,opacity'
        });
      }
    });

    if (!items.length) {
      empty.hidden = false;
      empty.textContent = filter === 'pending' ? 'No pending tasks. Add one above.'
        : filter === 'done' ? 'No completed tasks yet. Tick one off to see it here.'
        : 'No tasks yet. Add one above.';
    } else {
      empty.hidden = true;
    }
    updateCounts();
  }

  var shown = { total: 0, pending: 0, done: 0 };
  function updateCounts() {
    var next = {
      total: tasks.length,
      pending: tasks.filter(function (t) { return !t.done; }).length,
      done: tasks.filter(function (t) { return t.done; }).length
    };
    Object.keys(next).forEach(function (k) {
      if (window.gsap && !reduceMotion && shown[k] !== next[k]) {
        var obj = { v: shown[k] };
        gsap.to(obj, {
          v: next[k], duration: 0.5, ease: 'power2.out',
          onUpdate: function () { counts[k].textContent = Math.round(obj.v); }
        });
        if (next[k] > shown[k] || next[k] < shown[k]) {
          gsap.fromTo(counts[k], { y: next[k] > shown[k] ? 6 : -6 }, { y: 0, duration: 0.4, ease: 'power3.out' });
        }
      } else {
        counts[k].textContent = next[k];
      }
      shown[k] = next[k];
    });
  }

  function movePill() {
    var active = filterBtns.find(function (b) { return b.dataset.filter === filter; });
    if (!active) return;
    pill.style.width = active.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + active.offsetLeft + 'px)';
  }

  /* ---------- events ---------- */
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fd = new FormData(form);
    var title = String(fd.get('title') || '').trim();
    var subject = String(fd.get('subject') || '').trim();
    var deadline = String(fd.get('deadline') || '');
    if (!title || !subject || !deadline) { form.reportValidity(); return; }

    var t = { id: uid(), title: title, subject: subject, deadline: deadline, done: false };
    tasks.push(t);
    save();
    if (filter === 'done') setFilter('all', true);
    render({ newId: t.id });
    form.reset();
    form.elements.deadline.value = isoDaysFromToday(1);
    form.elements.title.focus();
  });

  list.addEventListener('click', function (e) {
    var btn = e.target.closest('.tm-check');
    if (!btn) return;
    var li = btn.closest('.tm-item');
    var t = tasks.find(function (x) { return x.id === li.dataset.id; });
    if (!t) return;
    t.done = !t.done;
    save();

    // Show the state change in place first, then re-render (re-sorts / re-filters).
    li.classList.toggle('is-done', t.done);
    btn.setAttribute('aria-pressed', t.done ? 'true' : 'false');
    updateCounts();

    var leaves = (filter === 'pending' && t.done) || (filter === 'done' && !t.done);
    if (leaves && window.gsap && !reduceMotion) {
      gsap.to(li, {
        opacity: 0, x: 24, duration: 0.35, delay: 0.25, ease: 'power2.in',
        onComplete: function () { render(); focusFirstCheck(); }
      });
    } else {
      setTimeout(function () {
        render();
        var again = list.querySelector('[data-id="' + t.id + '"] .tm-check');
        if (again) again.focus();
        else focusFirstCheck();
      }, reduceMotion ? 0 : 320);
    }
  });

  function focusFirstCheck() {
    var first = list.querySelector('.tm-check');
    if (first) first.focus();
  }

  function setFilter(f, silent) {
    filter = f;
    filterBtns.forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.filter === f ? 'true' : 'false'); });
    movePill();
    if (!silent) render({ animateAll: true });
  }

  filtersEl.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-filter]');
    if (!b || b.dataset.filter === filter) return;
    setFilter(b.dataset.filter);
  });

  root.querySelector('[data-tm-reset]').addEventListener('click', function () {
    tasks = samples();
    save();
    setFilter('all', true);
    render({ animateAll: true });
  });

  window.addEventListener('resize', movePill);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(movePill);

  /* ---------- init ---------- */
  form.elements.deadline.value = isoDaysFromToday(1);
  // gsap loads with defer before this script, but counters start at 0 and count up on first render
  render();
  movePill();
})();
