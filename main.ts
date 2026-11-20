// Leonida Trophy Guide — entrypoint (Node 22, standard library only).
//
// What it does, in order:
//   1. Validates the guide data in app/data/trophies.json: it must parse, hold
//      exactly 55 trophies, every one with a non-blank guide and at least one
//      source, and no two trophies sharing a name. Anything else fails loudly.
//   2. Copies app/ and screenshots/ from beside this file into the output
//      directory (MAKEFUN_OUTPUT_DIR, or /output in the grader).
//   3. Writes output/dossier.json with buildDossier from the vendored
//      make.fun library, so the judge reads exactly what the scorer rebuilds.
//
// No network, no installs, deterministic: two runs write byte-identical bytes.

import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const EXPECTED_TROPHIES = 55;

function fail(message: string): never {
  throw new Error('main.ts: ' + message);
}

function validateTrophies(): void {
  const dataPath = join(REPO_ROOT, 'app', 'data', 'trophies.json');
  let doc: unknown;
  try {
    doc = JSON.parse(readFileSync(dataPath, 'utf-8'));
  } catch (error) {
    fail('app/data/trophies.json does not parse: ' + (error as Error).message);
  }
  const trophies = (doc as { trophies?: unknown }).trophies;
  if (!Array.isArray(trophies)) fail('app/data/trophies.json has no "trophies" array');
  if (trophies.length !== EXPECTED_TROPHIES) {
    fail('expected ' + EXPECTED_TROPHIES + ' trophies, found ' + trophies.length);
  }
  const seenNames = new Set<string>();
  for (const trophy of trophies) {
    const item = trophy as { name?: unknown; guide?: unknown; sources?: unknown };
    if (typeof item.name !== 'string' || item.name.trim() === '') fail('a trophy has no name');
    if (seenNames.has(item.name)) fail('duplicate trophy name: ' + item.name);
    seenNames.add(item.name);
    if (typeof item.guide !== 'string' || item.guide.trim() === '') {
      fail('trophy "' + item.name + '" has no guide');
    }
    if (!Array.isArray(item.sources) || item.sources.length === 0) {
      fail('trophy "' + item.name + '" names no source');
    }
  }
}

function copyEntry(): void {
  const appSource = join(REPO_ROOT, 'app');
  const shotsSource = join(REPO_ROOT, 'screenshots');
  if (!existsSync(join(appSource, 'index.html'))) fail('app/index.html is missing');
  if (!existsSync(shotsSource)) fail('screenshots/ is missing');
  mkdirSync(OUTPUT_DIR, { recursive: true });
  rmSync(join(OUTPUT_DIR, 'app'), { recursive: true, force: true });
  rmSync(join(OUTPUT_DIR, 'screenshots'), { recursive: true, force: true });
  cpSync(appSource, join(OUTPUT_DIR, 'app'), { recursive: true });
  cpSync(shotsSource, join(OUTPUT_DIR, 'screenshots'), { recursive: true });
}

function writeDossier(): void {
  const dossier = buildDossier(OUTPUT_DIR, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  });
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
}

validateTrophies();
copyEntry();
writeDossier();
console.log('dossier written to ' + join(OUTPUT_DIR, 'dossier.json'));
