#!/usr/bin/env python3
"""
Builds data/carbon-catalog.js from all Carbon Edition pathways across the 6 pillars,
enriching each pathway with its full REPORT.md, STORYBOARD.md, structured infographic
and human-story metadata, curation lenses (humane conventions vs. abundance engine vs. deep lab),
and verified external/internal reference links.
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARBON_DIR = ROOT / "carbon"

DEEP_LAB_SLUGS = {
    "cuprate-pseudogap-superconductors",
    "chain-theory-quantum-constants",
    "altermagnetism-spintronics",
    "thorium-229-nuclear-clocks",
    "homochiral-asymmetric-catalysis",
    "geometric-langlands-unification",
    "kakeya-hilbert-sixth-proofs",
    "ai-formal-mathematics",
    "quantum-logical-simulation",
    "desi-dynamical-dark-energy",
    "icecube-neutrino-multimessenger",
    "ocean-worlds-astrobiology-probes",
    "lunar-farside-radio-cosmology",
}

CROSS_PILLAR_CONVENTION_SLUGS = {
    "symbiotic-civic-data-centers",
    "agrivoltaics-shaded-harvests",
    "bidirectional-v2g-virtual-plants",
    "autonomous-ground-mobility",
    "local-microfactories",
    "lidar-agent-citizen-archaeology",
    "vesuvius-scroll-ai-papyrology",
    "craving-reset-mental-health",
    "healthcare-without-billing",
    "buurtzorg-autonomous-neighborhood-care",
    "non-opioid-nav18-pain-relief",
    "citizen-edna-groundwater-atlas",
    "rubin-citizen-sky-patrol",
    "cost-of-living-collapse",
    "cynicism-to-agency",
    "hidden-consumer-surplus-abundance",
    "scarcity-mindset-to-abundance-trust",
    "citizen-science-ai-renaissance",
    "planetary-civic-infrastructure-pact",
    "open-empirical-abundance-compass",
}

PILLARS = [
    {
        "id": "abundant-energy",
        "num": "01",
        "dir": "01-abundant-energy",
        "meta_files": ["pillar_meta.json", "pillar_meta_nov2026.json"],
        "title": "Abundant Clean Energy",
        "shortTitle": "Energy",
        "emoji": "⚡",
        "color": "#d97706",
        "darkColor": "#fbbf24",
        "description": "Moving toward essentially free clean power to dissolve zero-sum scarcity—via 20T-compact fusion, 35.5% tandem solar & agrivoltaics, everywhere geothermal, symbiotic district-heating data centers, 1-atm solid-state storage, and desalination rivers.",
    },
    {
        "id": "automation-science",
        "num": "02",
        "dir": "02-automation-science",
        "meta_files": ["pillar_meta.json", "pillar_meta_nov2026_a.json", "pillar_meta_nov2026_b.json"],
        "title": "Embodied AI, Robotics & Self-Driving Science",
        "shortTitle": "Robotics & Science",
        "emoji": "🤖",
        "color": "#0284c7",
        "darkColor": "#38bdf8",
        "description": "Physical and cognitive automation freeing human bandwidth: helpful humanoids & tactile robotics, self-driving wet labs, Extropic thermodynamic chips, citizen-AI LiDAR & scroll discovery, car-light green boulevards, and neighborhood Fab-Commons.",
    },
    {
        "id": "bioscience-regeneration",
        "num": "03",
        "dir": "03-bioscience-regeneration",
        "meta_files": ["pillar_meta.json", "pillar_meta_humane.json", "pillar_meta_nov2026.json"],
        "title": "Bioscience, Medicine & Planetary Regeneration",
        "shortTitle": "Bio & Ecology",
        "emoji": "🧬",
        "color": "#059669",
        "darkColor": "#34d399",
        "description": "Biological healing paired with humane care: GLP-1 & non-opioid craving/pain resets, Dutch Buurtzorg zero-boss nursing, Singapore billing-free direct care, one-dose in vivo CRISPR cures, AlphaGenome 2, and solar proteins rewilding a billion hectares.",
    },
    {
        "id": "social-norms",
        "num": "04",
        "dir": "04-social-norms",
        "meta_files": [
            "pillar_meta_a.json",
            "pillar_meta_b.json",
            "pillar_meta_humane_a.json",
            "pillar_meta_humane_b.json",
            "pillar_meta_nov2026.json",
        ],
        "title": "Reimagining Society, Economics & Flourishing",
        "shortTitle": "Society & Norms",
        "emoji": "🤝",
        "color": "#e11d48",
        "darkColor": "#fb7185",
        "description": "Unfreezing 'things have always been this way' with proven global receipts: Alaska/Norway/CT citizen funds, Estonia 3-minute governance, Iceland Planet Youth (42%→5%), municipal medical debt abolition, Austin/Montana/Vienna abundant housing, Finland Housing First, and Ronnie Chatterji's NBER AI welfare telemetry.",
    },
    {
        "id": "space-frontier",
        "num": "05",
        "dir": "05-space-frontier",
        "meta_files": ["pillar_meta.json", "pillar_meta_nov2026.json"],
        "title": "Space & Orbital Stewardship",
        "shortTitle": "Space",
        "emoji": "🚀",
        "color": "#7c3aed",
        "darkColor": "#a78bfa",
        "description": "Going to space to protect and uplift Earth: 3-minute orbital wildfire shields, zero-water space radiative AI compute, GPS hurricane/tsunami sounding, citizen sky patrols, Starship reusable heavy lift, and rainforest-sparing off-Earth metals.",
    },
    {
        "id": "synergy-horizons",
        "num": "06",
        "dir": "06-synergy-horizons",
        "meta_files": ["pillar_meta.json", "pillar_meta_humane.json", "pillar_meta_nov2026.json"],
        "title": "The Synergy Engine & Human Agency",
        "shortTitle": "Synergies",
        "emoji": "🌈",
        "color": "#0d9488",
        "darkColor": "#2dd4bf",
        "description": "How near-free energy and automation heal the zero-sum scarcity mindset: the invisible $35,000 consumer-surplus raise already in our shared reality, the 70% household cost collapse, symbiotic civic infrastructure pacts, and the antidote to doomerism.",
    },
]


def extract_headings(md_text: str):
    h1 = ""
    h2 = ""
    for line in md_text.splitlines():
        s = line.strip()
        if s.startswith("# ") and not h1:
            h1 = s[2:].strip()
        elif s.startswith("## ") and not h2:
            h2 = s[3:].strip()
        if h1 and h2:
            break
    return h1, h2.replace("\\$", "$")


def sanitize_mermaid_blocks(md_text: str) -> str:
    """Ensure mermaid fenced blocks have no blank lines inside subgraphs."""
    def _clean(match):
        code = match.group(1)
        cleaned_lines = [ln for ln in code.splitlines() if ln.strip() != ""]
        return "```mermaid\n" + "\n".join(cleaned_lines) + "\n```"

    return re.sub(r"```mermaid\n([\s\S]*?)```", _clean, md_text)


def build():
    items = []

    for pillar in PILLARS:
        pdir = CARBON_DIR / pillar["dir"]
        if not pdir.exists():
            print(f"Warning: {pdir} does not exist yet.")
            continue

        meta_entries = []
        for mf in pillar["meta_files"]:
            mpath = pdir / mf
            if mpath.exists():
                loaded = json.loads(mpath.read_text(encoding="utf-8"))
                meta_entries.extend(loaded)
            else:
                print(f"Warning: missing metadata file {mpath}")

        for entry in meta_entries:
            slug = entry["slug"]
            subdir = pdir / slug
            report_path = subdir / "REPORT.md"
            story_path = subdir / "STORYBOARD.md"
            if not (report_path.exists() and story_path.exists()):
                raise FileNotFoundError(f"Missing REPORT.md or STORYBOARD.md in {subdir}")

            report_md = sanitize_mermaid_blocks(report_path.read_text(encoding="utf-8"))
            story_md = sanitize_mermaid_blocks(story_path.read_text(encoding="utf-8"))
            h1, h2 = extract_headings(report_md)

            words = len(report_md.split())
            read_mins = max(4, round(words / 230))

            is_deep_lab = bool(entry.get("isDeepLab", slug in DEEP_LAB_SLUGS))
            is_convention_breaker = bool(
                entry.get(
                    "isConventionBreaker",
                    (pillar["id"] == "social-norms" or slug in CROSS_PILLAR_CONVENTION_SLUGS)
                    and not is_deep_lab,
                )
            )

            item_id = f"carbon-{pillar['id']}-{slug}"
            items.append({
                "id": item_id,
                "slug": slug,
                "pillarId": pillar["id"],
                "pillarNum": pillar["num"],
                "pillarTitle": pillar["title"],
                "pillarShort": pillar["shortTitle"],
                "pillarEmoji": pillar["emoji"],
                "folderRel": f"carbon/{pillar['dir']}/{slug}",
                "isNewInCarbon": bool(entry.get("isNewInCarbon", False)),
                "isUrgentSocial": bool(entry.get("isUrgentSocial", False)),
                "isDeepLab": is_deep_lab,
                "isConventionBreaker": is_convention_breaker,
                "title": entry["title"],
                "tagline": entry["tagline"],
                "heading": h1,
                "subheading": h2,
                "cynicBelief": entry["cynicBelief"],
                "breakthroughCounter": entry["breakthroughCounter"],
                "socialNormShift": entry["socialNormShift"],
                "humanStory": entry["humanStory"],
                "quote": entry["quote"],
                "companiesAndLabs": entry.get("companiesAndLabs", []),
                "companyLinks": entry.get("companyLinks", []),
                "globalPrecedents": entry.get("globalPrecedents", []),
                "precedentLinks": entry.get("precedentLinks", []),
                "synergyLinks": entry.get("synergyLinks", []),
                "infographic": entry["infographic"],
                "reportLines": len(report_md.splitlines()),
                "storyboardLines": len(story_md.splitlines()),
                "wordCount": words,
                "readMinutes": read_mins,
                "reportMd": report_md,
                "storyboardMd": story_md,
            })

    out_dir = ROOT / "data"
    out_dir.mkdir(exist_ok=True)
    payload = {
        "edition": "Carbon Edition (v2.1)",
        "generatedAt": str(date.today()),
        "totalPathways": len(items),
        "totalDocuments": len(items) * 2,
        "newSotaPathways": sum(1 for i in items if i["isNewInCarbon"]),
        "conventionPathways": sum(1 for i in items if i["isConventionBreaker"]),
        "deepLabPathways": sum(1 for i in items if i["isDeepLab"]),
        "pillars": PILLARS,
        "items": items,
    }
    out_file = out_dir / "carbon-catalog.js"
    out_file.write_text(
        "window.ONE_OF_MANY_CARBON = " + json.dumps(payload, ensure_ascii=False) + ";\n",
        encoding="utf-8",
    )
    print(
        f"Built data/carbon-catalog.js with {len(items)} Carbon pathways "
        f"({len(items)*2} docs: {payload['conventionPathways']} convention-breakers, "
        f"{len(items) - payload['conventionPathways'] - payload['deepLabPathways']} abundance-engine, "
        f"{payload['deepLabPathways']} deep-lab)."
    )


if __name__ == "__main__":
    build()
