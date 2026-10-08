#!/usr/bin/env python3
"""Vérifie liens documentaires, archives et inventaires, sans modifier le projet."""
from pathlib import Path
from urllib.parse import unquote
import hashlib
import json
import re
import sys
ROOT = Path(__file__).resolve().parent
DOCS = ROOT.parent
REPO = DOCS.parent.parent
errors = []
counts = {'archives': 0, 'dependencies': 0, 'links': 0}
for filename, base, key in [('original-manifest.json', ROOT / 'claude-original', 'archives'), ('dependencies-manifest.json', ROOT / 'dependencies', 'dependencies')]:
    for item in json.loads((ROOT / filename).read_text())['files']:
        p = base / item['path']
        if not p.is_file() or hashlib.sha256(p.read_bytes()).hexdigest() != item['sha256'] or p.stat().st_size != item['bytes']:
            errors.append(f'Archive incorrecte: {p}')
        counts[key] += 1
# Only authored operational docs: original historical Markdown is preserved verbatim.
for p in list(DOCS.glob('*.md')) + list(ROOT.glob('*.md')):
    content = re.sub(r'```[\s\S]*?```', '', p.read_text())
    for target in re.findall(r'\[[^\]]*\]\(([^)]+)\)', content):
        target = target.strip('<>')
        if re.match(r'^[a-z]+:', target):
            continue
        relative = unquote(target.split('#', 1)[0])
        if relative and not (p.parent / relative).exists():
            errors.append(f'Lien invalide {p.relative_to(REPO)}: {target}')
        counts['links'] += 1
palette = json.loads((ROOT / 'claude-original/handoff/palette.json').read_text())
full = (ROOT / 'tokens-complets.md').read_text()
css = (ROOT / 'claude-original/handoff/tokens.css').read_text()
for mode in ['light', 'dark']:
    for key, value in palette[mode].items():
        if f"| --{key} | {value['hex']} | {value['oklch']} |" not in full or value['oklch'] not in css:
            errors.append(f'Token absent: {mode}/{key}')
for line in css.splitlines():
    if re.match(r'\s*--', line) and line.strip() not in full:
        errors.append('Déclaration CSS non documentée: ' + line)
# Verify every documented hexadecimal literal against an original or implementation source.
known = set()
for source in list((ROOT / 'claude-original').rglob('*')) + list((REPO / 'src').rglob('*')):
    if source.is_file() and source.suffix in ['.html', '.css', '.md', '.json', '.ts', '.tsx']:
        known.update(v.lower() for v in re.findall(r'#[0-9a-fA-F]{3,8}\b', source.read_text()))
for document in list(DOCS.glob('*.md')) + list(ROOT.glob('*.md')):
    for value in re.findall(r'#[0-9a-fA-F]{3,8}\b', document.read_text()):
        if value.lower() not in known: errors.append(f'Couleur sans source: {document.name}/{value}')
ratios = (ROOT / 'contrastes.md').read_text()
for mode in ['light', 'dark']:
    for fg, bg, threshold, value in palette['contrast'][mode]:
        if f'{fg} / {bg}' not in ratios or str(value) not in ratios:
            errors.append(f'Contraste absent: {mode}/{fg}/{bg}')
expected = ['README.md','01-philosophie-design.md','02-couleurs-et-tokens.md','03-typographie.md','04-espacements-et-layout.md','05-composants-ui.md','06-navigation.md','07-responsive.md','08-interactions-animations.md','09-accessibilite.md','10-regles-par-ecran.md','11-bonnes-pratiques.md','12-checklist-validation.md','13-correspondance-code.md']
for name in expected:
    if not (DOCS / name).is_file(): errors.append('Chapitre absent: ' + name)
agents = (REPO / 'AGENTS.md').read_text()
for required in ['BEGIN:nextjs-agent-rules','END:nextjs-agent-rules','VORTEX — DESIGN SYSTEM OFFICIEL (OBLIGATOIRE)','docs/design-system/README.md']:
    if required not in agents: errors.append('Instruction AGENTS absente: ' + required)
for filename in ['source-style-declarations.json','source-color-occurrences.json','design-system-render-data.json']:
    json.loads((ROOT / filename).read_text())
print(json.dumps({'counts':counts,'chapters':len(expected),'errors':errors},ensure_ascii=False,indent=2))
sys.exit(bool(errors))
