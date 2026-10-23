#!/usr/bin/env node
// Validates every theme folder. Exits 1 on any error.
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { validateAll } from "./lib.mjs";

export function run(root) {
  const { errors, count } = validateAll(root);
  for (const e of errors) console.error(`error: ${e}`);
  console.log(`${count} themes checked, ${errors.length} errors`);
  return errors.length ? 1 : 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  process.exit(run(join(dirname(fileURLToPath(import.meta.url)), "..")));
}
