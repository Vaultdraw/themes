## Theme

Name:

## Checklist

- [ ] Folder is `<Name>/<Name>.json` and `name` equals the folder name
- [ ] `meta.json` has author, description, source, credit, licence, tags and previews
- [ ] Licence or origin is stated; third-party palettes are credited (and in `CREDITS.md` if the source is new)
- [ ] Previews (if any) are PNG or WebP, at most 300 KB, and all listed in `meta.json`
- [ ] `node scripts/build-index.mjs` run and `index.json` committed
- [ ] `node scripts/validate.mjs` and `node --test scripts` pass
