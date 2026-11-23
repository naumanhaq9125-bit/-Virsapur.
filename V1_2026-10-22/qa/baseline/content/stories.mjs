const records = [
  ["story-wells-mohenjodaro", "the-wells-of-mohenjodaro", "The wells of Mohenjodaro", "Archaeology", "Mohenjo-daro", "Sindh", "archive-wells.jpg", 640, 404],
  ["story-mohenjodaro-lanes", "mohenjo-daro-residential-lanes", "Mohenjo Daro Residential Lanes", "Urban history", "Mohenjo-daro", "Sindh", "archive-lanes.jpg", 640, 426],
  ["story-mohenjodaro-architecture", "mohenjo-daro-architecture", "Mohenjo Daro Architecture", "Architecture", "Mohenjo-daro", "Sindh", "archive-architecture.webp", 640, 426],
  ["story-priest-king", "priest-king", "Priest-King", "Object story", "Mohenjo-daro", "Sindh", "archive-priest-king.jpg", 640, 426],
  ["story-tomb-anarkali", "tomb-of-anarkali", "Tomb of Anarkali", "Built heritage", "Lahore", "Punjab", "archive-anarkali.jpg", 640, 426],
  ["story-gurdwara-lahura", "gurdwara-lahura-sahib", "Gurdwara Lahura Sahib", "Sacred heritage", "", "Punjab", "archive-gurdwara.jpg", 639, 426],
  ["story-shaheed-ganj", "gurudwara-shaheed-ganj-singh-singhnian", "Gurudwara Shaheed Ganj Singh Singhnian", "Sacred heritage", "Lahore", "Punjab", "archive-gurdwara.jpg", 639, 426],
  ["story-katas-raj", "katas-raj", "Katas Raj", "Sacred heritage", "Chakwal", "Punjab", "archive-katas.jpg", 640, 379],
  ["story-satgraha-temples", "satgraha-temples", "Satgraha Temples", "Architecture", "Katas Raj", "Punjab", "temple_distant.jpg", 1200, 800],
  ["story-havan-kund", "havan-kund", "Havan Kund", "Living traditions", "Katas Raj", "Punjab", "temple_entrance.jpg", 1200, 800],
  ["story-khewra-mines", "khewra-salt-mines", "Khewra Salt Mines", "Cultural landscape", "Jhelum", "Punjab", "pillar_white.jpg", 1200, 800],
  ["story-great-bath", "great-bath-of-mohenjo-daro", "Great Bath of Mohenjo-Daro", "Archaeology", "Mohenjo-daro", "Sindh", "archive-architecture.webp", 640, 426]
];

export const stories = records.map(([id, slug, title, category, district, province, image, width, height], index) => ({
  id,
  type: "story",
  slug,
  status: "draft",
  title,
  summary: "",
  category,
  location: [district, province].filter(Boolean).join(" · "),
  province,
  district,
  author: "",
  publishedAt: "",
  updatedAt: "",
  body: "",
  references: [],
  relatedProgrammeIds: [],
  relatedProjectIds: [],
  featured: false,
  sortOrder: index + 1,
  featuredImage: {
    src: `assets/${image}`,
    optimizedStem: image.replace(/\.[^.]+$/, "").replace(/_/g, "-"),
    width,
    height,
    alt: `${title}, ${[district, province].filter(Boolean).join(", ")}`,
    caption: "",
    credit: ""
  },
  seo: {
    title: `${title} | Virsapur Archives`,
    description: `A Virsapur archive record about ${title}.`,
    image: `assets/${image}`
  }
}));
