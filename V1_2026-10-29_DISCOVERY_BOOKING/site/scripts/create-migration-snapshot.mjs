import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";

const root = new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1");
const label = process.argv.find(value => value.startsWith("--label="))?.slice(8) || new Date().toISOString().slice(0, 10);
const destination = join(root, "backups", "pre-production-cms-migration", label);
const targets = [
  "content",
  "assets",
  "studio",
  "studio-data",
  "src",
  "app.js",
  "build.mjs",
  "qa.mjs",
  "package.json",
  "site.config.mjs",
  "styles.css",
  "vercel.json",
  "STUDIO_USER_GUIDE.md",
  "VIRSAPUR_V1_ARCHITECTURE.md"
];

async function filesIn(path) {
  const info = await stat(path);
  if (info.isFile()) return [path];
  const files = [];
  for (const entry of await readdir(path, { withFileTypes: true })) files.push(...await filesIn(join(path, entry.name)));
  return files;
}

await mkdir(destination, { recursive: true });
for (const target of targets) await cp(join(root, target), join(destination, target), { recursive: true, force: false, errorOnExist: true });

const paths = (await Promise.all(targets.map(target => filesIn(join(destination, target))))).flat().sort();
const files = [];
for (const path of paths) {
  const bytes = await readFile(path);
  files.push({
    path: relative(destination, path).replaceAll("\\", "/"),
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex")
  });
}
const manifest = {
  format: "virsapur-migration-snapshot/v1",
  createdAt: new Date().toISOString(),
  purpose: "Pre-production-CMS reversible baseline",
  root: destination,
  fileCount: files.length,
  totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
  fixturePolicy: "Demo fixtures are backed up for local recovery but excluded from the production content export and hosted migration.",
  files
};
await writeFile(join(destination, "SNAPSHOT_MANIFEST.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Snapshot created at ${destination}`);
console.log(`${manifest.fileCount} files, ${manifest.totalBytes} bytes`);
