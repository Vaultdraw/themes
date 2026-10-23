# Credits

Every palette here comes from one of three sources. Each source has its own terms. There is no top-level licence file because the provenance is mixed.

| Source | Upstream | Commit | Licence | Themes |
| --- | --- | --- | --- | --- |
| Noctalia built-in palettes | https://github.com/noctalia-dev/noctalia | `4b19e217461e92fb8b5a24f8ad411ee56d31adfb` | MIT, see [LICENSES/noctalia-MIT.txt](LICENSES/noctalia-MIT.txt) | 4 |
| Noctalia community palettes | https://github.com/noctalia-dev/community-palettes | `a88b6364057c042ff81c49f085d7957c2575dd0f` | none upstream, included with credit | 106 |
| Cendre | https://github.com/Aejkatappaja/cendre | `5c9d924a4c75c130a1c812ee3e240d78a92d2c3a` | MIT, see [LICENSES/cendre-MIT.txt](LICENSES/cendre-MIT.txt) | 3 |

## Noctalia built-in palettes (4)

Ayu, Eldritch, Noctalia, Rosé Pine.

Source file: `src/theme/builtin_palettes.cpp` at the commit above. Only the colour values were converted to Noctalia palette JSON, by a script that reads that file. They are otherwise unchanged. Used under the MIT licence in [LICENSES/noctalia-MIT.txt](LICENSES/noctalia-MIT.txt).

## Noctalia community palettes (106)

ADW, Alpenglow, Atuel, Aura, Ayu Blue, Ayu Green, Ayu Red, Breeze, Catppuccin Frappe Blue, Catppuccin Frappe Green, Catppuccin Frappe Lavender, Catppuccin Frappe Mauve, Catppuccin Frappe Peach, Catppuccin Frappe Pink, Catppuccin Frappe Rosewater, Catppuccin Frappe Sapphire, Catppuccin Macchiato Blue, Catppuccin Macchiato Green, Catppuccin Macchiato Lavender, Catppuccin Macchiato Mauve, Catppuccin Macchiato Peach, Catppuccin Macchiato Pink, Catppuccin Macchiato Rosewater, Catppuccin Macchiato Sapphire, Catppuccin Mocha Blue, Catppuccin Mocha Green, Catppuccin Mocha Lavender, Catppuccin Mocha Maroon, Catppuccin Mocha Mauve-Lavender, Catppuccin Mocha Peach, Catppuccin Mocha Pink, Catppuccin Mocha Rosewater, Catppuccin Mocha Sapphire, Cherry Blossom, Coral and Sea, Cream, Cream Autumn, Creamy Forest, Cyberpunk, Doomed, Espresso Cream, Everdeer, Everforest Dim, Everforest Material, Flexoki, Garnet, GitHub Dark, Gruber Darker, Gruvbox Material, Gruvbox Material Hard, Gruvbox Material Medium, GruvboxAlt, Heartbox, Hexa34C, Horizon, Inabakumori, Jiva, Jiva Lotus, Jiva Paper, Kanagawa Dragon, Kanagawa Kasumi, Kanagawa Paper, Kemuri, Kemuri Koke, Kemuri Susu, Kitten, Koneko, Lilac AMOLED, Macaron, Matecito, Miasma, Mine, Mizuki-Akiyama, Monochrome, Murasaki, Murata, NaySayer, Neon Surf, Noctalia legacy, Nord Aurora, Oasis Abyss, Occult Umbral, One Dark Two, Osaka jade, Oxide, Oxocarbon, Paradise, Peche, Rose Pine Alt, Rose Pine Moon, Rose Pine Moon Alt, Rosey AMOLED, SeaBed, Seoul256, Seoul256 Hard, Seoul256 Soft, Shien, Shinonome, Solarized Osaka, Spiderman, Sway Classic, Tokyo Night Moon, Tokyo Night Storm, Tomorrow, Vesper, Zenbones.

These palettes come from the Noctalia community palette repository (formerly `noctalia-colorschemes`), commit `a88b6364057c042ff81c49f085d7957c2575dd0f` (branch `main`, committed 2026-10-10, downloaded 2026-10-13).

The upstream repository has no licence file (checked at that commit). The palettes are the work of their community contributors. Individual authorship is in the commit history: https://github.com/noctalia-dev/community-palettes/commits/main. They are included here with credit, under the author name "Noctalia community palettes".

If you are an author and want a palette removed or credited differently, open an issue.

## Cendre (3)

Cendre, Cendre Medium, Cendre Soft.

Not from Noctalia. Mapped by hand from the Ghostty files in `extras/ghostty/` of https://github.com/Aejkatappaja/cendre, one file per depth (hard, medium, soft). Copyright (c) 2026 aejkatappaja, MIT, see [LICENSES/cendre-MIT.txt](LICENSES/cendre-MIT.txt).

Mapping: background to mSurface, foreground to mOnSurface, cursor (ember) to mPrimary, palette 0 to mSurfaceVariant, 7 to mOnSurfaceVariant, 8 to mOutline, 3 to mSecondary, 2 to mTertiary, 1 to mError, and the 16 ANSI colours to terminal.

## How the palettes were converted

Each community palette was imported from `<Name>/<Name>.json` with the Vaultdraw import script (`scripts/import-noctalia-palettes.mjs --from-dir <checkout> --author "Noctalia community palettes"`). The folder name became `"name"` and colours were lower-cased. Keys the theme engine does not use were dropped: `mSurfaceDim`, `mOnSurfaceDim`, `mOutlineVariant`, `mPanel`, `mOnPanel`, and a misplaced `terminal.white`. No colour values were edited by hand.

## Everforest Dim

The original community palette named "Everforest" is shipped here as **Everforest Dim** (`Everforest Dim/Everforest Dim.json`). The only change is the `"name"` field. The rename avoids a clash with the Everforest theme bundled in Vaultdraw, which comes from the community palette "everforest-alt".

## Bundled in Vaultdraw, not in this repo

Dracula, Catppuccin, Gruvbox, Tokyo Night, Nord and Kanagawa (Noctalia built-in palettes); Solarized, Everforest and One Dark (community palettes). They are credited in the app under the same terms as above.
