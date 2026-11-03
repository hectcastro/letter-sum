"""Import a checksum-pinned OEWN release using only the Python standard library."""

import argparse
from collections import defaultdict
import gzip
import hashlib
import json
from pathlib import Path
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parent.parent


def normalize(name):
    # Preserve accents and punctuation: the app counts only ASCII A-Z.
    return " ".join(name.replace("_", " ").lower().split())


def verify_checksum(data, expected):
    if hashlib.sha256(data).hexdigest() != expected:
        raise ValueError("Dictionary checksum mismatch; refusing to replace generated data.")


def descendants(roots, children):
    found = set()
    pending = list(roots)
    while pending:
        current = pending.pop()
        if current not in found:
            found.add(current)
            pending.extend(children[current])
    return found


def extract(root, policy):
    lexicon = root.find("Lexicon")
    if lexicon is None or lexicon.get("version") != policy["version"]:
        raise ValueError("Unexpected dictionary version or XML structure.")
    synsets = {item.get("id"): item for item in lexicon.findall("Synset")}
    required = {*policy["beverageSynsets"], *policy["excludedBranches"], *policy["excludedSynsets"]}
    if not required.issubset(synsets):
        raise ValueError(f"Policy refers to missing synsets: {sorted(required - synsets.keys())}")

    children = defaultdict(set)
    for synset_id, synset in synsets.items():
        for relation in synset.findall("SynsetRelation"):
            if relation.get("relType") in {"hypernym", "instance_hypernym"}:
                children[relation.get("target")].add(synset_id)
    beverages = descendants(policy["beverageSynsets"], children)
    # Named drinks (e.g. milkshakes) can descend from the generic portion branch.
    excluded = (descendants(policy["excludedBranches"], children) - beverages) | set(policy["excludedSynsets"])
    grouped = defaultdict(lambda: {"synsets": set(), "categories": set()})
    skipped = set()
    for entry in lexicon.findall("LexicalEntry"):
        lemma = entry.find("Lemma")
        if lemma is None or lemma.get("partOfSpeech") != "n":
            continue
        name = normalize(lemma.get("writtenForm"))
        if not re.search("[a-z]", name):
            continue
        for sense in entry.findall("Sense"):
            synset_id = sense.get("synset")
            synset = synsets[synset_id]
            if synset.get("lexfile") != "noun.food":
                continue
            if synset_id in excluded:
                skipped.add((name, synset_id))
                continue
            grouped[name]["synsets"].add(synset_id)
            grouped[name]["categories"].add("drink" if synset_id in beverages else "food")

    entries = [
        {"name": name,
         "category": "drink" if "drink" in group["categories"] else "food",
         "synsets": sorted(group["synsets"])}
        for name, group in sorted(grouped.items())
    ]
    audit = {
        "dictionaryCandidates": len(entries),
        "ambiguousCategories": [name for name, group in sorted(grouped.items())
                                if len(group["categories"]) > 1],
        "excludedSenses": [{"name": name, "synset": synset_id,
                            "definition": synsets[synset_id].findtext("Definition")}
                           for name, synset_id in sorted(skipped)],
    }
    return entries, audit


def apply_overrides(entries, overrides):
    by_name = {entry["name"]: dict(entry) for entry in entries}
    additions = set()
    exclusions = set()
    for entry in overrides["additions"]:
        name = normalize(entry["name"])
        if not re.search("[a-z]", name) or entry["category"] not in {"food", "drink"}:
            raise ValueError(f"Invalid addition: {entry}")
        if name in additions:
            raise ValueError(f"Duplicate addition: {name}")
        additions.add(name)
        by_name[name] = {"name": name, "category": entry["category"],
                         "synsets": by_name.get(name, {}).get("synsets", [])}
    for entry in overrides["exclusions"]:
        name = normalize(entry["name"])
        if not name or not entry.get("reason") or name in exclusions or name in additions:
            raise ValueError(f"Invalid or conflicting exclusion: {entry}")
        exclusions.add(name)
        by_name.pop(name, None)
    return [by_name[name] for name in sorted(by_name)]


def write_json(path, content):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temporary.replace(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, help="Local copy of the pinned XML.gz release")
    args = parser.parse_args()
    policy = json.loads((ROOT / "scripts/wordnet-source.json").read_text())
    cache = ROOT / ".cache/wordnet" / policy["url"].rsplit("/", 1)[-1]
    source = args.source or cache
    if not source.exists():
        if args.source:
            raise ValueError(f"Source file does not exist: {source}")
        print(f"Downloading {policy['name']} {policy['version']}…", flush=True)
        with urllib.request.urlopen(policy["url"], timeout=60) as response:
            data = response.read()
        verify_checksum(data, policy["sha256"])
        cache.parent.mkdir(parents=True, exist_ok=True)
        temporary = cache.with_suffix(".tmp")
        temporary.write_bytes(data)
        temporary.replace(cache)
    data = source.read_bytes()
    verify_checksum(data, policy["sha256"])
    entries, audit = extract(ET.fromstring(gzip.decompress(data)), policy)
    overrides = json.loads((ROOT / "src/data/foodAndDrinks.overrides.json").read_text())
    entries = apply_overrides(entries, overrides)
    if not entries:
        raise ValueError("Import produced no names; refusing to replace generated data.")

    output = ROOT / "src/data/foodAndDrinks.generated.json"
    # On the first run, compare against the existing curated list.
    previous = json.loads(output.read_text())["entries"] if output.exists() else overrides["additions"]
    before = {entry["name"]: entry["category"] for entry in previous}
    after = {entry["name"]: entry["category"] for entry in entries}
    audit["changes"] = {
        "added": sorted(after.keys() - before.keys()),
        "removed": sorted(before.keys() - after.keys()),
        "reclassified": [{"name": name, "from": before[name], "to": after[name]}
                         for name in sorted(before.keys() & after.keys()) if before[name] != after[name]],
    }
    audit["overrideAdditions"] = len(overrides["additions"])
    audit["overrideExclusions"] = overrides["exclusions"]
    write_json(output, {"source": policy, "entries": entries})
    write_json(ROOT / ".cache/wordnet/import-audit.json", audit)
    print(f"Imported {len(entries)} names. Run the report step to inspect matches and changes.")


if __name__ == "__main__":
    try:
        main()
    except (ValueError, OSError, ET.ParseError, KeyError) as error:
        sys.exit(f"Import failed: {error}")
