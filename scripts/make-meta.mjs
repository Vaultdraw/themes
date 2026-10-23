#!/usr/bin/env node
// One-off helper: writes meta.json for theme folders that have none, from the theme JSON.
// Existing meta.json files are never overwritten. New contributors can use it as a starting point.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { themeFolders } from "./lib.mjs";

const HOME = {
  noctalia: "https://github.com/noctalia-dev/noctalia",
  "noctalia-community": "https://github.com/noctalia-dev/community-palettes",
  cendre: "https://github.com/Aejkatappaja/cendre",
};
const CREDIT = { noctalia: "Noctalia (noctalia-dev)", "noctalia-community": "Noctalia community palettes", cendre: "aejkatappaja (Cendre)" };
const LICENCE = { noctalia: "MIT", cendre: "MIT", "noctalia-community": "none upstream, included with credit" };
const sourceOf = (a = "") => (/cendre/i.test(a) ? "cendre" : /community/i.test(a) ? "noctalia-community" : "noctalia");

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
for (const f of themeFolders(root)) {
  const p = join(root, f, "meta.json");
  if (existsSync(p)) continue;
  const t = JSON.parse(readFileSync(join(root, f, `${f}.json`), "utf8"));
  const modes = ["dark", "light"].filter((k) => t[k]);
  const source = sourceOf(t.author);
  const meta = {
    author: t.author,
    description: modes.length === 2 ? "Dark and light variants" : `${modes[0][0].toUpperCase()}${modes[0].slice(1)} variant only`,
    source,
    credit: CREDIT[source],
    licence: LICENCE[source],
    tags: [...modes, source],
    previews: [],
    homepage: HOME[source],
  };
  writeFileSync(p, JSON.stringify(meta, null, 2) + "\n");
}
