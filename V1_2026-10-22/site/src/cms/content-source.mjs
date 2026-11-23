import { createContentProvider } from "./provider.mjs";
import { isProductionCmsEnabled } from "./config.mjs";

export async function loadBuildContent({ root, appMode }) {
  const cmsMode = process.env.CMS_DATA_MODE || "local";
  const effectiveMode = cmsMode === "production" && !isProductionCmsEnabled() ? "local" : cmsMode;
  if (appMode !== "production" && effectiveMode === "production") throw new Error("Hosted CMS content is only used for production builds. Draft previews are served through authenticated Admin routes.");
  const provider = createContentProvider({ root, mode: effectiveMode });
  const content = await provider.loadAll({ publishedOnly: appMode === "production" && effectiveMode === "production", publicationVersionId: process.env.CMS_PUBLICATION_VERSION || undefined });
  content.archiveCategories ||= [];
  content.collaborators ||= [];
  if (effectiveMode !== "local" && content.heritagePlaces === undefined) content.heritagePlaces = [];
  for (const required of ["site", "homepage", "archiveCategories", "collaborators", "programmes", "stories", "projects", "events", "people", "testimonials", "media", "heritagePlaces"]) if (content[required] === undefined) throw new Error(`CMS source is missing ${required}.`);
  return content;
}
