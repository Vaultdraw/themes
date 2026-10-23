import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAll, buildIndex, slugify, validateMeta } from "./lib.mjs";
import { run as runIndex } from "./build-index.mjs";

const good = (name, extra = {}) => ({
  name,
  author: "Noctalia community palettes",
  dark: { mSurface: "#111111", mOnSurface: "#eeeeee", mPrimary: "#ff0000" },
  ...extra,
});

const meta = (extra = {}) => ({
  author: "Someone",
  description: "Dark variant only",
  source: "contributed",
  credit: "Someone",
  licence: "MIT",
  tags: ["dark"],
  previews: [],
  ...extra,
});

function repo(themes) {
  const root = mkdtempSync(join(tmpdir(), "themes-"));
  for (const [folder, body] of Object.entries(themes)) {
    mkdirSync(join(root, folder));
    writeFileSync(join(root, folder, `${folder}.json`), typeof body === "string" ? body : JSON.stringify(body));
    writeFileSync(join(root, folder, "meta.json"), JSON.stringify(meta()));
  }
  return root;
}
const errorsOf = (themes) => {
  const root = repo(themes);
  try { return validateAll(root).errors; } finally { rmSync(root, { recursive: true }); }
};

test("a valid theme passes", () => {
  assert.deepEqual(errorsOf({ "Good One": good("Good One") }), []);
});

test("name must equal the folder name", () => {
  assert.match(errorsOf({ Foo: good("Bar") }).join("\n"), /must equal the folder name/);
});

test("invalid JSON and missing colours fail", () => {
  assert.match(errorsOf({ Bad: "{nope" }).join("\n"), /invalid JSON/);
  const t = good("NoPrimary");
  delete t.dark.mPrimary;
  assert.match(errorsOf({ NoPrimary: t }).join("\n"), /dark\.mPrimary/);
  assert.match(errorsOf({ NoMode: { name: "NoMode" } }).join("\n"), /needs a "dark" or "light"/);
});

test("bad optional colour, oversize file and slug clash fail", () => {
  const t = good("Odd", { dark: { mSurface: "#111", mOnSurface: "#eee", mPrimary: "#f00", mError: "red" } });
  assert.match(errorsOf({ Odd: t }).join("\n"), /dark\.mError/);
  const big = good("Big", { pad: "x".repeat(70000) });
  assert.match(errorsOf({ Big: big }).join("\n"), /limit is 65536/);
  assert.match(errorsOf({ "A B": good("A B"), "A-B": good("A-B") }).join("\n"), /slug "a-b" clashes/);
});

test("executable and disallowed files fail", () => {
  const root = repo({ T: good("T") });
  try {
    writeFileSync(join(root, "T", "run.sh"), "x");
    chmodSync(join(root, "T", "run.sh"), 0o755);
    const e = validateAll(root).errors.join("\n");
    assert.match(e, /disallowed type/);
    assert.match(e, /executable/);
  } finally { rmSync(root, { recursive: true }); }
});

test("index entry shape and --check", () => {
  const root = repo({ "Zed": good("Zed", { light: { mSurface: "#fff", mOnSurface: "#000", mPrimary: "#00f" } }), "Alpha": good("Alpha") });
  try {
    let idx = buildIndex(root);
    assert.equal(idx.schemaVersion, 1);
    idx = idx.themes;
    assert.deepEqual(idx.map((e) => e.name), ["Alpha", "Zed"]);
    assert.deepEqual(idx[1].modes, ["dark", "light"]);
    assert.deepEqual(idx[1].swatch, { dark: ["#111111", "#eeeeee", "#ff0000"], light: ["#ffffff", "#000000", "#0000ff"] });
    assert.deepEqual(idx[0].swatch, { dark: ["#111111", "#eeeeee", "#ff0000"] });
    assert.equal(idx[0].meta, "Alpha/meta.json");
    assert.deepEqual(idx[0].previews, []);
    assert.equal(idx[0].source, "contributed");
    assert.match(idx[0].sha256, /^[0-9a-f]{64}$/);
    assert.equal(runIndex(root, true), 1); // missing index
    assert.equal(runIndex(root, false), 0);
    assert.equal(runIndex(root, true), 0);
    writeFileSync(join(root, "Alpha", "Alpha.json"), JSON.stringify(good("Alpha", { x: 1 })));
    assert.equal(runIndex(root, true), 1); // stale hash
  } finally { rmSync(root, { recursive: true }); }
});

test("slugify", () => {
  assert.equal(slugify("Tokyo Night Moon"), "tokyo-night-moon");
});

test("meta.json: required fields, bad source and tags fail", () => {
  const root = repo({ T: good("T") });
  try {
    const w = (m) => writeFileSync(join(root, "T", "meta.json"), JSON.stringify(m));
    assert.deepEqual(validateMeta(root, "T"), []);
    w(meta({ author: "", source: "elsewhere", tags: ["Bad Tag"] }));
    const e = validateMeta(root, "T").join("\n");
    assert.match(e, /"author"/);
    assert.match(e, /"source" must be one of/);
    assert.match(e, /"tags"/);
    writeFileSync(join(root, "T", "meta.json"), "{");
    assert.match(validateMeta(root, "T").join("\n"), /invalid meta.json/);
    rmSync(join(root, "T", "meta.json"));
    assert.match(validateMeta(root, "T").join("\n"), /missing or invalid meta.json/);
  } finally { rmSync(root, { recursive: true }); }
});

test("previews: listed must exist, unlisted fail, size and type limits", () => {
  const root = repo({ T: good("T") });
  try {
    const w = (m) => writeFileSync(join(root, "T", "meta.json"), JSON.stringify(m));
    w(meta({ previews: ["preview.png"] }));
    assert.match(validateMeta(root, "T").join("\n"), /listed but does not exist/);
    writeFileSync(join(root, "T", "preview.png"), Buffer.alloc(100));
    assert.deepEqual(validateMeta(root, "T"), []);
    assert.deepEqual(buildIndex(root).themes[0].previews, ["T/preview.png"]);
    writeFileSync(join(root, "T", "extra.webp"), Buffer.alloc(10));
    assert.match(validateMeta(root, "T").join("\n"), /extra\.webp" is not listed/);
    rmSync(join(root, "T", "extra.webp"));
    writeFileSync(join(root, "T", "preview.png"), Buffer.alloc(300 * 1024 + 1));
    assert.match(validateMeta(root, "T").join("\n"), /limit is 307200/);
    w(meta({ previews: ["../x.png", "shot.jpg"] }));
    assert.match(validateMeta(root, "T").join("\n"), /plain \.png or \.webp/);
  } finally { rmSync(root, { recursive: true }); }
});
