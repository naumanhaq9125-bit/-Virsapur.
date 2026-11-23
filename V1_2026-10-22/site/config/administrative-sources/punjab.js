export default {
  regionId: "punjab",
  officialSourcesToCheck: [
    { sourceId: "punjab-board-of-revenue-repository", priority: 1 },
    { sourceId: "punjab-smbr-functionalization-2022", priority: 2 },
    { sourceId: "punjab-pera-district-list-2025", priority: 5 }
  ],
  expectedDocumentTypes: ["gazette-notification", "board-of-revenue-notification", "local-government-demarcation"],
  knownDistrictListPages: ["https://pera.punjab.gov.pk/"],
  knownNotificationRepositories: ["https://digitallibrary.punjab.gov.pk/", "https://bor.punjab.gov.pk/"],
  preferredBoundarySources: ["wfp-ocha-adm2-2022", "punjab-official-lower-level-boundaries"],
  parentNameNormalization: { Punjab: "punjab" },
  officialNameNormalization: { Leiah: "Layyah" },
  knownAliases: { leiah: "layyah", tounsa: "taunsa" },
  sourcePriorityRules: "Follow the formal source hierarchy; current government lists corroborate but do not replace creation notifications.",
  automatedRetrievalPermitted: true,
  manualReviewRequired: true
};
