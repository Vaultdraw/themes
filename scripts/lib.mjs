// Shared helpers for build-index.mjs and validate.mjs. No dependencies.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

export const MAX_BYTES = 64 * 1024;
export const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const HEX6 = /^#[0-9a-fA-F]{6}$/;
export const REQUIRED = ["mSurface", "mOnSurface", "mPrimary"];
const ROOT_DIRS = new Set(["scripts", "LICENSES", "node_modules"]);
const ALLOWED_EXT = new Set([".json", ".png", ".md"]);

export const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Theme folders: every root directory except dot folders and tooling folders. */
export function themeFolders(root) {
  return readdirSync(root, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith(".") && !ROOT_DIRS.has(d.name))
    .map((d) => d.name)
    .sort();
}

const extOf = (f) => (f.lastIndexOf(".") > 0 ? f.slice(f.lastIndexOf(".")).toLowerCase() : "");

/** Validate one theme folder. Returns { errors, theme } where theme is the parsed JSON or null. */
export function validateFolder(root, folder) {
  const errors = [];
  const err = (m) => errors.push(`${folder}: ${m}`);
  if (/[\\/]/.test(folder) || folder.startsWith(".")) err("invalid folder name");
  const dir = join(root, folder);
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (!e.isFile()) { err(`unexpected entry "${e.name}" (only files allowed)`); continue; }
    if (!ALLOWED_EXT.has(extOf(e.name))) err(`file "${e.name}" has a disallowed type (only .json, .png, .md)`);
    if (statSync(p).mode & 0o111) err(`file "${e.name}" is executable`);
  }
  const file = join(dir, `${folder}.json`);
  let buf;
  try { buf = readFileSync(file); } catch { err(`missing ${folder}/${folder}.json`); return { errors, theme: null }; }
  if (buf.length > MAX_BYTES) err(`file is ${buf.length} bytes, limit is ${MAX_BYTES}`);
  let theme;
  try { theme = JSON.parse(buf.toString("utf8")); } catch (e) { err(`invalid JSON (${e.message})`); return { errors, theme: null }; }
  if (typeof theme !== "object" || theme === null || Array.isArray(theme)) { err("top level must be an object"); return { errors, theme: null }; }
  if (theme.name !== folder) err(`"name" is ${JSON.stringify(theme.name)}, must equal the folder name`);
  const variants = ["dark", "light"].filter((k) => k in theme);
  if (variants.length === 0) err('needs a "dark" or "light" object');
  for (const v of variants) {
    const o = theme[v];
    if (typeof o !== "object" || o === null || Array.isArray(o)) { err(`"${v}" must be an object`); continue; }
    for (const k of REQUIRED) if (typeof o[k] !== "string" || !HEX.test(o[k])) err(`${v}.${k} must be a hex colour`);
    for (const [k, val] of Object.entries(o)) {
      if (k.startsWith("m") && !REQUIRED.includes(k) && (typeof val !== "string" || !HEX.test(val))) err(`${v}.${k} must be a hex colour`);
    }
  }
  return { errors, theme };
}

/** Validate every theme in root. Returns { errors, count }. */
export function validateAll(root) {
  const errors = [];
  const slugs = new Map();
  const folders = themeFolders(root);
  for (const f of folders) {
    errors.push(...validateFolder(root, f).errors);
    const s = slugify(f);
    if (slugs.has(s)) errors.push(`${f}: slug "${s}" clashes with "${slugs.get(s)}"`);
    else slugs.set(s, f);
  }
  return { errors, count: folders.length };
}

const sourceOf = (author = "") =>
  /cendre/i.test(author) ? "cendre" : /community/i.test(author) ? "noctalia-community" : "noctalia";
const CREDIT = {
  noctalia: "Noctalia (noctalia-dev)",
  "noctalia-community": "Noctalia community palettes",
  cendre: "aejkatappaja (Cendre)",
};
const LICENCE = {
  noctalia: "MIT",
  cendre: "MIT",
  "noctalia-community": "none upstream, included with credit",
};

/** Build the index array (sorted by name, stable key order). */
export function buildIndex(root) {
  const out = [];
  for (const folder of themeFolders(root)) {
    const path = `${folder}/${folder}.json`;
    const buf = readFileSync(join(root, path));
    const t = JSON.parse(buf.toString("utf8"));
    const modes = ["dark", "light"].filter((k) => t[k] && typeof t[k] === "object");
    const v = t[modes[0]];
    const source = sourceOf(t.author);
    out.push({
      name: t.name,
      slug: slugify(t.name),
      path,
      source,
      credit: CREDIT[source],
      licence: LICENCE[source],
      modes,
      swatch: [v.mSurface, v.mOnSurface, v.mPrimary].map((c) => c.toLowerCase()),
      sha256: sha256(buf),
    });
  }
  out.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return out;
}

export const serialize = (index) => JSON.stringify(index, null, 2) + "\n";
