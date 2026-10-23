// Shared helpers for build-index.mjs and validate.mjs. No dependencies.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

export const MAX_BYTES = 64 * 1024;
export const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
export const HEX6 = /^#[0-9a-fA-F]{6}$/;
export const REQUIRED = ["mSurface", "mOnSurface", "mPrimary"];
const ROOT_DIRS = new Set(["scripts", "LICENSES", "node_modules"]);
export const MAX_PREVIEW_BYTES = 300 * 1024;
export const SOURCES = ["noctalia", "noctalia-community", "cendre", "contributed"];
const IMAGE_EXT = new Set([".png", ".webp"]);
const ALLOWED_EXT = new Set([".json", ".png", ".webp", ".md"]);

export const slugify = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** Lower-case #rrggbb ("#abc" is expanded). */
export const hex6 = (c) => {
  const h = c.toLowerCase();
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
};

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
    if (!ALLOWED_EXT.has(extOf(e.name))) err(`file "${e.name}" has a disallowed type (only .json, .png, .webp, .md)`);
    if (statSync(p).mode & 0o111) err(`file "${e.name}" is executable`);
  }
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && extOf(e.name) === ".json" && e.name !== `${folder}.json` && e.name !== "meta.json") err(`unexpected JSON file "${e.name}"`);
  }
  errors.push(...validateMeta(root, folder));
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

/** Read meta.json of a theme folder, or null. */
export function readMeta(root, folder) {
  try { return JSON.parse(readFileSync(join(root, folder, "meta.json"), "utf8")); } catch { return null; }
}

/** Validate <folder>/meta.json and the preview files. Returns an array of error strings. */
export function validateMeta(root, folder) {
  const errors = [];
  const err = (m) => errors.push(`${folder}: meta.json: ${m}`);
  const dir = join(root, folder);
  let m;
  try { m = JSON.parse(readFileSync(join(dir, "meta.json"), "utf8")); } catch (e) {
    errors.push(`${folder}: missing or invalid meta.json${e instanceof SyntaxError ? ` (${e.message})` : ""}`);
    return errors;
  }
  if (typeof m !== "object" || m === null || Array.isArray(m)) { err("top level must be an object"); return errors; }
  for (const k of ["author", "description", "credit", "licence"]) {
    if (typeof m[k] !== "string" || !m[k].trim()) err(`"${k}" must be a non-empty string`);
  }
  if (typeof m.description === "string" && m.description.length > 200) err('"description" is longer than 200 characters');
  if (!SOURCES.includes(m.source)) err(`"source" must be one of ${SOURCES.join(", ")}`);
  if (!Array.isArray(m.tags) || m.tags.some((t) => typeof t !== "string" || !/^[a-z0-9-]+$/.test(t))) err('"tags" must be an array of lower-case strings (a-z, 0-9, -)');
  if (!Array.isArray(m.previews)) err('"previews" must be an array (may be empty)');
  if ("homepage" in m && (typeof m.homepage !== "string" || !/^https?:\/\//.test(m.homepage))) err('"homepage" must be an http(s) URL');
  const listed = new Set();
  for (const f of Array.isArray(m.previews) ? m.previews : []) {
    if (typeof f !== "string" || /[\\/]/.test(f) || !IMAGE_EXT.has(extOf(f))) { err(`preview ${JSON.stringify(f)} must be a plain .png or .webp file name`); continue; }
    listed.add(f);
    let st;
    try { st = statSync(join(dir, f)); } catch { err(`preview "${f}" is listed but does not exist`); continue; }
    if (st.size > MAX_PREVIEW_BYTES) err(`preview "${f}" is ${st.size} bytes, limit is ${MAX_PREVIEW_BYTES}`);
  }
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.isFile() && IMAGE_EXT.has(extOf(e.name)) && !listed.has(e.name)) errors.push(`${folder}: image "${e.name}" is not listed in meta.json previews`);
  }
  return errors;
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

/** Build the index (sorted by name, stable key order). Source of truth: theme JSON and meta.json. */
export function buildIndex(root) {
  const themes = [];
  for (const folder of themeFolders(root)) {
    const path = `${folder}/${folder}.json`;
    const buf = readFileSync(join(root, path));
    const t = JSON.parse(buf.toString("utf8"));
    const m = readMeta(root, folder);
    const modes = ["dark", "light"].filter((k) => t[k] && typeof t[k] === "object");
    const swatch = {};
    for (const k of modes) swatch[k] = [t[k].mSurface, t[k].mOnSurface, t[k].mPrimary].map(hex6);
    const e = {
      name: t.name,
      slug: slugify(t.name),
      path,
      meta: `${folder}/meta.json`,
      author: m.author,
      description: m.description,
      tags: m.tags,
      source: m.source,
      credit: m.credit,
      licence: m.licence,
      modes,
      swatch,
      sha256: sha256(buf),
      previews: m.previews.map((f) => `${folder}/${f}`),
    };
    if (m.homepage) e.homepage = m.homepage;
    themes.push(e);
  }
  themes.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  return { schemaVersion: 1, themes };
}

export const serialize = (index) => JSON.stringify(index, null, 2) + "\n";
