# OneOfMany — Carbon Edition & V1 Archive

**Live Interactive Website:**
- **🌱 Carbon Edition (Flagship):** [`/`](index.html) & [`/carbon/`](carbon/index.html)
- **🕰️ Version 1 Archive (Oct 2026 Original):** [`/v1/`](v1/index.html)

---

## 🌱 Carbon Edition (November 2026 SOTA)

An inviting, joyful, data-grounded interactive atlas of **60 Master Pathways (120 Markdown artifacts: 60 Deep Reports + 60 Visual Storyboards)** examining how real late-2026 scientific, industrial, biological, economic, and social breakthroughs converge to build a dramatically better near future—directly countering modern cynicism and doomerism with real companies, clinical/lab proofs, researcher/founder quotes, human stories, and working international precedents.

### Six Converging Pillars
1. **⚡ Pillar 01 — Abundant Clean Energy (`carbon/01-abundant-energy`, 10 Pathways):** 20-compact fusion, 35.5% perovskite-silicon tandems, commercial enhanced & superhot geothermal, orbital solar beams, melt-proof Gen IV fission, 100-hour iron-air & sodium storage, superconducting grids, geologic hydrogen, synthetic sky fuels, and sub-penny desalination rivers.
2. **🤖 Pillar 02 — Embodied AI, Robotics & Self-Driving Science (`carbon/02-automation-science`, 12 Pathways):** General-purpose humanoids, chemical-free laser-weeding & rescue swarms, 24/7 self-driving wet labs, Lean 4 formal math verification, inverse AI materials, fault-tolerant logical quantum simulators, volumetric holographic printing, *de novo* protein machines, car-light autonomous boulevards, whisper-quiet eVTOLs, hyper-logistics droids, and neighborhood Fab-Commons.
3. **🧬 Pillar 03 — Bioscience, Medicine & Planetary Regeneration (`carbon/03-bioscience-regeneration`, 8 Pathways):** Epigenetic rejuvenation, single-dose *in vivo* CRISPR cures, GLP-1 & focused-ultrasound addiction resets, billing-free direct care, 3D-printed organs & neural bionics, precision solar fermentation returning 1 billion hectares to wild forests, supercritical PFAS destruction, and heat-evolved coral/species cryobanks.
4. **🤝 Pillar 04 — Reimagining Society, Economics & Flourishing (`carbon/04-social-norms`, 18 Pathways):** Post-GDP flourishing metrics, Norway/Baby-Bond universal capital dividends, land/compute commons taxation, zero-cliff safety nets, demonetized essentials, Danish 90% wage-insurance bridges, 24-hour workweeks, Civic Builder Guilds, Vienna/Singapore/Tokyo robotic mass-timber housing, Finland/Austin zero-homelessness villages, 1.5% homestead mortgages & medical debt abolition, 2-Sigma AI + afternoon guild schools, walkable intergenerational villages, Taiwan Polis bridging consensus, Estonia 48-hour digital governance, sacred human worth, asymmetric peace shields, and high-trust everyday norms.
5. **🚀 Pillar 05 — Space & Orbital Stewardship (`carbon/05-space-frontier`, 10 Pathways):** Direct-to-cell & vacuum optical laser backbones, zero-water 3-Kelvin orbital radiative AI compute, microgravity pharmaceuticals & ZBLAN fiber, Shackleton lunar commons, rainforest-sparing asteroid metals, graduating heavy refining off-Earth, 45-minute clean point-to-point hops, sunlit maple-wood spinning habitats, asteroid deflection & debris sweepers, and 3-minute orbital wildfire/methane shields.
6. **🌈 Pillar 06 — The Synergy Engine & Human Agency (`carbon/06-synergy-horizons`, 2 Synthesis Pathways):** Complete 2026-to-2036 household cost-of-living collapse (-70%) and the empirical psychological & historical antidote to doomerism.

---

## 🕰️ Version 1 Archive (`/v1/`)

All original **85 subtopics (170 Markdown documents: Vision 01 2026–2040 & Vision 02 2026–2030 Leapfrog)** and the original V1 web explorer are preserved intact under [`/v1/`](v1/index.html) and can be compared side-by-side from inside any Carbon Edition pathway.

---

## Running & Rebuilding Locally

Serve from the repository root:

```bash
python3 -m http.server 8080
```

- Open Carbon Edition: `http://localhost:8080/` or `http://localhost:8080/carbon/`
- Open Preserved V1 Site: `http://localhost:8080/v1/`

Rebuild the bundled catalogs after editing Markdown files:

```bash
# Rebuild Carbon Edition catalog (data/carbon-catalog.js)
python3 scripts/build_carbon_catalog.py

# Rebuild archived V1 catalog (v1/data/catalog.js)
python3 v1/scripts/build_catalog.py
```
