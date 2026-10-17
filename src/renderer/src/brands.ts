import antigravity from './assets/brands/antigravity.png';
import antigravityTools from './assets/brands/antigravity-tools-cutout.svg';
import ccSwitch from './assets/brands/cc-switch.png';
import claude from './assets/brands/claude-cutout.svg';
import codex from './assets/brands/codex-cutout.svg';
import cursor from './assets/brands/cursor.svg';
import deepseekHarness from './assets/brands/deepseek-harness.svg';
import gemini from './assets/brands/gemini-cutout.svg';
import nodejs from './assets/brands/nodejs.svg';
import ollama from './assets/brands/ollama.png';
import opencode from './assets/brands/opencode-cutout.svg';
import qoder from './assets/brands/qoder.svg';
import trae from './assets/brands/trae-cutout.svg';
import windsurf from './assets/brands/windsurf.svg';
import zcode from './assets/brands/zcode-cutout.svg';

// Static imports keep brand assets local in both Vite previews and Electron file:// builds.
// Original asset URLs and checksums are recorded in assets/brands/sources.json.
export const brandLogos: Readonly<Record<string, string>> = {
  codex,
  'codex-desktop': codex,
  claude,
  'claude-desktop': claude,
  gemini,
  cursor,
  windsurf,
  trae,
  qoder,
  antigravity,
  zcode,
  'antigravity-tools': antigravityTools,
  'deepseek-harness': deepseekHarness,
  'cc-switch': ccSwitch,
  opencode,
  ollama,
  nodejs,
};
