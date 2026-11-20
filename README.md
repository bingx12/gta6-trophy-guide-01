# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/bingx12/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/bingx12/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Guide — an offline guide and tracker for all 55 GTA VI trophies on PlayStation 5. Every trophy is shown with its official name, description and grade, plus a guide written in our own words that names its sources (PowerPyx, GTABase, Push Square, KeenGamer and EGamers), a four-stage roadmap to the Platinum built from the official descriptions, and a missable flag on the one trophy the guides say may be missed (Positive Mental Attitude — meditate on the balcony in Chapter 1). The checklist saves in localStorage, exports to a file, imports back, and can be shared as a link; filters cover story, missable, collectibles, activities and online (there are no online trophies — all 55 are offline); a spoiler setting hides story trophy names and descriptions until they are earned. The app is plain static files under `app/` and loads nothing from the network.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 — or open `app/index.html` from any static server with `app/` at its root. To hand the entry in, run:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That validates the 55 trophies (every one with a guide and a source), copies `app/` and `screenshots/` to `out/`, and writes `out/dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=k6eq9xtw&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
