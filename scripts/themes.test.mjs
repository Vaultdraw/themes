import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, chmodSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { validateAll, buildIndex, slugify } from "./lib.mjs";
import { run as runIndex } from "./build-index.mjs";

const good = (name, extra = {}) => ({
  name,
  author: "Noctalia community palettes",
  dark: { mSurface: "#111111", mOnSurface: "#eeeeee", mPrimary: "#ff0000" },
  ...extra,
});

function repo(themes) {
  const root = mkdtempSync(join(tmpdir(), "themes-"));
  for (const [folder, body] of Object.entries(themes)) {
    mkdirSync(join(root, folder));
    writeFileSync(join(root, folder, `${folder}.json`), typeof body === "string" ? body : JSON.stringify(body));
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
    const idx = buildIndex(root);
    assert.deepEqual(idx.map((e) => e.name), ["Alpha", "Zed"]);
    assert.deepEqual(idx[1].modes, ["dark", "light"]);
    assert.deepEqual(idx[1].swatch, ["#111111", "#eeeeee", "#ff0000"]);
    assert.equal(idx[0].source, "noctalia-community");
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
