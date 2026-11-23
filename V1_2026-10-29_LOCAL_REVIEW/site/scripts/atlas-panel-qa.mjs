import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'qa-artifacts/atlas-panel-pass-2026-09-22');
const baselinePath = join(output, 'protected-baseline.json');
async function hashes() {
  const result = {};
  async function visit(path) {
    for (const entry of await readdir(path, { withFileTypes: true })) {
      const file = join(path, entry.name);
      if (entry.isDirectory()) await visit(file);
      else if (entry.isFile()) result[relative(root, file).replaceAll('\\', '/')] = createHash('sha256').update(await readFile(file)).digest('hex');
    }
  }
  for (const directory of ['dist-production', 'assets/maps', 'data', 'content', 'studio', 'api']) await visit(join(root, directory));
  result['src/heritage-spatial.mjs'] = createHash('sha256').update(await readFile(join(root, 'src/heritage-spatial.mjs'))).digest('hex');
  return result;
}
await mkdir(output, { recursive: true });
const current = await hashes();
if (process.argv.includes('--snapshot')) {
  await writeFile(baselinePath, JSON.stringify(current, null, 2), { flag: 'wx' });
  console.log(`Protected baseline: ${Object.keys(current).length} files.`);
} else {
  const before = JSON.parse(await readFile(baselinePath, 'utf8'));
  const changed = [...new Set([...Object.keys(before), ...Object.keys(current)])].filter(file => before[file] !== current[file]);
  const result = { generatedAt: new Date().toISOString(), protectedFiles: Object.keys(before).length, changed, passed: !changed.length };
  await writeFile(join(output, 'protected-checks.json'), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
  if (changed.length) process.exitCode = 1;
}
