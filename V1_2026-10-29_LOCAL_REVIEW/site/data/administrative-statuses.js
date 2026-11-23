export const ADMINISTRATIVE_STATUS_VALUES = Object.freeze({
  snapshot: Object.freeze([
    "verified",
    "partially-reconciled",
    "historical-snapshot",
    "update-pending"
  ]),
  legal: Object.freeze([
    "verified",
    "reported-not-verified",
    "disputed",
    "historical",
    "superseded",
    "unknown"
  ]),
  naming: Object.freeze([
    "verified",
    "reported-not-verified",
    "source-conflict",
    "historical",
    "unknown"
  ]),
  geometry: Object.freeze([
    "verified",
    "derived-from-official-units",
    "pending-authoritative-boundary",
    "source-conflict",
    "invalid",
    "historical-only"
  ]),
  publication: Object.freeze([
    "publishable",
    "withheld",
    "historical-only",
    "review-required"
  ]),
  changeType: Object.freeze([
    "district-created",
    "district-split",
    "district-merged",
    "district-renamed",
    "district-abolished",
    "district-restored",
    "boundary-adjusted",
    "parent-changed",
    "source-correction",
    "geometry-correction"
  ]),
  sourceType: Object.freeze([
    "gazette-notification",
    "board-of-revenue-notification",
    "revenue-department-notification",
    "local-government-demarcation",
    "election-commission-record",
    "bureau-of-statistics-record",
    "official-district-portal",
    "authoritative-boundary-dataset",
    "official-lower-level-boundary-dataset",
    "reputable-secondary-report"
  ])
});

export const SOURCE_PRIORITY = Object.freeze({
  "gazette-notification": 1,
  "board-of-revenue-notification": 2,
  "revenue-department-notification": 2,
  "local-government-demarcation": 3,
  "election-commission-record": 4,
  "official-district-portal": 5,
  "bureau-of-statistics-record": 6,
  "authoritative-boundary-dataset": 6,
  "official-lower-level-boundary-dataset": 6,
  "reputable-secondary-report": 8
});

export const REVIEW_INTERVALS_DAYS = Object.freeze({
  verifiedStable: 180,
  recentChange: 30,
  unresolvedGeometry: 30,
  secondarySourceOnly: 14
});
