/* Minimal stand-in for the Claude Dashboard runtime, so the tracker page runs on any static host.
   Loads data/<dataset>.json, runs the page's calculations, and redraws on data, language and width changes. */
(function () {
  'use strict';
  var DATASETS = ['quarterly', 'annual', 'balance_sheet', 'kpis', 'deal', 'price_history', 'commitments',
    'commit_schedule', 'lockups', 'events', 'scenarios', 'sources', 'notes'];
  var DEFAULT_PARAMS = { lang: 'ko' };

  var calcs = {};
  var calcOrder = [];
  var draws = {};
  var drawOrder = [];
  var onDataFns = [];
  var results = {};
  var params = Object.assign({}, DEFAULT_PARAMS);

  try {
    var saved = window.localStorage.getItem('ant-tracker-lang');
    if (saved === 'en' || saved === 'ko') params.lang = saved;
  } catch (e) { /* storage unavailable */ }
  try {
    var asked = new URLSearchParams(window.location.search).get('lang');
    if (asked === 'en' || asked === 'ko') params.lang = asked;
  } catch (e) { /* no query string */ }

  function setDocLang() {
    var ko = params.lang !== 'en';
    document.documentElement.lang = ko ? 'ko' : 'en';
    document.title = ko ? 'Anthropic (ANT) 트래커' : 'Anthropic (ANT) tracker';
  }

  function runDraw(name) {
    var fn = draws[name];
    if (!fn) return;
    document.querySelectorAll('[data-draw="' + name + '"]').forEach(function (el) {
      try { fn(el); } catch (e) { console.error('draw ' + name, e); }
    });
  }

  function refresh() {
    setDocLang();
    onDataFns.forEach(function (fn) { try { fn(); } catch (e) { console.error('onData', e); } });
    drawOrder.forEach(runDraw);
  }

  function computeCalcs() {
    var pending = calcOrder.slice();
    var progress = true;
    while (pending.length && progress) {
      progress = false;
      pending = pending.filter(function (id) {
        var c = calcs[id];
        var ready = c.inputs.every(function (i) { return results[i] && results[i].status === 'ok'; });
        if (!ready) {
          var failed = c.inputs.some(function (i) { return results[i] && results[i].status === 'error'; });
          if (failed) { results[id] = { status: 'error', data: [], message: 'An input failed to load' }; progress = true; return false; }
          return true;
        }
        try {
          var out = c.fn.apply(null, c.inputs.map(function (i) { return results[i].data; }));
          results[id] = { status: 'ok', data: Array.isArray(out) ? out : [out] };
        } catch (e) {
          console.error('calc ' + id, e);
          results[id] = { status: 'error', data: [], message: String(e) };
        }
        progress = true;
        return false;
      });
    }
  }

  function load() {
    return Promise.all(DATASETS.map(function (id) {
      results[id] = { status: 'loading', data: [] };
      return fetch('data/' + id + '.json', { cache: 'no-cache' })
        .then(function (r) { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.json(); })
        .then(function (json) {
          var rows = Array.isArray(json) ? json : (json.rows || json.data || json.results || []);
          results[id] = { status: 'ok', data: rows };
        })
        .catch(function (e) {
          console.error('load ' + id, e);
          results[id] = { status: 'error', data: [], message: String(e) };
        });
    })).then(function () { computeCalcs(); refresh(); });
  }

  window.dash = {
    colors: ['var(--series-1)', 'var(--series-2)', 'var(--series-3)', 'var(--series-4)',
      'var(--series-5)', 'var(--series-6)', 'var(--series-7)', 'var(--series-8)'],
    calc: function (id, opts) { calcs[id] = opts; calcOrder.push(id); },
    loader: function () { /* not used on the static site */ },
    data: function (id) { return results[id] || { status: 'loading', data: [] }; },
    onData: function (fn) { onDataFns.push(fn); try { fn(); } catch (e) { /* before data */ } },
    draw: function (name, fn) {
      if (fn === undefined) { runDraw(name); return; }
      if (!draws[name]) drawOrder.push(name);
      draws[name] = fn;
    },
    params: function () { return Object.assign({}, params); },
    setParams: function (p) {
      Object.keys(p).forEach(function (k) { if (p[k] === null || p[k] === undefined) delete params[k]; else params[k] = p[k]; });
      try { if (params.lang) window.localStorage.setItem('ant-tracker-lang', params.lang); } catch (e) { /* ignore */ }
      refresh();
    },
    resetParams: function () { params = Object.assign({}, DEFAULT_PARAMS); refresh(); },
    setLink: function (name) { try { history.replaceState(null, '', '#' + name); } catch (e) { /* ignore */ } },
    refresh: function () { return load(); },
  };

  var resizeTimer = null;
  var lastWidth = window.innerWidth;
  window.addEventListener('resize', function () {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(refresh, 150);
  });

  document.addEventListener('DOMContentLoaded', function () { refresh(); load(); });
})();
