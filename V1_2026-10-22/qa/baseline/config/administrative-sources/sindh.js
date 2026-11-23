export default {
  regionId: "sindh",
  officialSourcesToCheck: [
    { sourceId: "sindh-board-of-revenue-repository", priority: 1 },
    { sourceId: "sindh-current-official-directory-2026", priority: 5 }
  ],
  expectedDocumentTypes: ["gazette-notification", "board-of-revenue-notification", "local-government-demarcation"],
  knownDistrictListPages: ["https://www.sindh.gov.pk/"],
  knownNotificationRepositories: ["https://bor.sindh.gov.pk/", "https://www.sindh.gov.pk/notifications"],
  preferredBoundarySources: ["wfp-ocha-adm2-2022", "sindh-official-lower-level-boundaries"],
  parentNameNormalization: { Sindh: "sindh" },
  officialNameNormalization: { "West Karachi": "Karachi West", "Central Karachi": "Karachi Central" },
  knownAliases: { kemari: "keamari", "karachi-west": "west-karachi" },
  sourcePriorityRules: "Use Gazette or Board of Revenue material before directories or departmental lists.",
  automatedRetrievalPermitted: true,
  manualReviewRequired: true
};
