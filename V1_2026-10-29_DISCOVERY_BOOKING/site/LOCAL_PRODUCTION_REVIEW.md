# Local Production review snapshot

Local Production at http://127.0.0.1:4174/production/ now contains all real working content, including Draft and Review records. Demo fixtures are excluded. Content states, editorial holds and rights metadata are unchanged. Nothing has been published remotely.

This snapshot uses the current development photography and features for private review. All pages are noindex, robots disallow crawling, and the local server binds only to loopback. It is not an approved public release. The original release candidate and the October 22 D-drive handoff remain separate captured releases.

To refresh the snapshot from current working data, run from this project:

```powershell
npm run stage:local-production
```

The command builds and crawls a temporary local review version, checks canonical content and existing builds for changes, checks real-record coverage and demo exclusion, backs up the previous Production folder, and swaps the verified version into `dist-production/`. It does not call a publication endpoint or change record statuses. Saves in Studio continue to rebuild Preview only.

The existing Publish to Local Production action still creates a clean build from Published content only. It is a separate explicit action and was not used for this snapshot. `npm run build` and `npm run build:candidate` also retain their existing public-content and release-media gates.

See `qa-artifacts/local-production-sync-2026-10-23/SYNC_REPORT.json` for the actual route/content counts and backup path, and `TECHNICAL_QA.json` for the local link/SEO crawl. Earlier protection reports describe the previous finalization pass; this explicitly requested local snapshot is recorded separately.
