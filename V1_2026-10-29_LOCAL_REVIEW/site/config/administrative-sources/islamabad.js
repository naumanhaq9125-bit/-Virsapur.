export default {
  regionId: "islamabad",
  officialSourcesToCheck: [{ sourceId: "ict-administration-2026", priority: 5 }],
  expectedDocumentTypes: ["official-district-portal", "gazette-notification"],
  knownDistrictListPages: ["https://ictadministration.gov.pk/"],
  knownNotificationRepositories: ["https://cabinet.gov.pk/"],
  preferredBoundarySources: ["wfp-ocha-adm2-2022"],
  parentNameNormalization: { Islamabad: "islamabad", "Islamabad Capital Territory": "islamabad" },
  officialNameNormalization: {},
  knownAliases: { ict: "islamabad" },
  sourcePriorityRules: "Confirm the single district structure through ICT Administration or a controlling federal instrument.",
  automatedRetrievalPermitted: true,
  manualReviewRequired: false
};
