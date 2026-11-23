export default {
  regionId: "azad-kashmir",
  officialSourcesToCheck: [{ sourceId: "ajk-food-district-table-2026", priority: 6 }],
  expectedDocumentTypes: ["official-district-portal", "bureau-of-statistics-record", "gazette-notification"],
  knownDistrictListPages: ["https://ajk.gov.pk/", "https://food.ajk.gov.pk/"],
  knownNotificationRepositories: ["https://law.ajk.gov.pk/"],
  preferredBoundarySources: ["wfp-ocha-adm2-2022", "ajk-official-lower-level-boundaries"],
  parentNameNormalization: { "Azad Kashmir": "azad-kashmir", "Azad Jammu and Kashmir": "azad-kashmir" },
  officialNameNormalization: { "Hattian Bala": "Jhelum Valley", "Jehlum Valley": "Jhelum Valley" },
  knownAliases: { "hattian-bala": "jhelum-valley", "jehlum-valley": "jhelum-valley" },
  sourcePriorityRules: "Treat Hattian Bala as an alias/headquarters or tehsil name unless a controlling instrument names the district otherwise.",
  automatedRetrievalPermitted: true,
  manualReviewRequired: true
};
