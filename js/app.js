/* ScreenTalk UI. Plain JavaScript, no build step, no network calls. */
(function () {
  'use strict';
  var R = window.ScreenTalkRules;
  var C = window.ScreenTalkContent;
  var STORE_KEY = 'screentalk.v1';

  var STATUS_LABEL = {
    'talk-now': 'Talk now',
    'option': 'Discuss',
    'upcoming': 'Coming up',
    'info': 'Good to know',
    'past': 'Past range'
  };
  var BAND_COLORS = {
    breast: '#be185d', colorectal: '#0f766e', cervical: '#6d28d9',
    lung: '#475569', prostate: '#1d4ed8'
  };
  var BAND_NAMES = { breast: 'Breast', colorectal: 'Colorectal', cervical: 'Cervical', lung: 'Lung', prostate: 'Prostate talk' };

  // ---------- State ----------
  var state = load();
  function load() {
    try {
      var s = JSON.parse(localStorage.getItem(STORE_KEY));
      if (s && Array.isArray(s.people)) {
        return {
          people: s.people.slice(0, 30).map(function (p) { return C.sanitizePerson(p, R.packYears); }),
          habits: s.habits && typeof s.habits === 'object' ? s.habits : {}
        };
      }
    } catch (e) { /* ignore broken data */ }
    return { people: [], habits: {} };
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* private mode */ }
  }
  function uid() { return 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // ---------- Helpers ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, children) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function btn(label, cls, onClick, aria) {
    var b = el('button', { type: 'button', class: 'btn ' + cls, text: label });
    if (aria) b.setAttribute('aria-label', aria);
    b.addEventListener('click', onClick);
    return b;
  }
  function possessive(name) { return name + (/s$/i.test(name) ? '\u2019' : '\u2019s'); }

  // ---------- Form ----------
  var form = $('person-form');
  var fields = {
    label: $('f-label'), age: $('f-age'), breasts: $('f-breasts'), cervix: $('f-cervix'), uterus: $('f-uterus'),
    prostate: $('f-prostate'), menopause: $('f-menopause'),
    ppd: $('f-ppd'), years: $('f-years'), aa: $('f-aa'), pfam: $('f-pfam'), fh: $('f-fh')
  };
  function smokingValue() {
    var r = form.querySelector('input[name="smoking"]:checked');
    return r ? r.value : 'never';
  }
  function setSmoking(v) {
    form.querySelectorAll('input[name="smoking"]').forEach(function (r) { r.checked = r.value === v; });
  }

  function setPresetUI(p) {
    document.querySelectorAll('.chip.preset').forEach(function (b) {
      var on = b.dataset.preset === p;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }
  function setPreset(p) {
    setPresetUI(p);
    if (p === 'female') { fields.breasts.checked = true; fields.cervix.checked = true; fields.uterus.checked = true; fields.prostate.checked = false; }
    if (p === 'male') { fields.breasts.checked = false; fields.cervix.checked = false; fields.uterus.checked = false; fields.prostate.checked = true; }
    if (p === 'custom') fields.breasts.focus();
    syncDeps();
  }
  document.querySelectorAll('.chip.preset').forEach(function (b) {
    b.addEventListener('click', function () { setPreset(b.dataset.preset); });
  });

  function syncDeps() {
    document.querySelectorAll('.dep').forEach(function (d) {
      var on = d.dataset.dep.split(' ').some(function (id) { return $(id).checked; });
      d.classList.toggle('disabled', !on);
      d.querySelectorAll('input, select').forEach(function (i) {
        i.disabled = !on;
        if (!on && i.type === 'checkbox') i.checked = false;
        if (!on && i.tagName === 'SELECT') i.selectedIndex = 0;
        if (!on && i.type === 'number') i.value = '';
      });
    });
    $('py-value').textContent = R.packYears(fields.ppd.value, fields.years.value);
  }
  form.addEventListener('input', syncDeps);
  form.addEventListener('change', syncDeps);
  ['f-breasts', 'f-cervix', 'f-uterus', 'f-prostate'].forEach(function (id) {
    $(id).addEventListener('change', function () { setPresetUI('custom'); });
  });

  function readForm() {
    var smoking = smokingValue();
    return {
      label: fields.label.value.trim(),
      age: fields.age.value === '' ? NaN : Number(fields.age.value),
      breasts: fields.breasts.checked, cervix: fields.cervix.checked, uterus: fields.uterus.checked,
      prostate: fields.prostate.checked, menopause: fields.menopause.checked,
      smoking: smoking, ppd: fields.ppd.value, years: fields.years.value,
      packYears: smoking === 'never' ? 0 : R.packYears(fields.ppd.value, fields.years.value),
      africanAmerican: fields.aa.checked, prostateFamily: fields.pfam.value,
      familyHistory: fields.fh.checked
    };
  }

  function fillForm(p) {
    fields.label.value = p.label; fields.age.value = p.age;
    fields.breasts.checked = !!p.breasts; fields.cervix.checked = !!p.cervix; fields.uterus.checked = !!p.uterus;
    fields.prostate.checked = !!p.prostate;
    setSmoking(p.smoking || 'never');
    syncDeps();
    fields.ppd.value = p.ppd || ''; fields.years.value = p.years || '';
    fields.menopause.checked = !!p.menopause; fields.aa.checked = !!p.africanAmerican;
    fields.pfam.value = p.prostateFamily || 'none'; fields.fh.checked = !!p.familyHistory;
    syncDeps();
    setPresetUI(null);
  }

  function resetForm() {
    form.reset(); $('edit-id').value = '';
    $('form-title').textContent = 'Add a family member';
    $('save-btn').textContent = 'Add to plan';
    $('cancel-edit').classList.add('hidden');
    showError('', null);
    setPresetUI(null);
    syncDeps();
  }

  function showError(msg, field) {
    $('form-error').textContent = msg;
    form.querySelectorAll('[aria-invalid]').forEach(function (f) { f.removeAttribute('aria-invalid'); });
    if (field) { field.setAttribute('aria-invalid', 'true'); field.focus(); }
  }

  function validate(p) {
    if (!p.label) return ['Add a nickname (like \u201cDad\u201d).', fields.label];
    if (!(p.age >= 0 && p.age <= 120) || Math.floor(p.age) !== p.age) return ['Enter a whole-number age from 0 to 120.', fields.age];
    if (!p.breasts && !p.cervix && !p.uterus && !p.prostate) return ['Pick Female, Male, or check the body parts that apply, so we know which screenings to show.', $('f-breasts')];
    if (p.smoking !== 'never') {
      var ppd = p.ppd === '' ? 0 : Number(p.ppd), yrs = p.years === '' ? 0 : Number(p.years);
      if (!(ppd >= 0 && ppd <= 10)) return ['Packs per day should be between 0 and 10.', fields.ppd];
      if (!(yrs >= 0) || yrs > p.age) return ['Years smoked can\u2019t be more than their age.', fields.years];
    }
    return null;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var p = readForm();
    var err = validate(p);
    if (err) { showError(err[0], err[1]); return; }
    var editId = $('edit-id').value;
    var existing = state.people.filter(function (x) { return x.id === editId; })[0];
    p.id = existing ? existing.id : uid();
    p.progress = existing ? existing.progress : 'not-started';
    p = C.sanitizePerson(p, R.packYears);
    if (existing) state.people = state.people.map(function (x) { return x.id === editId ? p : x; });
    else state.people.push(p);
    save(); resetForm(); renderAll();
    announce((existing ? 'Updated ' : 'Added ') + p.label + '.');
    var card = document.querySelector('[data-person="' + p.id + '"]');
    if (card) { card.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'nearest' }); card.focus({ preventScroll: true }); }
  });
  $('cancel-edit').addEventListener('click', resetForm);

  function reduceMotion() { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function announce(msg) { $('status-live').textContent = msg; }

  // ---------- Plan rendering ----------
  function renderPeople() {
    var wrap = $('people');
    wrap.innerHTML = '';
    var has = state.people.length > 0;
    $('empty').classList.toggle('hidden', has);
    $('plan-note').classList.toggle('hidden', !has);
    $('print-btn').disabled = !has;
    state.people.forEach(function (p) {
      var res = R.evaluate(p);
      var progressId = 'prog-' + p.id;
      var progress = el('select', { id: progressId, class: 'progress-select' });
      C.PROGRESS.forEach(function (o) { progress.appendChild(el('option', { value: o.value, text: o.label })); });
      progress.value = p.progress || 'not-started';
      progress.addEventListener('change', function () {
        p.progress = progress.value; save(); renderSummary();
        card.dataset.progress = p.progress;
        announce(p.label + ': ' + progress.options[progress.selectedIndex].text + '.');
      });

      var head = el('div', { class: 'person-head' }, [
        el('h3', null, [p.label + ' ', el('span', { class: 'age', text: '\u00b7 age ' + p.age })]),
        el('div', { class: 'person-actions' }, [
          btn('Edit', 'small ghost', function () { startEdit(p); }, 'Edit ' + p.label),
          btn('Remove', 'small ghost danger', function () {
            if (!confirm('Remove ' + p.label + ' from your plan?')) return;
            state.people = state.people.filter(function (x) { return x.id !== p.id; });
            if ($('edit-id').value === p.id) resetForm();
            save(); renderAll(); announce('Removed ' + p.label + '.');
          }, 'Remove ' + p.label)
        ])
      ]);
      var tracker = el('div', { class: 'tracker' }, [
        el('label', { for: progressId, text: 'Progress' }), progress,
        btn('\ud83e\ude7a Checkup sheet', 'small ghost sheet-btn', function () { printCheckupSheet(p); }, 'Print a one-page checkup sheet for ' + p.label),
        btn('\ud83d\udcc5 Remind me in 2 weeks', 'small ghost', function () { downloadReminder(p, res.topics); }, 'Download a calendar reminder to check in with ' + p.label)
      ]);

      var list = el('ul', { class: 'topics' });
      res.topics.forEach(function (t) {
        var more = null;
        if (t.detail || t.extra) {
          more = el('details', { class: 'more' }, [
            el('summary', { text: 'More from ACS' }),
            t.detail ? el('p', { class: 'detail', text: t.detail }) : null,
            t.extra ? el('p', { class: 'detail' }, [t.extra + ' ', el('a', { href: t.extraLink, target: '_blank', rel: 'noopener noreferrer', text: 'Free quit help' })]) : null
          ]);
        }
        var body = el('div', null, [
          el('h4', { text: t.title }),
          el('p', { text: t.summary }),
          more,
          el('p', { class: 'src' }, [el('a', { href: t.source, target: '_blank', rel: 'noopener noreferrer', text: 'Read the ACS guideline \u2197' })])
        ]);
        list.appendChild(el('li', { class: 'topic' }, [
          el('span', { class: 'badge ' + t.status, text: STATUS_LABEL[t.status] }), body
        ]));
      });

      var qs = C.questions(p, res.topics);
      var qBox = qs.length ? el('details', { class: 'questions' }, [
        el('summary', { text: 'Questions to bring to the next checkup (' + qs.length + ')' }),
        el('ol', null, qs.map(function (q) { return el('li', { text: q }); }))
      ]) : null;

      var notes = null;
      if (res.notes.length) {
        notes = el('ul', { class: 'notes' });
        res.notes.forEach(function (n) { notes.appendChild(el('li', { text: n })); });
      }
      var card = el('article', { class: 'card person', 'data-person': p.id, 'data-progress': p.progress, tabindex: '-1', 'aria-label': p.label + ', age ' + p.age }, [head, tracker, list, qBox, notes]);
      wrap.appendChild(card);
    });
  }

  function startEdit(p) {
    fillForm(p); $('edit-id').value = p.id;
    $('form-title').textContent = 'Edit ' + p.label;
    $('save-btn').textContent = 'Save changes';
    $('cancel-edit').classList.remove('hidden');
    showError('', null);
    form.scrollIntoView({ behavior: 'smooth' });
    fields.label.focus({ preventScroll: true });
  }

  function downloadReminder(p, topics) {
    var now = new Date();
    var day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
    var ask = topics.filter(function (t) { return t.status === 'talk-now' || t.status === 'option'; }).map(function (t) { return t.title; });
    var desc = 'Check in with ' + p.label + ' about cancer screening.' + (ask.length ? ' Topics from the American Cancer Society guidelines: ' + ask.join('; ') + '.' : '') + ' Made with ScreenTalk. Education only, not medical advice.';
    var ics = C.buildICS({ title: 'Check in with ' + p.label + ' about cancer screening', description: desc, date: day, now: now, uid: p.id + '-' + now.getTime() });
    var url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    var a = el('a', { href: url, download: 'screentalk-' + p.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '-reminder.ics' });
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    announce('Calendar reminder downloaded. Open it to add it to your calendar.');
  }

  function renderSummary() {
    var s = R.familySummary(state.people);
    var box = $('summary');
    box.innerHTML = '';
    box.classList.toggle('hidden', state.people.length === 0);
    if (!state.people.length) return;
    var moving = state.people.filter(function (p) { return p.progress && p.progress !== 'not-started'; }).length;
    [
      [state.people.length, state.people.length === 1 ? 'person in your plan' : 'people in your plan'],
      [s.talkCount, s.talkCount === 1 ? 'topic to talk about now' : 'topics to talk about now'],
      [moving + ' of ' + state.people.length, 'have talked, booked, or are up to date']
    ].forEach(function (pair) {
      box.appendChild(el('div', { class: 'stat' }, [el('b', { text: String(pair[0]) }), el('span', { text: pair[1] })]));
    });
    if (s.soonest) {
      box.appendChild(el('p', { class: 'soonest', text: 'Next one coming up: ' + s.soonest.topic.toLowerCase() + ' for ' + s.soonest.who + ' in ' + s.soonest.years + (s.soonest.years === 1 ? ' year.' : ' years.') }));
    }
  }

  // ---------- Timeline (SVG) ----------
  function describeBand(b) {
    var name = BAND_NAMES[b.key] || b.label;
    var parts = (b.segments || [{ start: b.start, end: b.end }]).map(function (sg) {
      var range = sg.ages || (sg.start + '\u2013' + sg.end);
      return range + (sg.soft ? ' (a choice to discuss)' : ' (recommended)');
    });
    return name + ': ' + parts.join(', ');
  }
  function renderTimeline() {
    var host = $('timeline');
    var txt = $('timeline-text');
    var people = state.people;
    $('timeline-section').classList.toggle('hidden', people.length === 0);
    host.innerHTML = ''; txt.innerHTML = '';
    if (!people.length) return;
    var NS = 'http://www.w3.org/2000/svg';
    var avail = (host.parentElement && host.parentElement.clientWidth) ? host.parentElement.clientWidth - 40 : 960;
    var W = Math.max(300, Math.min(960, avail || 960));
    var narrow = W < 600;
    var left = narrow ? 96 : 170, right = narrow ? 16 : 24, rowH = 24, headH = 26, gap = 14, top = 34;
    var maxAge = 90;
    var rows = people.map(function (p) { return { person: p, bands: R.evaluate(p).timeline }; });
    var height = top + rows.reduce(function (h, r) { return h + headH + r.bands.length * rowH + gap; }, 0);
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + height);
    svg.setAttribute('focusable', 'false');
    var x = function (age) { return left + (W - left - right) * Math.min(age, maxAge) / maxAge; };
    function add(tag, attrs, text, parent) {
      var n = document.createElementNS(NS, tag);
      Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
      if (text != null) n.textContent = text;
      (parent || svg).appendChild(n); return n;
    }
    for (var a = 0; a <= maxAge; a += (narrow ? 15 : 10)) {
      add('line', { x1: x(a), x2: x(a), y1: top - 10, y2: height - 4, stroke: '#ece7de', 'stroke-width': 1 });
      add('text', { x: x(a), y: 18, 'text-anchor': 'middle', 'font-size': 13, fill: '#4b5565' }, a === maxAge ? '90+' : String(a));
    }
    add('text', { x: 8, y: 18, 'font-size': 13, fill: '#4b5565' }, narrow ? 'Age' : 'Age \u2192');
    var y = top;
    rows.forEach(function (r) {
      var maxLen = narrow ? 9 : 18;
      var name = r.person.label.length > maxLen ? r.person.label.slice(0, maxLen - 1) + '\u2026' : r.person.label;
      add('text', { x: 8, y: y + 17, 'font-size': 15, 'font-weight': 700, fill: '#1d2433' }, name + ' (' + r.person.age + ')');
      var blockTop = y + headH;
      var blockH = r.bands.length * rowH;
      r.bands.forEach(function (b, i) {
        var yy = blockTop + i * rowH;
        var color = BAND_COLORS[b.key] || '#0f766e';
        add('text', { x: narrow ? 12 : 20, y: yy + 16, 'font-size': narrow ? 12 : 13, fill: '#374151' }, (narrow && b.key === 'prostate') ? 'Prostate' : (BAND_NAMES[b.key] || b.label));
        var g = add('g', {});
        (b.segments || [{ start: b.start, end: b.end }]).forEach(function (sg) {
          add('rect', {
            x: x(sg.start), y: yy + 5, width: Math.max(4, x(sg.end) - x(sg.start)), height: rowH - 10, rx: 7,
            fill: color, 'fill-opacity': sg.soft ? 0.35 : 1, stroke: color, 'stroke-width': sg.soft ? 1.5 : 0
          }, null, g);
        });
        add('title', {}, describeBand(b), g);
      });
      if (!r.bands.length) add('text', { x: 20, y: blockTop + 4, 'font-size': 12, fill: '#4b5565' }, 'No screening windows yet');
      var ax = x(r.person.age);
      add('line', { x1: ax, x2: ax, y1: blockTop, y2: blockTop + Math.max(blockH, rowH), stroke: '#1d2433', 'stroke-width': 2, 'stroke-dasharray': '4 3' });
      add('polygon', { points: (ax - 7) + ',' + (blockTop - 9) + ' ' + (ax + 7) + ',' + (blockTop - 9) + ' ' + ax + ',' + (blockTop - 1), fill: '#f59e0b', stroke: '#1d2433', 'stroke-width': 1.5 });
      var words = r.bands.map(describeBand);
      txt.appendChild(el('li', { text: r.person.label + ', age ' + r.person.age + ': ' + (words.length ? words.join('; ') : 'no screening windows shown') + '.' }));
      y = blockTop + blockH + gap;
    });
    host.appendChild(svg);
    var legend = $('legend');
    legend.innerHTML = '';
    var used = {};
    rows.forEach(function (r) { r.bands.forEach(function (b) { used[b.key] = true; }); });
    Object.keys(BAND_COLORS).filter(function (k) { return used[k]; }).forEach(function (k) {
      var sw = el('i'); sw.style.background = BAND_COLORS[k];
      legend.appendChild(el('span', null, [sw, BAND_NAMES[k]]));
    });
    var soft = el('i', { class: 'soft' });
    legend.appendChild(el('span', null, [soft, 'Lighter = a choice to discuss with a provider']));
    var tri = el('i', { class: 'tri' });
    legend.appendChild(el('span', null, [tri, 'Age today']));
  }

  // ---------- Talk ----------
  function renderTalkOptions() {
    var sel = $('talk-who');
    var prev = sel.value;
    sel.innerHTML = '';
    var has = state.people.length > 0;
    sel.disabled = !has; $('copy-btn').disabled = !has; $('share-btn').disabled = !has;
    if (!has) {
      sel.appendChild(el('option', { text: 'Add someone to your plan first' }));
    } else {
      state.people.forEach(function (p) { sel.appendChild(el('option', { value: p.id, text: p.label })); });
      if (prev && state.people.some(function (p) { return p.id === prev; })) sel.value = prev;
    }
    renderTalk();
  }
  function renderTalk() {
    var p = state.people.filter(function (x) { return x.id === $('talk-who').value; })[0];
    var box = $('talk-text');
    box.value = p ? C.starter(p.label, R.evaluate(p).topics, $('talk-tone').value) : 'Add someone to your plan first, then pick a style.';
    box.disabled = !p;
    box.style.height = 'auto';
    box.style.height = Math.max(110, box.scrollHeight + 4) + 'px';
    $('copy-status').textContent = '';
  }
  $('talk-who').addEventListener('change', renderTalk);
  $('talk-tone').addEventListener('change', renderTalk);
  $('copy-btn').addEventListener('click', function () {
    var text = $('talk-text').value;
    var done = function () { $('copy-status').textContent = 'Copied!'; };
    function fallback() {
      var ta = el('textarea'); ta.value = text; ta.setAttribute('readonly', '');
      ta.className = 'offscreen';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done(); else $('copy-status').textContent = 'Couldn\u2019t copy automatically. Select the text and copy it.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  });
  $('talk-text').addEventListener('input', function () {
    var box = $('talk-text'); box.style.height = 'auto'; box.style.height = Math.max(110, box.scrollHeight + 4) + 'px';
  });
  $('share-btn').addEventListener('click', function () {
    var text = $('talk-text').value;
    if (navigator.share) navigator.share({ text: text }).catch(function () {});
    else $('copy-status').textContent = 'Sharing isn\u2019t supported in this browser. Use Copy instead.';
  });

  // ---------- Game ----------
  var game = { order: [], i: 0, score: 0, answered: false };
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function startGame(focus) {
    game.order = shuffle(C.CARDS); game.i = 0; game.score = 0;
    $('game-done').classList.add('hidden');
    $('game-claim').classList.remove('hidden');
    showCard();
    if (focus) $('game-claim').focus();
  }
  function showCard() {
    var c = game.order[game.i];
    game.answered = false;
    $('game-progress').textContent = 'Card ' + (game.i + 1) + ' of ' + game.order.length;
    $('game-score').textContent = 'Score: ' + game.score;
    $('game-bar').style.width = (game.i / game.order.length * 100) + '%';
    $('game-claim').textContent = '\u201c' + c.claim + '\u201d';
    $('game-reveal').classList.add('hidden');
    $('game-buttons').classList.remove('hidden');
  }
  document.querySelectorAll('#game-buttons button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (game.answered) return;
      game.answered = true;
      var c = game.order[game.i];
      var right = b.dataset.answer === c.answer;
      if (right) game.score++;
      $('game-score').textContent = 'Score: ' + game.score;
      var v = $('game-verdict');
      v.textContent = (right ? 'Correct! ' : 'Not quite. ') + 'It\u2019s a ' + c.answer + '.';
      v.className = 'verdict ' + (right ? 'right' : 'wrong');
      $('game-why').textContent = c.why;
      $('game-src').textContent = c.srcName; $('game-src').href = c.src;
      $('game-buttons').classList.add('hidden');
      $('game-reveal').classList.remove('hidden');
      $('game-next').textContent = game.i === game.order.length - 1 ? 'See my score \u2192' : 'Next card \u2192';
      $('game-next').focus();
    });
  });
  $('game-next').addEventListener('click', function () {
    game.i++;
    if (game.i >= game.order.length) {
      $('game-bar').style.width = '100%';
      $('game-reveal').classList.add('hidden');
      $('game-claim').classList.add('hidden');
      $('game-done').classList.remove('hidden');
      var pct = game.score / game.order.length;
      $('game-final').textContent = 'You got ' + game.score + ' of ' + game.order.length + ' right' + (pct === 1 ? '. Perfect score!' : pct >= 0.75 ? '. Nice work!' : '. Now you know the facts.');
      $('game-progress').textContent = 'Done!';
      $('game-final').focus();
    } else {
      showCard();
      $('game-claim').focus();
    }
  });
  $('game-restart').addEventListener('click', function () { startGame(true); });

  // ---------- Habits ----------
  function renderHabits() {
    var ul = $('habit-list'); ul.innerHTML = '';
    C.HABITS.forEach(function (h, i) {
      var cb = el('input', { type: 'checkbox', id: 'h' + i });
      cb.checked = !!state.habits[i];
      cb.addEventListener('change', function () { state.habits[i] = cb.checked; save(); renderHabitCount(); });
      ul.appendChild(el('li', null, [el('label', { for: 'h' + i }, [cb, el('span', { text: h })])]));
    });
    renderHabitCount();
  }
  function renderHabitCount() {
    var n = C.HABITS.filter(function (h, i) { return state.habits[i]; }).length;
    $('habit-count').textContent = n ? 'You\u2019ve committed to ' + n + ' of ' + C.HABITS.length + ' habits.' : '';
  }

  // ---------- Resources ----------
  function renderResources() {
    var box = $('resources'); box.innerHTML = '';
    C.RESOURCES.forEach(function (r) {
      var ext = /^https?:/.test(r.href);
      var attrs = { class: 'card', href: r.href };
      if (ext) { attrs.target = '_blank'; attrs.rel = 'noopener noreferrer'; }
      box.appendChild(el('a', attrs, [el('h3', { text: r.name }), el('p', { text: r.detail })]));
    });
  }

  // ---------- Checkup sheet (one person, one page) ----------
  function today() { return new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }); }
  function blankLines(n, cls) {
    var w = el('div', { class: 'sheet-lines' + (cls ? ' ' + cls : '') });
    for (var i = 0; i < n; i++) w.appendChild(el('span', { class: 'sheet-line' }));
    return w;
  }
  function renderCheckupSheet(p) {
    var d = C.checkupSheet(p, R.evaluate(p));
    var box = $('checkup-sheet');
    box.innerHTML = '';
    box.appendChild(el('header', { class: 'sheet-head' }, [
      el('div', null, [el('p', { class: 'sheet-brand', text: 'ScreenTalk' }), el('h2', { text: d.title })]),
      el('p', { class: 'sheet-meta' }, ['Printed ' + today(), el('br'), 'Appointment date: ________________'])
    ]));
    box.appendChild(el('p', { class: 'sheet-intro', text: 'Bring this to the next checkup. Fill in what you know before the visit, then write down what the provider says.' }));

    box.appendChild(el('h3', { text: 'Screenings to bring up' }));
    if (d.rows.length) {
      var table = el('table', { class: 'sheet-table' });
      table.appendChild(el('thead', null, [el('tr', null, ['Topic', 'ACS guideline', 'Last test (date)', 'Result', 'Next due'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]));
      var tb = el('tbody');
      d.rows.forEach(function (r) {
        tb.appendChild(el('tr', null, [
          el('td', null, [el('strong', { text: r.title }), el('span', { class: 'sheet-status ' + r.status, text: r.statusLabel }), el('small', { text: r.test })]),
          el('td', { class: 'sheet-sum', text: r.summary }),
          el('td', { class: 'fill' }), el('td', { class: 'fill' }), el('td', { class: 'fill' })
        ]));
      });
      table.appendChild(tb);
      box.appendChild(table);
    } else {
      box.appendChild(el('p', { text: 'Nothing in these ACS guidelines lines up right now. A regular checkup is still a great habit.' }));
    }
    if (d.later.length) box.appendChild(el('p', { class: 'sheet-later' }, [el('strong', { text: 'Coming up later: ' }), d.later.join(' \u00b7 ') + '.']));
    if (d.smoking) box.appendChild(el('p', { class: 'sheet-later' }, [el('strong', { text: 'Smoking history: ' }), d.smoking + '. Providers use pack-years to decide about lung screening.']));

    if (d.questions.length) {
      box.appendChild(el('h3', { text: 'Questions to ask' }));
      var ol = el('ol', { class: 'sheet-qs' });
      d.questions.forEach(function (q) { ol.appendChild(el('li', null, [el('span', { class: 'box', 'aria-hidden': 'true' }), el('span', { text: q }), blankLines(1)])); });
      box.appendChild(ol);
    }

    box.appendChild(el('h3', { text: 'Family history to mention' }));
    var fh = el('table', { class: 'sheet-table sheet-fh' });
    fh.appendChild(el('thead', null, [el('tr', null, ['Relative', 'Type of cancer', 'Age when diagnosed'].map(function (h) { return el('th', { scope: 'col', text: h }); }))]));
    var fb = el('tbody');
    for (var i = 0; i < (d.familyHistory ? 3 : 2); i++) fb.appendChild(el('tr', null, [el('td', { class: 'fill' }), el('td', { class: 'fill' }), el('td', { class: 'fill' })]));
    fh.appendChild(fb);
    box.appendChild(fh);
    d.notes.forEach(function (n) { box.appendChild(el('p', { class: 'sheet-note', text: n })); });

    box.appendChild(el('h3', { text: 'What the provider said' }));
    box.appendChild(blankLines(3));
    box.appendChild(el('p', { class: 'sheet-foot', text: d.footer + ' Guidelines: cancer.org/screening' }));
  }
  function setPrintMode(mode) {
    document.body.classList.toggle('print-sheet', mode === 'sheet');
    $('checkup-sheet').setAttribute('aria-hidden', mode === 'sheet' ? 'false' : 'true');
  }
  function printCheckupSheet(p) {
    renderCheckupSheet(p);
    setPrintMode('sheet');
    announce('Opening a one-page checkup sheet for ' + p.label + '.');
    window.print();
  }
  // Ctrl+P or the browser menu prints the family plan with today's date filled in.
  window.addEventListener('beforeprint', function () {
    $('print-date').textContent = today();
    document.querySelectorAll('#people details').forEach(function (d) { d.open = true; });
  });
  window.addEventListener('afterprint', function () { setPrintMode('plan'); });

  // ---------- Tools ----------
  $('print-btn').addEventListener('click', function () {
    setPrintMode('plan');
    $('print-date').textContent = today();
    document.querySelectorAll('#people details').forEach(function (d) { d.open = true; });
    window.print();
  });
  $('clear-btn').addEventListener('click', function () {
    if (!confirm('Delete your whole plan and habit checks from this browser?')) return;
    state = { people: [], habits: {} };
    try { localStorage.removeItem(STORE_KEY); localStorage.removeItem('screentalk.rehearse.v1'); } catch (e) { /* ignore */ }
    resetForm(); renderAll(); renderHabits();
    announce('All ScreenTalk data was deleted from this browser.');
  });
  $('demo-btn').addEventListener('click', function () {
    state.people = [
      { id: uid(), label: 'Mom', age: 46, breasts: true, cervix: true, uterus: true, familyHistory: true, smoking: 'never' },
      { id: uid(), label: 'Dad', age: 52, prostate: true, smoking: 'former', ppd: '1', years: '22', progress: 'talked' },
      { id: uid(), label: 'Nana', age: 71, breasts: true, cervix: true, uterus: true, menopause: true, smoking: 'never' },
      { id: uid(), label: 'Big sis', age: 19, breasts: true, cervix: true, uterus: true, smoking: 'never' }
    ].map(function (p) { return C.sanitizePerson(p, R.packYears); });
    save(); renderAll();
    announce('Loaded a made-up demo family of 4.');
    $('summary').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  });

  var resizeTimer = null, lastW = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastW) return;
    lastW = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderTimeline, 150);
  });

  function renderAll() {
    renderSummary(); renderPeople(); renderTimeline(); renderTalkOptions();
  }

  // ---------- Init ----------
  syncDeps();
  renderAll();
  renderHabits();
  renderResources();
  startGame(false);
})();
