import { mkdir, writeFile } from "node:fs/promises";
import { homepage } from "../content/homepage.mjs";
import { people } from "../content/people.mjs";
import { programmes } from "../content/programmes.mjs";
import { projects } from "../content/projects.mjs";
import { siteSettings } from "../content/site.mjs";
import { stories } from "../content/stories.mjs";
import { testimonials } from "../content/testimonials.mjs";

const root = new URL("..", import.meta.url);
const data = new URL("../content/data/", import.meta.url);
await mkdir(data, { recursive: true });

siteSettings.mission = "Bridge historical knowledge and public engagement through research, interpretation and shared experience.";
siteSettings.vision = "A future in which Pakistan’s diverse heritage is visible, understood and carried forward with care.";
siteSettings.productionDomain = siteSettings.defaultSiteOrigin;
siteSettings.navigation = siteSettings.navigation.map(item => ({ ...item, visible: true, required: item.id === "home" }));
siteSettings.navigation.splice(4, 0, { id: "whats-on", label: "What’s On", route: "/whats-on", visible: true, required: false });
siteSettings.navigation = siteSettings.navigation.map(item => item.id === "work" ? { ...item, route: "/our-work" } : item);
siteSettings.commerce = { enabled: false, mode: "enquiry", currency: "PKR", amount: null, label: "" };
siteSettings.paymentMode = "disabled";

for (const programme of programmes) {
  programme.kind = programme.id.includes("workshop") ? "workshop" : programme.id.includes("research") ? "project programme" : "experience";
  programme.commerce = { enabled: false, mode: "enquiry", currency: "PKR", amount: null, label: programme.cta.label };
  programme.scheduleNotes = "";
}

for (const story of stories) {
  story.body = story.body ? [{ type: "paragraph", text: story.body }] : [];
  story.relatedDistrictIds = [];
  story.previousSlugs = [];
}

for (const project of projects) {
  project.body = project.body ? [{ type: "paragraph", text: project.body }] : [];
  project.relatedProgrammeIds = ["programme-research-restoration"];
  project.relatedDistrictIds = [];
  project.previousSlugs = [];
}

const homepageData = {
  ...homepage,
  mission: { eyebrow: "Our purpose", title: siteSettings.purpose, mission: siteSettings.mission, vision: siteSettings.vision },
  themes: {
    eyebrow: "Explore by theme",
    title: "Follow the threads that connect people and place.",
    items: [
      { label: "Architecture", route: "/archives?category=Architecture" },
      { label: "Archaeology", route: "/archives?category=Archaeology" },
      { label: "Living traditions", route: "/archives?category=Living%20traditions" },
      { label: "Sacred heritage", route: "/archives?category=Sacred%20heritage" }
    ]
  },
  modules: [
    ...homepage.modules.slice(0, 7),
    { id: "themes", type: "themes", enabled: true },
    { id: "mission", type: "mission", enabled: true },
    ...homepage.modules.slice(7)
  ]
};

const emptyEvents = [];
const media = [];
const files = { site: siteSettings, homepage: homepageData, programmes, stories, projects, events: emptyEvents, people, testimonials, media };
for (const [name, value] of Object.entries(files)) {
  await writeFile(new URL(`../content/data/${name}.json`, import.meta.url), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
console.log(`Migrated ${stories.length} stories, ${projects.length} projects and ${programmes.length} programmes to content/data.`);
