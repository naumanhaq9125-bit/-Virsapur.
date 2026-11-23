export default {
  regionId: "khyber-pakhtunkhwa",
  officialSourcesToCheck: [
    { sourceId: "kp-revenue-notification-repository", priority: 1 },
    { sourceId: "kp-internship-current-district-list-2026", priority: 5 },
    { sourceId: "kp-dgipr-upper-south-waziristan-2025", priority: 7 }
  ],
  expectedDocumentTypes: ["gazette-notification", "revenue-department-notification", "election-commission-record"],
  knownDistrictListPages: ["https://kp.gov.pk/", "https://internships.kp.gov.pk/"],
  knownNotificationRepositories: ["https://revenue.kp.gov.pk/", "https://kpcode.kp.gov.pk/"],
  preferredBoundarySources: ["wfp-ocha-adm2-2022", "kp-official-lower-level-boundaries"],
  parentNameNormalization: { "Khyber Pakhtunkhwa": "khyber-pakhtunkhwa", NWFP: "khyber-pakhtunkhwa" },
  officialNameNormalization: { "Upper South Waziristan": "South Waziristan Upper", "Lower South Waziristan": "South Waziristan Lower" },
  knownAliases: { "bar-swat": "upper-swat", "upper-south-waziristan": "south-waziristan-upper", "lower-south-waziristan": "south-waziristan-lower" },
  sourcePriorityRules: "Do not infer district creation from a portal selector or count change; locate the controlling Revenue notification.",
  automatedRetrievalPermitted: true,
  manualReviewRequired: true
};
