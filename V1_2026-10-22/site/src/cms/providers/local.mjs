import { readFile } from "node:fs/promises";
import { join } from "node:path";

export function createLocalProvider(root) {
  const read = async name => JSON.parse(await readFile(join(root, "content", "data", `${name}.json`), "utf8"));
  return {
    mode: "local",
    async loadAll() {
      const sources = {
        site: "site",
        homepage: "homepage",
        archiveCategories: "archive-categories",
        collaborators: "collaborators",
        programmes: "programmes",
        stories: "stories",
        projects: "projects",
        events: "events",
        people: "people",
        testimonials: "testimonials",
        media: "media",
        heritagePlaces: "heritage-places"
      };
      return Object.fromEntries(await Promise.all(Object.entries(sources).map(async ([name, file]) => [name, await read(file)])));
    }
  };
}
