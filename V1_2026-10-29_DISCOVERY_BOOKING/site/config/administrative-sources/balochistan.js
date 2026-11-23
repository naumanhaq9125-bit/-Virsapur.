export default {
  regionId: "balochistan",
  officialSourcesToCheck: [
    { sourceId: "balochistan-gazette-index-2026", priority: 1 },
    { sourceId: "balochistan-board-of-revenue-repository", priority: 2 }
  ],
  expectedDocumentTypes: ["gazette-notification", "board-of-revenue-notification", "revenue-department-notification"],
  knownDistrictListPages: ["https://balochistan.gov.pk/"],
  knownNotificationRepositories: ["https://balochistan.gov.pk/gazette/", "https://bor.balochistan.gov.pk/"],
  preferredBoundarySources: ["wfp-ocha-adm2-2022", "balochistan-official-lower-level-boundaries"],
  parentNameNormalization: { Balochistan: "balochistan" },
  officialNameNormalization: { "Shaheed Sikandarabad": "Surab", Sibi: "Sevi" },
  knownAliases: { breshore: "barshore", surab: "shaheed-sikandarabad", sevi: "sibi" },
  sourcePriorityRules: "The reported July 2026 package must not be applied without the Gazette instrument and boundary schedules.",
  automatedRetrievalPermitted: true,
  manualReviewRequired: true
};
