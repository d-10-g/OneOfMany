# OneOfMany — Carbon Edition & V1 Archive

**Live Interactive Website:**
- **🌱 Carbon Edition (Flagship):** [`/`](index.html) & [`/carbon/`](carbon/index.html)
- **🕰️ Version 1 Archive (Oct 2026 Original):** [`/v1/`](v1/index.html)

---

## 🌱 Carbon Edition (November 2026 SOTA)

An inviting, joyful, data-grounded interactive atlas of **136 Master Pathways (272 Markdown artifacts: 136 Deep Reports + 136 Visual Storyboards)** examining how abundant clean energy and physical + cognitive automation dissolve the human scarcity mindset and unfreeze *“things have always been this way”* social conventions—directly countering modern cynicism with real companies, clinical/lab proofs, unmeasured consumer-surplus telemetry, human stories, and working Tuesday-morning international precedents.

### Six Converging Pillars
1. **⚡ Pillar 01 — Abundant Clean Energy (`carbon/01-abundant-energy`, 21 Pathways):** 20T-compact fusion, 35.5% perovskite-silicon tandems, \$0-upfront subscriber community solar gardens & SolarAPP+ 0-second permitting, agrivoltaics, millimeter-wave superhot geothermal, symbiotic district-heating civic data centers, 1-atm solid-state batteries, cuprate pseudogap superconductors, 1,800 °C thermal bricks, osmotic estuary baseload, bidirectional V2G virtual plants, electrochemical lithium brines, radiative sky-cooling skins, orbital solar, Gen IV fission, 100-hour iron-air storage, geologic hydrogen, synthetic sky fuels, and sub-penny desalination rivers.
2. **🤖 Pillar 02 — Embodied AI, Robotics & Self-Driving Science (`carbon/02-automation-science`, 26 Pathways):** Extropic Z1 thermodynamic computing, Chain Theory & discrete quantum entanglement constants, altermagnetic THz spintronics, Thorium-229 solid-state nuclear clocks, homochiral asymmetric catalysis, co-packaged silicon photonics, neuromorphic event vision, citizen-AI LiDAR archaeology (Miotti Maya swarm), Vesuvius Challenge Herculaneum scroll unwrapping, Geometric Langlands & 3D Kakeya / Hilbert's 6th proofs, Lean 4 formal math, self-driving wet labs, world-model tactile robotics, AI Earth weather forecasting, memory-safe seL4/Rust infrastructure, logical qubits, *de novo* proteins, and car-light autonomous boulevards.
3. **🧬 Pillar 03 — Bioscience, Medicine & Planetary Regeneration (`carbon/03-bioscience-regeneration`, 24 Pathways):** Dutch *Buurtzorg* 15,000-nurse zero-boss neighborhood care, Trieste & Geel open-door zero-restraint community mental health, Dutch *De Hogeweyk* dementia villages & Green House elder cottages, Medellín Green Corridors & Paris *Cours Oasis* sponge parks, GLP-1 & focused-ultrasound addiction resets, Singapore billing-free direct care, AlphaGenome 2 single-cell non-coding genomics, single-dose *in vivo* CRISPR cures, CAR-T & Treg autoimmune resets, optogenetic sight restoration, personalized mRNA cancer vaccines, 69-edit xenotransplant kidneys, citizen groundwater eDNA atlases, Nobel MOF atmospheric water & carbon harvesters, AI-designed bacteriophages, self-healing living bioconcrete, nitrogen-fixing perennials, non-opioid NaV1.8 pain relief, cell-free biomanufacturing, epigenetic rejuvenation, solar fermentation rewilding, and PFAS destruction.
4. **🤝 Pillar 04 — Reimagining Society, Economics & Flourishing (`carbon/04-social-norms`, 39 Pathways):** Finland *Neuvola* universal baby boxes & newborn genome screening, UK Employee Ownership Trusts & Mondragon 4-day automated worker shops, Brazil PNAE / Japan *Shokuiku* / Copenhagen 90% organic school kitchens, Hoboken 9-year zero-traffic-death daylighting & Oslo Vision Zero streets, Helsinki Oodi & neighborhood Libraries of Things / Repair Cafés, 60-second pre-filled taxes / bipartisan Clean Slate automated record sealing / BC Civil Resolution Tribunal, Iceland *Planet Youth* leisure-card belonging, municipal & state 1¢-on-the-dollar medical debt abolition, Austin/Minneapolis/Montana bipartisan zoning & parking liberation, Alaska/Norway/Connecticut citizen wealth dividends, Estonia 99% digital Once-Only governance, Vienna/Singapore/Tokyo abundant housing, Finland Housing First, Taiwan Polis consensus, OpenAI/NBER empirical AI telemetry & GDPval (Chatterji et al.), Data Clean Rooms & GDP-B welfare accounting, sortition citizens' assemblies, participatory budgeting, cooperative fiber/energy trusts, Community Land Trusts, Right-to-Repair circularity, Nordic restorative justice, Diamond Open Access, social prescribing, Pix/FedNow public rails, and phone-free play childhoods.
5. **🚀 Pillar 05 — Space & Orbital Stewardship (`carbon/05-space-frontier`, 18 Pathways):** Vera C. Rubin citizen sky patrols, DESI + Euclid dynamical dark energy, Nobel IceCube neutrino astronomy, reusable Starship Mechazilla heavy lift, Europa Clipper & Enceladus astrobiology probes, air-breathing VLEO satellites, lunar farside radio cosmology, GNSS atmospheric radio occultation, zero-water 3-Kelvin orbital radiative compute, microgravity pharmaceuticals, Shackleton lunar commons, asteroid metals, sunlit maple-wood spinning habitats, and 3-minute orbital wildfire shields.
6. **🌈 Pillar 06 — The Synergy Engine & Human Agency (`carbon/06-synergy-horizons`, 8 Synthesis Pathways):** Healing the zero-sum scarcity mindset via free energy & automation, the invisible \$35,000 consumer-surplus raise (GDP-B & household AI welfare), the 70% household cost-of-living collapse, citizen-science + AI discovery renaissance, planetary symbiotic civic infrastructure pacts, open empirical abundance economics, thermodynamic-photonic intelligence convergence, and the empirical antidote to doomerism.

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
