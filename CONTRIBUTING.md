# Contributing a theme

Add a folder, run three commands, open a pull request. CI checks the rest.

## Folder layout

```
My Theme/
  My Theme.json     required: the palette
  meta.json         required: author, description, licence, tags
  preview.png       optional: screenshot (png or webp)
```

| Rule | Detail |
| --- | --- |
| Folder name | Exactly the theme's `name`. No path separators, no leading dot |
| Files | `<Name>.json`, `meta.json`, listed previews, optional `.md`. Nothing executable, no other JSON |
| Slug | Lower-case name, non-alphanumerics to `-`. Must be unique |

## Theme JSON

See the README for the format. Required: `name` (equals the folder name) and a `dark` or `light` object with hex `mSurface`, `mOnSurface`, `mPrimary`. Every other `m*` value must be hex. File at most 64 KB.

## meta.json

```json
{
  "author": "You",
  "description": "Dark and light variants",
  "source": "contributed",
  "credit": "You",
  "licence": "MIT",
  "tags": ["dark", "light"],
  "previews": ["preview.png"],
  "homepage": "https://example.com/my-theme"
}
```

| Field | Rule |
| --- | --- |
| `author` | Required, non-empty |
| `description` | Required, at most 200 characters, factual |
| `source` | Required: `noctalia`, `noctalia-community`, `cendre` or `contributed` |
| `credit` | Required: who to credit |
| `licence` | Required: the licence, or the origin if there is none (for example `none upstream, included with credit`) |
| `tags` | Required array of lower-case words (`a-z`, `0-9`, `-`), may be empty |
| `previews` | Required array of file names in the same folder, may be empty |
| `homepage` | Optional `http(s)` URL |

## Previews

Optional. The in-app browser shows them when present.

- PNG or WebP only, at most 300 KB each.
- Every image in the folder must be listed in `previews`, and every listed file must exist.
- Show the theme in Vaultdraw. Do not include other people's work.

## Licence and credit

- State the licence or origin of your palette in `meta.json`.
- Palettes you did not write need credit to the author and a licence that allows redistribution.
- Do not add unlicensed third-party palettes without credit. If a palette has no licence upstream, say so in `licence` and link the source in `homepage`.
- Add the source to `CREDITS.md` if it is new.

## Steps

1. Copy a folder and rename it, including the inner JSON file.
2. Set `name`, colours and `meta.json`.
3. Run `node scripts/build-index.mjs` to refresh `index.json`.
4. Run `node scripts/validate.mjs` and `node --test scripts`.
5. Open a pull request. The template has a checklist.

## index.json schema

Generated, never edited by hand. One fetch gives the browser everything. No timestamps, so output is deterministic.

```json
{
  "schemaVersion": 1,
  "themes": [
    {
      "name": "Vesper",
      "slug": "vesper",
      "path": "Vesper/Vesper.json",
      "meta": "Vesper/meta.json",
      "author": "...",
      "description": "...",
      "tags": ["dark"],
      "source": "noctalia-community",
      "credit": "...",
      "licence": "...",
      "modes": ["dark"],
      "swatch": { "dark": ["#rrggbb", "#rrggbb", "#rrggbb"] },
      "sha256": "...",
      "previews": ["Vesper/preview.png"],
      "homepage": "https://..."
    }
  ]
}
```

`swatch.dark` and `swatch.light` hold `[mSurface, mOnSurface, mPrimary]`, present only for modes the theme has. `sha256` is of the exact theme JSON bytes. `previews` are paths relative to the repo root. `homepage` is omitted when not set. Themes are sorted by name. Add a field with a new `schemaVersion`.
