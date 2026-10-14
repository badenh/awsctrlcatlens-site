# Vendored assets

This directory contains third-party JavaScript / CSS assets committed verbatim to the
repository so the generated static site has no runtime dependency on a third-party CDN
or on `npm install` at build time. The "Baked Data" pattern: integrity is enforced at
build time by `tests/test_vendored_assets.py`, which rejects any byte-level drift from
the SHA-384 recorded here.

## minisearch.min.js

| Field | Value |
|-------|-------|
| Library | [MiniSearch](https://github.com/lucaong/minisearch) |
| Version | 7.2.0 |
| Build flavour | UMD (`dist/umd/index.js` from the published npm tarball — this release does NOT ship a separate `*.min.js`, so the UMD build is the canonical browser distribution) |
| Local filename | `sitegen/assets/minisearch.min.js` |
| Source URL | <https://unpkg.com/minisearch@7.2.0/dist/umd/index.js> |
| npm tarball | <https://registry.npmjs.org/minisearch/-/minisearch-7.2.0.tgz> |
| Size | 86,348 bytes |
| SHA-384 (base64) | `sha384-KuHy7eg9MqWBVrMXJC0WN6q4d3+KBquZ3Htgex79A4REptrDvGOXfAgZ0VOJ1Mdx` |
| Date vendored | 2026-10-09 |
| License | MIT (upstream `LICENSE.txt` in the npm tarball) |

### Provenance chain (how we know this is the real file)

1. The npm registry entry at `https://registry.npmjs.org/minisearch/7.2.0` records the
   release tarball with `shasum = 3dc30e41e9464b3836553b6d969b656614f8f359` and
   `integrity = sha512-dqT2XBYUOZOiC5t2HRnwADjhNS2cecp9u+TJRiJ1Qp/f5qjkeT5APcGPjHw+bz89Ms8Jp+cG4AlE+QZ/QnDglg==`.
2. We downloaded the tarball directly from the registry and verified both digests match.
3. We extracted `package/dist/umd/index.js` from the tarball.
4. We independently downloaded `https://unpkg.com/minisearch@7.2.0/dist/umd/index.js`
   and confirmed `diff` reports zero bytes different vs. the tarball-extracted copy.
5. The file placed at `sitegen/assets/minisearch.min.js` is byte-identical to both of the
   above and digests to the SHA-384 recorded in the table above.
6. The package `minisearch` has 6+ years of history on npm, ~500k weekly downloads, is
   published by `lucaong`, and the GitHub repository `lucaong/minisearch` is public and
   actively maintained. No typosquatting candidates (`mini-search`, `mini_search`,
   `minisearchjs`) exist on npm as of the vendor date.

### How to re-verify

```bash
# From repo root:
openssl dgst -sha384 -binary < sitegen/assets/minisearch.min.js | openssl base64 -A
# Expected: KuHy7eg9MqWBVrMXJC0WN6q4d3+KBquZ3Htgex79A4REptrDvGOXfAgZ0VOJ1Mdx
```

Or run the automated gate:

```bash
uv run pytest tests/test_vendored_assets.py -v
```

### Deviation note

The 02-01-PLAN.md verification steps reference `/dist/umd/index.min.js`. The published
minisearch@7.2.0 tarball does not ship a `*.min.js` build under `dist/umd/`; only
`index.js` + `index.js.map` + `SearchableMap.js` + `SearchableMap.js.map` are present.
The UMD build itself is already a self-contained browser-loadable artifact (IIFE
wrapper + inlined dependencies). We keep the local filename `minisearch.min.js` to
match the plan's committed path, and record the actual upstream URL and build flavour
above so a future audit of the provenance chain is unambiguous.
