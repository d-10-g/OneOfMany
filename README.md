# OneOfMany — Carbon Edition & V1 Archive

**Live Interactive Website:**
- **🌱 Carbon Edition (Flagship):** [`/`](index.html) & [`/carbon/`](carbon/index.html)
- **🕰️ Version 1 Archive (Oct 2026 Original):** [`/v1/`](v1/index.html)

---

## 🌱 Carbon Edition (November 2026 SOTA)

An inviting, joyful, data-grounded interactive atlas of **120 Master Pathways (240 Markdown artifacts: 120 Deep Reports + 120 Visual Storyboards)** examining how real November 2026 scientific, industrial, biological, mathematical, citizen-science, economic, and social breakthroughs converge to build a dramatically better near future—directly countering modern cynicism and doomerism with real companies, clinical/lab proofs, researcher/founder quotes, human stories, and working international precedents.

### Six Converging Pillars
1. **⚡ Pillar 01 — Abundant Clean Energy (`carbon/01-abundant-energy`, 20 Pathways):** 20T-compact fusion, 35.5% perovskite-silicon tandems, agrivoltaics, millimeter-wave superhot geothermal, symbiotic district-heating civic data centers, 1-atm solid-state batteries, cuprate pseudogap superconductors, 1,800 °C thermal bricks, osmotic estuary baseload, bidirectional V2G virtual plants, electrochemical lithium brines, radiative sky-cooling skins, orbital solar, Gen IV fission, 100-hour iron-air storage, geologic hydrogen, synthetic sky fuels, and sub-penny desalination rivers.
2. **🤖 Pillar 02 — Embodied AI, Robotics & Self-Driving Science (`carbon/02-automation-science`, 26 Pathways):** Extropic Z1 thermodynamic computing, Chain Theory & discrete quantum entanglement constants, altermagnetic THz spintronics, Thorium-229 solid-state nuclear clocks, homochiral asymmetric catalysis, co-packaged silicon photonics, neuromorphic event vision, citizen-AI LiDAR archaeology (Miotti Maya swarm), Vesuvius Challenge Herculaneum scroll unwrapping, Geometric Langlands & 3D Kakeya / Hilbert's 6th proofs, Lean 4 formal math, self-driving wet labs, world-model tactile robotics, AI Earth weather forecasting, memory-safe seL4/Rust infrastructure, logical qubits, *de novo* proteins, and car-light autonomous boulevards.
3. **🧬 Pillar 03 — Bioscience, Medicine & Planetary Regeneration (`carbon/03-bioscience-regeneration`, 20 Pathways):** AlphaGenome 2 single-cell non-coding genomics, single-dose *in vivo* CRISPR cures, CAR-T & Treg autoimmune resets, optogenetic sight restoration, personalized mRNA cancer vaccines, 69-edit xenotransplant kidneys, citizen groundwater eDNA atlases, Nobel MOF atmospheric water & carbon harvesters, AI-designed bacteriophages, self-healing living bioconcrete, nitrogen-fixing perennials, non-opioid NaV1.8 pain relief, cell-free biomanufacturing, epigenetic rejuvenation, GLP-1 addiction resets, billing-free direct care, solar fermentation rewilding, and PFAS destruction.
4. **🤝 Pillar 04 — Reimagining Society, Economics & Flourishing (`carbon/04-social-norms`, 30 Pathways):** OpenAI/NBER empirical AI telemetry & GDPval (Chatterji et al. + independent Global South & enterprise replications), privacy-safe Data Clean Rooms & GDP-B welfare accounting, sortition citizens' assemblies, participatory municipal budgeting, cooperative fiber & energy trusts, Community Land Trusts, Right-to-Repair modular circularity, Nordic restorative justice, Diamond Open Access science, social prescribing, public instant payment rails (Pix/FedNow), phone-free play childhoods, Norway/Baby-Bond universal capital dividends, Vienna/Singapore/Tokyo mass-timber housing, Finland Housing First, Taiwan Polis consensus, and Estonia 48-hour governance.
5. **🚀 Pillar 05 — Space & Orbital Stewardship (`carbon/05-space-frontier`, 18 Pathways):** Vera C. Rubin citizen sky patrols, DESI + Euclid dynamical dark energy, Nobel IceCube neutrino astronomy, reusable Starship Mechazilla heavy lift, Europa Clipper & Enceladus astrobiology probes, air-breathing VLEO satellites, lunar farside radio cosmology, GNSS atmospheric radio occultation, zero-water 3-Kelvin orbital radiative compute, microgravity pharmaceuticals, Shackleton lunar commons, asteroid metals, sunlit maple-wood spinning habitats, and 3-minute orbital wildfire shields.
6. **🌈 Pillar 06 — The Synergy Engine & Human Agency (`carbon/06-synergy-horizons`, 6 Synthesis Pathways):** Citizen-science + AI discovery renaissance, planetary symbiotic civic infrastructure pacts, open empirical abundance economics, thermodynamic-photonic intelligence convergence, the 70% household cost-of-living collapse, and the empirical antidote to doomerism.

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
