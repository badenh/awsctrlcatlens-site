/* search.js — MiniSearch client glue (SITE-UX-01, RESEARCH Q3 Recipe).
 *
 * Progressive enhancement: the HTML search box renders without this script;
 * this file turns it into a live-filter against the vendored MiniSearch
 * UMD global. Index fetch is deferred to the first keystroke.
 */
(function () {
  'use strict';

  var input = document.querySelector('[data-search-input]');
  var results = document.querySelector('[data-search-results]');
  if (!input || !results) { return; }
  // RESEARCH Q3 Pitfall 8 — bail cleanly if the UMD global is missing.
  if (typeof MiniSearch === 'undefined') { return; }

  var mini = null;
  var buildPromise = null;
  var debounceTimer = null;

  function escapeHtml(s) {
    // RESEARCH Q3 Pitfall 7 — sole XSS defence before concatenation into innerHTML.
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function ensureIndex() {
    if (mini) { return Promise.resolve(mini); }
    if (buildPromise) { return buildPromise; }
    buildPromise = fetch('/search.json', { cache: 'force-cache' })
      .then(function (r) { return r.json(); })
      .then(function (records) {
        mini = new MiniSearch({
          fields: ['name', 'aliases', 'framework_items', 'arns'],
          storeFields: ['id', 'kind', 'name', 'frameworks', 'service', 'url'],
          searchOptions: {
            boost: { aliases: 5, framework_items: 4, arns: 4, name: 2 },
            prefix: true,
            fuzzy: false,
            combineWith: 'AND'
          }
        });
        mini.addAll(records);
        return mini;
      });
    return buildPromise;
  }

  function renderHits(hits) {
    if (!hits.length) {
      results.innerHTML = '<li class="search-empty">No matches.</li>';
      results.hidden = false;
      return;
    }
    var html = hits.map(function (h) {
      return '<li><a href="' + encodeURI(h.url) + '">' +
        escapeHtml(h.name) +
        '</a> <small>' + escapeHtml(h.kind) + '</small></li>';
    }).join('');
    results.innerHTML = html;
    results.hidden = false;
  }

  function runSearch() {
    var q = (input.value || '').trim();
    if (!q) {
      results.hidden = true;
      results.innerHTML = '';
      return;
    }
    ensureIndex().then(function (m) {
      var hits = m.search(q).slice(0, 20);
      renderHits(hits);
    });
  }

  input.addEventListener('input', function () {
    if (debounceTimer) { clearTimeout(debounceTimer); }
    debounceTimer = setTimeout(runSearch, 150);
  });
})();
