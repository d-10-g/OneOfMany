#!/usr/bin/env python3
"""
Builds data/carbon-catalog.js from all 120 Carbon Edition pathways across the 6 pillars,
enriching each pathway with its full REPORT.md, STORYBOARD.md, structured infographic
and human-story metadata, and verified external/internal reference links.
"""
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CARBON_DIR = ROOT / "carbon"

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
        "description": "Turning clean power from a scarce, hunted fuel into a sub-penny technology—via 20-compact fusion, 35.5% tandem solar & agrivoltaics, millimeter-wave deep geothermal, symbiotic civic district-heating data centers, 1-atm solid-state batteries, cuprate superconductors, and desalination rivers.",
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
        "description": "Extropic thermodynamic chips (Z1), Chain Theory & Thorium-229 nuclear clocks, altermagnetic spintronics, Geometric Langlands & 3D Kakeya proofs, citizen-AI LiDAR & Herculaneum scroll unwrapping, self-driving wet labs, and tactile robotics.",
    },
    {
        "id": "bioscience-regeneration",
        "num": "03",
        "dir": "03-bioscience-regeneration",
        "meta_files": ["pillar_meta.json", "pillar_meta_nov2026.json"],
        "title": "Bioscience, Medicine & Planetary Regeneration",
        "shortTitle": "Bio & Ecology",
        "emoji": "🧬",
        "color": "#059669",
        "darkColor": "#34d399",
        "description": "AlphaGenome 2 single-cell non-coding genomics, one-dose in vivo CRISPR & CAR-T autoimmune resets, personalized mRNA cancer vaccines, citizen groundwater eDNA, Nobel MOF water/carbon harvesters, living bioconcrete, and billion-hectare rewilding.",
    },
    {
        "id": "social-norms",
        "num": "04",
        "dir": "04-social-norms",
        "meta_files": ["pillar_meta_a.json", "pillar_meta_b.json", "pillar_meta_nov2026.json"],
        "title": "Reimagining Society, Economics & Flourishing",
        "shortTitle": "Society & Norms",
        "emoji": "🤝",
        "color": "#e11d48",
        "darkColor": "#fb7185",
        "description": "Empirical AI macro-telemetry & GDPval (Chatterji/NBER), privacy-safe Data Clean Rooms, sortition citizens' assemblies, municipal utility & land trusts, Vienna/Singapore/Tokyo abundant housing, Finland Housing First, Taiwan Polis consensus, and Estonia 48-hour governance.",
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
        "description": "Going to space to heal and understand the cosmos: Vera C. Rubin citizen sky patrols, DESI + Euclid dynamical dark energy, Nobel IceCube neutrino astronomy, Starship heavy lift, 3-minute orbital wildfire shields, zero-water radiative compute, and Europa/Enceladus ocean probes.",
    },
    {
        "id": "synergy-horizons",
        "num": "06",
        "dir": "06-synergy-horizons",
        "meta_files": ["pillar_meta.json", "pillar_meta_nov2026.json"],
        "title": "The Synergy Engine & Human Agency",
        "shortTitle": "Synergies",
        "emoji": "🌈",
        "color": "#0d9488",
        "darkColor": "#2dd4bf",
        "description": "Where every exponential curve converges: the citizen-AI discovery renaissance, symbiotic civic infrastructure pacts, open empirical abundance economics, thermodynamic-photonic intelligence, the 70% household cost collapse, and the antidote to doomerism.",
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
        "edition": "Carbon Edition (v2.0)",
        "generatedAt": str(date.today()),
        "totalPathways": len(items),
        "totalDocuments": len(items) * 2,
        "newSotaPathways": sum(1 for i in items if i["isNewInCarbon"]),
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
        f"({len(items)*2} Carbon documents, {payload['newSotaPathways']} brand-new SOTA pathways)."
    )


if __name__ == "__main__":
    build()
