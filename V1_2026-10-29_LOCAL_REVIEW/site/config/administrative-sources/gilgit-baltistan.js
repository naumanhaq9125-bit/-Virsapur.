export default {
  regionId: "gilgit-baltistan",
  officialSourcesToCheck: [{ sourceId: "gb-ppra-current-district-records-2026", priority: 5 }],
  expectedDocumentTypes: ["official-district-portal", "bureau-of-statistics-record", "gazette-notification"],
  knownDistrictListPages: ["https://gilgitbaltistan.gov.pk/", "https://www.gbppra.gov.pk/"],
  knownNotificationRepositories: ["https://gilgitbaltistan.gov.pk/"],
  preferredBoundarySources: ["wfp-ocha-adm2-2022", "gb-official-lower-level-boundaries"],
  parentNameNormalization: { "Gilgit Baltistan": "gilgit-baltistan", "Gilgit-Baltistan": "gilgit-baltistan" },
  officialNameNormalization: { Diamir: "Diamer", Roundu: "Rondu" },
  knownAliases: { diamir: "diamer", roundu: "rondu" },
  sourcePriorityRules: "Require a complete current official district schedule before changing the count.",
  automatedRetrievalPermitted: true,
  manualReviewRequired: true
};
