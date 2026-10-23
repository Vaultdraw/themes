#!/usr/bin/env node
// Regenerates index.json. With --check, exits 1 if index.json is out of sync.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildIndex, serialize } from "./lib.mjs";

export function run(root, check) {
  const want = serialize(buildIndex(root));
  const file = join(root, "index.json");
  if (check) {
    let have = null;
    try { have = readFileSync(file, "utf8"); } catch {}
    if (have !== want) {
      console.error("index.json is out of sync with the theme files. Run: node scripts/build-index.mjs");
      return 1;
    }
    console.log("index.json is up to date");
    return 0;
  }
  writeFileSync(file, want);
  console.log(`wrote index.json`);
  return 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  process.exit(run(root, process.argv.includes("--check")));
}
