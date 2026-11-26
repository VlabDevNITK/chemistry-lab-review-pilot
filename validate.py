#!/usr/bin/env python3
"""Validate lab config and experiment structure before merge/deployment."""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REQUIRED = [
    "aim.md", "theory.md", "pretest.json", "procedure.md",
    "simulation/index.html", "posttest.json", "references.md", "contributors.md"
]

errors = []
config_file = ROOT / "config.json"
try:
    config = json.loads(config_file.read_text(encoding="utf-8"))
except Exception as exc:
    print(f"ERROR: config.json is invalid: {exc}")
    sys.exit(1)

if not isinstance(config.get("lab"), dict) or not config["lab"].get("id") or not config["lab"].get("title"):
    errors.append("config.json must contain lab.id and lab.title.")

experiments = config.get("experiments")
if not isinstance(experiments, list) or not experiments:
    errors.append("config.json must contain a non-empty experiments array.")
else:
    seen = set()
    for exp in experiments:
        exp_id = exp.get("id", "")
        title = exp.get("title", "")
        rel = exp.get("path", "")
        if not exp_id or not title or not rel:
            errors.append(f"Experiment entry is missing id, title or path: {exp}")
            continue
        if exp_id in seen:
            errors.append(f"Duplicate experiment id: {exp_id}")
        seen.add(exp_id)
        folder = (ROOT / rel).resolve()
        if ROOT.resolve() not in folder.parents:
            errors.append(f"{exp_id}: path must remain inside the repository.")
            continue
        if not folder.is_dir():
            errors.append(f"{exp_id}: experiment folder does not exist: {rel}")
            continue
        for required in REQUIRED:
            target = folder / required
            if not target.is_file():
                errors.append(f"{exp_id}: required file missing: {required}")
        for quiz_name in ("pretest.json", "posttest.json"):
            target = folder / quiz_name
            if target.exists():
                try:
                    quiz = json.loads(target.read_text(encoding="utf-8"))
                    if not isinstance(quiz.get("questions"), list):
                        errors.append(f"{exp_id}: {quiz_name} must contain a questions array.")
                except Exception as exc:
                    errors.append(f"{exp_id}: invalid {quiz_name}: {exc}")

if errors:
    print("Lab validation FAILED:")
    for error in errors:
        print(f" - {error}")
    sys.exit(1)

print(f"Lab validation passed: {len(experiments)} experiment(s) configured.")
