/* enhance.js — progressive-enhancement IIFEs (RESEARCH Q6 Recipe + W5 fix).
 *
 * Six features run under one DOMContentLoaded handler. Per-feature try/catch
 * so one broken IIFE does not kill the others. Pure DOM; no module system.
 *
 * CSP: compatible with `script-src 'self'` — no inline handlers wired here;
 * every event listener is attached via addEventListener.
 */
(function () {
  'use strict';

  // W5 fix: replaces inline `onsubmit="return false;"` on the search form.
  // Without-JS fallback: the form submits to action="/" (same page) which
  // simply reloads — acceptable progressive-enhancement degradation.
  function wireSearchForm() {
    var form = document.querySelector('form.site-search');
    if (!form) { return; }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
    });
  }

  // SITE-UX-04 — chips toggle [hidden] on rows based on data-filter-tags.
  function filterChips() {
    var chips = document.querySelectorAll('[data-filter-chip]');
    if (!chips.length) { return; }
    var active = Object.create(null); // group -> Set of selected tokens

    function apply() {
      // Compute which groups are active (have at least one chip selected).
      var activeGroups = Object.keys(active).filter(function (g) {
        return active[g] && active[g].size > 0;
      });
      var rows = document.querySelectorAll('[data-filter-tags]');
      rows.forEach(function (row) {
        var tags = (row.getAttribute('data-filter-tags') || '').split(/\s+/);
        // Row is visible iff for every active group, the row has at least
        // one tag whose "group:" prefix is in that group's selected set.
        var visible = activeGroups.every(function (g) {
          var sel = active[g];
          return tags.some(function (t) {
            var parts = t.split(':');
            return parts.length === 2 && parts[0] === g && sel.has(t);
          });
        });
        row.hidden = !visible;
      });
    }

    chips.forEach(function (chip) {
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      var tag = chip.getAttribute('data-filter-chip') || '';
      var group = tag.split(':')[0] || '';

      function toggle() {
        if (!active[group]) { active[group] = new Set(); }
        if (active[group].has(tag)) {
          active[group].delete(tag);
          chip.classList.remove('is-active');
          chip.setAttribute('aria-pressed', 'false');
        } else {
          active[group].add(tag);
          chip.classList.add('is-active');
          chip.setAttribute('aria-pressed', 'true');
        }
        apply();
      }

      chip.setAttribute('aria-pressed', 'false');
      chip.addEventListener('click', toggle);
      chip.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle();
        }
      });
    });
  }

  // SITE-UX-05 — copy ARN; prefer async clipboard, fall back to textarea
  // (RESEARCH Q6 Pitfall 2 — file:// contexts lack navigator.clipboard).
  function arnClipboard() {
    var buttons = document.querySelectorAll('[data-copy-arn]');
    buttons.forEach(function (btn) {
      btn.hidden = false;
      btn.addEventListener('click', function () {
        var arn = btn.getAttribute('data-copy-arn') || '';
        var done = function () {
          var prev = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(function () { btn.textContent = prev; }, 1500);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(arn).then(done, fallback);
        } else {
          fallback();
        }
        function fallback() {
          var ta = document.createElement('textarea');
          ta.value = arn;
          ta.setAttribute('readonly', '');
          ta.style.position = 'absolute';
          ta.style.left = '-9999px';
          document.body.appendChild(ta);
          ta.select();
          try { document.execCommand('copy'); done(); }
          catch (_) { /* silent */ }
          document.body.removeChild(ta);
        }
      });
    });
  }

  // SITE-UX-08 — reveal staleness slot if fetched-at is older than the
  // weekly refresh cadence plus grace. Weekly cron = 168h; grace = 24h → 192h.
  function stalenessBanner() {
    var meta = document.querySelector('meta[name="fetched-at"]');
    var slot = document.querySelector('[data-staleness-slot]');
    if (!meta || !slot) { return; }
    var fetched = new Date(meta.getAttribute('content') || '');
    if (isNaN(fetched.getTime())) { return; } // RESEARCH Q6 Pitfall 5
    var ageHours = (Date.now() - fetched.getTime()) / 3600000;
    if (ageHours > 192) {
      slot.className = 'staleness-banner staleness-warning';
      slot.textContent = 'Snapshot is ' + (ageHours / 24).toFixed(1) +
        ' days old (expected: ≤ 8). Weekly refresh may have failed.';
      slot.hidden = false;
    }
  }

  // Autosuggest keyboard navigation over the search result list.
  function autosuggestDropdown() {
    var input = document.querySelector('[data-search-input]');
    var list = document.querySelector('[data-search-results]');
    if (!input || !list) { return; }

    function items() { return Array.prototype.slice.call(list.querySelectorAll('li')); }
    function clearHighlights() { items().forEach(function (li) { li.classList.remove('is-highlighted'); }); }

    input.addEventListener('keydown', function (e) {
      var lis = items();
      if (!lis.length) { return; }
      var idx = lis.findIndex(function (li) { return li.classList.contains('is-highlighted'); });
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        clearHighlights();
        var next = lis[(idx + 1) % lis.length];
        if (next) { next.classList.add('is-highlighted'); }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        clearHighlights();
        var prev = lis[(idx - 1 + lis.length) % lis.length];
        if (prev) { prev.classList.add('is-highlighted'); }
      } else if (e.key === 'Enter') {
        var cur = lis[idx];
        if (cur) {
          var a = cur.querySelector('a');
          if (a && a.href) {
            e.preventDefault();
            window.location.href = a.href;
          }
        }
      } else if (e.key === 'Escape') {
        list.hidden = true;
        clearHighlights();
      }
    });
  }

  // Anchor-copy buttons on headings — click copies the full URL w/ fragment.
  function copyAnchor() {
    var headings = document.querySelectorAll('h2[id], h3[id]');
    headings.forEach(function (h) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'anchor-copy';
      btn.textContent = '#';
      btn.setAttribute('aria-label', 'Copy link to this section');
      btn.addEventListener('click', function () {
        var url = window.location.origin + window.location.pathname + '#' + h.id;
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url);
        }
      });
      h.appendChild(document.createTextNode(' '));
      h.appendChild(btn);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    // W5: wireSearchForm first so submit-prevention is live before user
    // can interact with the search field.
    [wireSearchForm, filterChips, arnClipboard, stalenessBanner, autosuggestDropdown, copyAnchor]
      .forEach(function (feature) {
        try { feature(); }
        catch (e) { if (window.console) { console.warn(feature.name, 'failed:', e); } }
      });
  });
})();
