/* ScreenTalk "Rehearse the talk" UI. Keyboard-first, English/Spanish, no network calls. */
(function () {
  'use strict';
  var X = window.ScreenTalkRehearse;
  var box = document.getElementById('rh-card');
  if (!X || !box) return;
  var PREF_KEY = 'screentalk.rehearse.v1';

  var ui = { lang: 'en', parent: 'mom', state: null, last: null };
  try {
    var saved = JSON.parse(localStorage.getItem(PREF_KEY) || '{}');
    if (X.LANGS.indexOf(saved.lang) >= 0) ui.lang = saved.lang;
    if (X.PARENTS.indexOf(saved.parent) >= 0) ui.parent = saved.parent;
  } catch (e) { /* ignore broken prefs */ }
  function savePrefs() { try { localStorage.setItem(PREF_KEY, JSON.stringify({ lang: ui.lang, parent: ui.parent })); } catch (e) {} }

  function $(id) { return document.getElementById(id); }
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === 'text') n.textContent = attrs[k];
      else if (k === 'class') n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return n;
  }
  function S(key) { return X.t(ui.lang, key); }
  function P() { return X.parentName(ui.lang, ui.parent); }
  function announce(msg) { var s = $('status-live'); if (s) { s.textContent = ''; setTimeout(function () { s.textContent = msg; }, 30); } }
  function sourceList(srcs) {
    var p = el('p', { class: 'rh-src' }, [S('sources') + ' ']);
    srcs.forEach(function (s, i) {
      if (i) p.appendChild(document.createTextNode(' \u00b7 '));
      p.appendChild(el('a', { href: s.url, target: '_blank', rel: 'noopener noreferrer', text: s.name }));
    });
    return p;
  }

  // ---------- Toolbar (language + parent) ----------
  function renderToolbar() {
    box.setAttribute('lang', ui.lang);
    $('rh-lang-label').textContent = S('langLabel');
    document.querySelectorAll('#rh-lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.lang === ui.lang));
    });
    $('rh-parent-label').firstChild.textContent = S('parentLabel') + ' ';
    var sel = $('rh-parent');
    sel.innerHTML = '';
    X.PARENTS.forEach(function (k) { sel.appendChild(el('option', { value: k, text: X.parentName(ui.lang, k) })); });
    sel.value = ui.parent;
    sel.disabled = !!(ui.state && !X.isDone(ui.state) && ui.state.round > 0);
  }
  document.querySelectorAll('#rh-lang button').forEach(function (b) {
    b.addEventListener('click', function () { ui.lang = b.dataset.lang; savePrefs(); render(); b.focus(); });
  });
  $('rh-parent').addEventListener('change', function (e) {
    ui.parent = e.target.value; savePrefs();
    if (ui.state && ui.state.round === 0) ui.state.parent = ui.parent;
    render();
  });

  // ---------- Screens ----------
  function render(focusId) {
    renderToolbar();
    var stage = $('rh-stage');
    stage.innerHTML = '';
    if (!ui.state) renderIntro(stage);
    else if (X.isDone(ui.state) && !ui.last) renderEnd(stage);
    else renderPlay(stage);
    if (focusId && $(focusId)) $(focusId).focus();
  }

  function renderIntro(stage) {
    stage.appendChild(el('p', { class: 'rh-intro', text: X.fmt(S('intro'), { p: P() }) }));
    stage.appendChild(el('p', { class: 'hint', text: S('keys') }));
    var b = el('button', { type: 'button', class: 'btn primary', id: 'rh-start', text: S('start') });
    b.addEventListener('click', start);
    stage.appendChild(b);
    stage.appendChild(el('p', { class: 'hint rh-disclaimer', text: S('disclaimer') }));
  }

  function start() {
    ui.state = X.create({ parent: ui.parent });
    ui.last = null;
    render('rh-q');
  }

  function bubble(who, text, cls) {
    return el('li', { class: 'rh-bubble ' + cls }, [el('span', { class: 'rh-who', text: who }), el('span', { class: 'rh-text', text: text })]);
  }

  function renderPlay(stage) {
    var st = ui.state;
    var total = X.ROUNDS.length;
    // While showing feedback, the round on screen is the one just answered.
    var shownRound = ui.last ? ui.last.round : st.round;
    var top = el('div', { class: 'rh-top' }, [
      el('span', { id: 'rh-progress', text: X.fmt(S('round'), { n: shownRound + 1, t: total }) }),
      el('span', { id: 'rh-score', text: X.fmt(S('score'), { s: st.score }) })
    ]);
    stage.appendChild(top);
    var meterLabel = X.fmt(S('meter'), { p: P() });
    var fill = el('div', { class: 'rh-meter-fill' });
    fill.style.width = st.mood + '%'; // CSSOM, allowed by the CSP (no inline style attributes)
    stage.appendChild(el('div', { class: 'rh-meter-wrap' }, [
      el('span', { class: 'rh-meter-label', id: 'rh-meter-label', text: meterLabel }),
      el('div', { class: 'rh-meter', role: 'progressbar', 'aria-labelledby': 'rh-meter-label', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(st.mood), id: 'rh-meter' },
        [fill])
    ]));

    // Transcript: earlier rounds collapsed into the chat, then the current exchange.
    var chat = el('ol', { class: 'rh-chat', id: 'rh-chat' });
    st.picks.forEach(function (pk) {
      var r = X.ROUNDS[pk.round];
      var line = (pk.opened === 'open' ? r.open : r.guarded)[ui.lang];
      var fb = X.feedback(pk.round, pk.index, ui.lang);
      chat.appendChild(bubble(P(), line, 'parent'));
      chat.appendChild(bubble(S('you'), r.options[pk.index].text[ui.lang], 'teen ' + pk.quality));
      chat.appendChild(bubble(P(), fb.reply, 'parent'));
    });
    if (!ui.last) chat.appendChild(bubble(P(), X.parentLine(st, ui.lang), 'parent current'));
    stage.appendChild(chat);

    if (ui.last) {
      var fb = X.feedback(ui.last.round, ui.last.index, ui.lang);
      var coach = el('div', { class: 'rh-coach ' + fb.quality, id: 'rh-coach', tabindex: '-1' }, [
        el('p', { class: 'rh-verdict', text: fb.label }),
        el('p', { class: 'rh-tip', text: fb.tip }),
        sourceList(fb.sources)
      ]);
      stage.appendChild(coach);
      var done = X.isDone(st);
      var nb = el('button', { type: 'button', class: 'btn primary', id: 'rh-next', text: done ? S('finish') : S('next') });
      nb.addEventListener('click', function () { ui.last = null; render(done ? 'rh-result' : 'rh-q'); });
      stage.appendChild(nb);
    } else {
      stage.appendChild(el('p', { class: 'rh-q', id: 'rh-q', tabindex: '-1', text: S('choose') }));
      var list = el('div', { class: 'rh-choices', role: 'group', 'aria-labelledby': 'rh-q', id: 'rh-choices' });
      X.options(st, ui.lang).forEach(function (o, i) {
        var b = el('button', { type: 'button', class: 'rh-choice', 'data-index': String(o.index) }, [
          el('span', { class: 'rh-key', 'aria-hidden': 'true', text: String(i + 1) }), el('span', { text: o.text })
        ]);
        b.addEventListener('click', function () { pick(o.index); });
        list.appendChild(b);
      });
      stage.appendChild(list);
    }
  }

  function pick(index) {
    var round = ui.state.round;
    ui.state = X.choose(ui.state, index);
    ui.last = { round: round, index: index };
    render('rh-next');
    var fb = X.feedback(round, index, ui.lang);
    announce(X.fmt(S('announceChoice'), { q: fb.label, p: P(), r: fb.reply }) + ' ' + fb.tip);
  }

  function renderEnd(stage) {
    var res = X.result(ui.state, ui.lang);
    stage.appendChild(el('h3', { class: 'rh-result', id: 'rh-result', tabindex: '-1', text: S('resultTitle') }));
    stage.appendChild(el('p', { class: 'rh-final' }, [
      el('strong', { id: 'rh-final-score', text: X.fmt(S('scoreLine'), { s: res.score, m: res.max }) }), ' ', res.ratingText
    ]));
    stage.appendChild(el('p', { class: 'rh-ending ' + res.ending, id: 'rh-ending', text: res.endingText }));
    stage.appendChild(el('h4', { text: S('reviewTitle') }));
    var ul = el('ol', { class: 'rh-review', id: 'rh-review' });
    res.rounds.forEach(function (r) {
      var kids = [el('p', { class: 'rh-review-head' }, [el('strong', { text: r.label }), ' ', el('span', { class: 'rh-pill ' + r.quality, text: r.qualityText })])];
      if (r.quality === 'strong') kids.push(el('p', null, [el('em', { text: S('keep') + ': ' }), r.said]));
      else kids.push(el('p', null, [el('em', { text: S('tryThis') + ': ' }), '\u201c' + r.best + '\u201d']));
      kids.push(el('p', { class: 'hint', text: r.tip }));
      kids.push(sourceList(r.sources));
      ul.appendChild(el('li', null, kids));
    });
    stage.appendChild(ul);
    var again = el('button', { type: 'button', class: 'btn primary', id: 'rh-again', text: S('again') });
    again.addEventListener('click', start);
    var talk = el('a', { class: 'btn ghost', href: '#talk', id: 'rh-to-talk', text: S('toTalk') });
    stage.appendChild(el('div', { class: 'form-actions' }, [again, talk]));
    stage.appendChild(el('p', { class: 'hint rh-disclaimer', text: S('disclaimer') }));
    announce(X.fmt(S('announceEnd'), { s: res.score, m: res.max }));
  }

  // Number keys 1-3 answer while focus is inside the simulator (not in a select).
  box.addEventListener('keydown', function (e) {
    if (e.altKey || e.ctrlKey || e.metaKey || !/^[1-9]$/.test(e.key)) return;
    if (e.target && e.target.tagName === 'SELECT') return;
    var btns = box.querySelectorAll('.rh-choice');
    var b = btns[Number(e.key) - 1];
    if (b) { e.preventDefault(); b.click(); }
  });

  render();
})();
