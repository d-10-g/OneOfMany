#!/usr/bin/env python3
"""
Builds data/catalog.js from all clean Vision 01 (2026-2040) and
Vision Shorter 02 (2026-2030 Leapfrog) markdown folders, explicitly
excluding all video exploration directories (01-fusion-pathway, v2, v3).
"""
import json
import os
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

EXCLUDED_DIRS = {
    "01-fusion-pathway",
    "01-fusion-pathway-v2",
    "01-fusion-pathway-v3",
}

TRACKS = [
    {
        "id": "abundant-energy",
        "title": "Abundant Energy",
        "icon": "bolt",
        "color": "#f59e0b",
        "description": "Orders-of-magnitude cheap-to-free baseload energy, storage, lossless grids, and unconventional harvesters.",
        "v1_dir": "vision-01-abundant-energy",
        "v2_dir": "vision-shorter-02-abundant-energy",
    },
    {
        "id": "automation",
        "title": "Automation & Science",
        "icon": "cpu",
        "color": "#06b6d4",
        "description": "Converging AI math, self-driving labs, atomic/micro fabrication, inverse materials, humanoids, and 3D mobility.",
        "v1_dir": "vision-01-automation",
        "v2_dir": "vision-shorter-02-automation",
    },
    {
        "id": "social",
        "title": "Social & Economic Transition",
        "icon": "users",
        "color": "#10b981",
        "description": "Upgrading human constructs, fiscal rails, safety nets, debt, housing, healthcare, purpose, and immediate crisis triage.",
        "v1_dir": "vision-01-social",
        "v2_dir": "vision-shorter-02-social",
    },
    {
        "id": "space",
        "title": "Space & Orbital Industry",
        "icon": "globe",
        "color": "#8b5cf6",
        "description": "Orbital laser comms, radiative AI data centers, point-to-point transport, asteroid mining, zero-G fabs, and lunar bases.",
        "v1_dir": "vision-01-space",
        "v2_dir": "vision-shorter-02-space",
    },
]

URGENT_TRIAGE_SLUGS = {
    "existing-unemployed-bridge",
    "male-purpose-and-anomie",
    "homelessness",
    "drug-abuse-and-mental-health",
    "household-debt-and-jubilee",
    "healthcare-and-insurance-leapfrog",
    "legal-regulatory-and-gov-reboot",
    "loneliness-family-and-community",
    "information-trust-and-polarization",
}

SLUG_ALIASES = {
    "fusion-pathway": "fusion",
}

HUMAN_TITLES = {
    "fusion": "Commercial Fusion Power",
    "terrestrial-solar": "Terrestrial Solar &Tandems",
    "space-solar": "Space-Based Solar Power",
    "geothermal": "Superhot Rock Geothermal",
    "fission": "Gen IV Advanced Fission",
    "battery": "Multi-Scale Energy Storage",
    "grid-improvement": "Superconducting & Autonomous Grids",
    "other": "Frontier & Geologic Harvesters",
    "humanoid": "General-Purpose Humanoids",
    "other-form-factor": "Specialized & Swarm Robotics",
    "automated-physical-sciences": "Self-Driving Physical Labs",
    "automated-research": "AI Math & Formal Discovery",
    "micro-assembly": "Holographic & Bio Micro-Assembly",
    "atomic-level-building": "Atomic & Protein Nanofabrication",
    "materials-science": "Inverse AI Materials Science",
    "self-driving": "Autonomous Ground Mobility",
    "drone-human-transportation": "eVTOL & 3D Passenger Transit",
    "drone-delivery": "Autonomous Aerial Logistics",
    "tax": "Rethinking Taxation (Compute & Commons)",
    "capital-ownership": "Universal Capital Ownership",
    "social-programs": "Dignified Zero-Cliff Safety Nets",
    "education": "2-Sigma AI Mastery & Human Guilds",
    "wealth-redistribution": "Deflationary Abundance & Fab-Commons",
    "economics": "Post-Scarcity Economics & Telemetry",
    "unemployment": "Structural Post-Labor Transition",
    "housing": "Abundant Modular & Off-Grid Housing",
    "wars": "Asymmetric Defense & Peace Dividend",
    "religion": "Spiritual Meaning & Sacred Worth",
    "longevity": "Epigenetic Rejuvenation & Healthspan",
    "existing-unemployed-bridge": "Immediate Displaced Worker Rescue Bridge",
    "male-purpose-and-anomie": "Curing Sociological Anomie & Provider Crisis",
    "homelessness": "30-Day Dignity Villages & Tri-Track Triage",
    "drug-abuse-and-mental-health": "Biological Craving Reset & Neuro-Sanctuaries",
    "household-debt-and-jubilee": "Sovereign 1% Mortgage Reset & Debt Jubilee",
    "healthcare-and-insurance-leapfrog": "Skipping the $1.2T Insurance Bureaucracy",
    "legal-regulatory-and-gov-reboot": "48-Hour Digital-Twin Permitting & Mediation",
    "loneliness-family-and-community": "Office-Park-to-Intergenerational Villages",
    "information-trust-and-polarization": "AI Epistemic Shields & Bridged Consensus",
    "communications": "Direct-to-Cell & Vacuum Laser Mesh",
    "data-centers": "Orbital Radiative AI Data Centers",
    "terrestrial-transportation": "Suborbital 40-Minute Earth Point-to-Point",
    "mining": "Asteroid & Cislunar Resource Extraction",
    "off-earth-dirty-industry": "Moving Heavy Polluting Industry Off-Earth",
    "moon": "Autonomous Lunar Shackleton Industrial Base",
    "zero-g-science-manufacturing": "Zero-G Pharmaceuticals & Organ Bioprinting",
    "spinning-habitats": "Tethered & Spinning Artificial-Gravity Worlds",
    "other-space": "Planetary Defense, Debris & Fusion Propulsion",
}


def extract_headings_and_summary(md_text: str):
    lines = md_text.splitlines()
    h1 = ""
    h2 = ""
    summary = ""
    for line in lines:
        s = line.strip()
        if s.startswith("# ") and not h1:
            h1 = s[2:].strip()
        elif s.startswith("## ") and not h2:
            h2 = s[3:].strip()
        elif s.startswith("> ") and not summary:
            clean = re.sub(r"\*\*.*?\*\*:?", "", s[2:]).strip()
            clean = clean.replace("\\$", "$").strip(' "*')
            if len(clean) > 30:
                summary = clean
    if not summary:
        for line in lines:
            s = line.strip()
            if s and not s.startswith("#") and not s.startswith(">") and not s.startswith("|") and not s.startswith("---") and not s.startswith("```"):
                summary = s.replace("\\$", "$")
                break
    return h1, h2, summary[:280]


def normalize_slug(folder_name: str, track_id: str) -> str:
    raw = re.sub(r"^0[12]-", "", folder_name)
    raw = SLUG_ALIASES.get(raw, raw)
    if raw == "other" and track_id == "space":
        return "other-space"
    return raw


def build():
    items = []
    for track in TRACKS:
        for horizon, dir_key in [("v1", "v1_dir"), ("v2", "v2_dir")]:
            base_dir = ROOT / track[dir_key]
            if not base_dir.exists():
                continue
            for sub in sorted(base_dir.iterdir()):
                if not sub.is_dir() or sub.name in EXCLUDED_DIRS:
                    continue
                report_path = sub / "REPORT.md"
                storyboard_path = sub / "STORYBOARD.md"
                if not (report_path.exists() and storyboard_path.exists()):
                    continue
                report_md = report_path.read_text(encoding="utf-8")
                storyboard_md = storyboard_path.read_text(encoding="utf-8")
                slug = normalize_slug(sub.name, track["id"])
                h1, h2, summary = extract_headings_and_summary(report_md)
                title = HUMAN_TITLES.get(slug, slug.replace("-", " ").title())
                items.append({
                    "id": f"{horizon}-{track['id']}-{slug}",
                    "horizon": horizon,
                    "horizonLabel": "Vision 01 (2026–2040 Grounded)" if horizon == "v1" else "Vision 02 (2026–2030 Leapfrog)",
                    "trackId": track["id"],
                    "trackTitle": track["title"],
                    "slug": slug,
                    "folderName": sub.name,
                    "relPath": f"{track[dir_key]}/{sub.name}",
                    "title": title,
                    "heading": h1,
                    "subheading": h2.replace("\\$", "$"),
                    "summary": summary,
                    "isUrgentTriage": slug in URGENT_TRIAGE_SLUGS,
                    "reportLines": len(report_md.splitlines()),
                    "storyboardLines": len(storyboard_md.splitlines()),
                    "reportMd": report_md,
                    "storyboardMd": storyboard_md,
                })

    out_dir = ROOT / "data"
    out_dir.mkdir(exist_ok=True)
    payload = {
        "generatedAt": "2026-10-15",
        "totalTopics": len(items),
        "totalDocuments": len(items) * 2,
        "tracks": TRACKS,
        "items": items,
    }
    js_content = "window.ONE_OF_MANY_CATALOG = " + json.dumps(payload, ensure_ascii=False) + ";\n"
    (out_dir / "catalog.js").write_text(js_content, encoding="utf-8")
    print(f"Built data/catalog.js with {len(items)} subtopics ({len(items)*2} markdown files).")


if __name__ == "__main__":
    build()
