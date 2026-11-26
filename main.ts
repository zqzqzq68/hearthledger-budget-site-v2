// HearthLedger — the hand-in program (Node 22, standard library only).
//
// The site itself is plain static files in app/ (index.html, CSS, ES modules,
// no build step, nothing fetched over the network). This program does the one
// job the grader asks of it: it copies app/ and screenshots/ from beside this
// file into the output directory and writes dossier.json there, using the
// vendored make.fun library to summarise the site (its screenshots, the files
// a first load fetches, and its source). Outside the grader, set
// MAKEFUN_OUTPUT_DIR to choose where the output goes:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Inside the grader the output directory is /output.

import { cpSync, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

// The repository root is the directory this file lives in.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the site as it stands: every file under app/, unchanged.
mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });

// Screenshots ride along when they exist; the dossier lists them.
const screenshotsDir = join(outputDir, 'screenshots');
mkdirSync(screenshotsDir, { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), screenshotsDir, { recursive: true });
}

// The dossier must be byte for byte what the vendored library writes, so the
// caps below are the scorer's own: at most 4 screenshots of 256 KiB, app/
// under 993 files and 16 MiB, and the dossier text under 160 KiB.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);

// Say how big the hand-in is, so a local run can be eyeballed at a glance.
const dossierBytes = statSync(join(outputDir, 'dossier.json')).size;
console.log(`HearthLedger handed in: app/ + screenshots/ copied to ${outputDir}, dossier.json written (${dossierBytes} bytes).`);
