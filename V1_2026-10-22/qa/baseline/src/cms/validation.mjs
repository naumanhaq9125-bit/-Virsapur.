const allowedStatuses = new Set(["draft", "review", "published", "archived"]);

export function validateCollection(name, value) {
  const errors = [];
  if (!Array.isArray(value)) return [`${name} must be an array.`];
  const ids = new Set();
  const slugs = new Set();
  for (const record of value) {
    if (!record || typeof record !== "object") { errors.push(`${name} contains an invalid record.`); continue; }
    if (!record.id) errors.push("Every record needs a stable ID.");
    else if (ids.has(record.id)) errors.push(`Duplicate ID: ${record.id}`);
    else ids.add(record.id);
    if (record.demo === true) errors.push(`${record.id || "Record"}: demo records cannot enter canonical content.`);
    if (!allowedStatuses.has(record.status || "draft")) errors.push(`${record.id || "Record"}: invalid workflow state.`);
    if (record.slug) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug)) errors.push(`${record.title || record.id}: slug must use lowercase words and hyphens.`);
      if (slugs.has(record.slug)) errors.push(`Duplicate slug: ${record.slug}`);
      slugs.add(record.slug);
    }
  }
  return errors;
}

export function validateSingleton(name, value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [`${name} must be an object.`];
  if (name === "site" && !value.navigation?.some(item => item.id === "home" && item.visible !== false && item.route === "/")) return ["Home is protected and must remain visible at /. "];
  return [];
}

export function validateForPublish(collection, record) {
  const required = collection === "stories" ? ["title", "slug", "summary", "primaryCategoryId", "categoryIds", "featuredImage", "seo", "body"]
    : collection === "archiveCategories" ? ["title", "slug", "summary", "description", "featuredImage", "seo"]
    : collection === "collaborators" ? ["name", "logo"]
    : collection === "projects" ? ["title", "slug", "summary", "featuredImage", "seo", "body"]
    : collection === "events" ? ["programmeId", "start", "registrationState", "location"]
    : ["title", "slug", "summary"];
  const errors = required.filter(field => !record?.[field] || (Array.isArray(record[field]) && !record[field].length)).map(field => `${field} is required before publishing.`);
  if (["stories", "archiveCategories"].includes(collection) && !record?.featuredImage?.alt) errors.push("Image alt text is required before publishing.");
  if (["stories", "projects", "archiveCategories"].includes(collection) && (!record?.seo?.title || !record?.seo?.description)) errors.push("SEO title and description are required before publishing.");
  if (record?.demo === true) errors.push("Demo records cannot be published.");
  return errors;
}
