#!/bin/bash
# bump-version-semver.sh
# Format: MAJOR.MINOR.PATCH
#
# Aufruf:
#   bash scripts/bump-version-semver.sh patch   → 1.2.3 → 1.2.4  (Bugfix)
#   bash scripts/bump-version-semver.sh minor   → 1.2.3 → 1.3.0  (neues Feature)
#   bash scripts/bump-version-semver.sh major   → 1.2.3 → 2.0.0  (Breaking Change)

set -e

BUMP_TYPE=${1:-patch}

# --- Prüfungen ---
if [ ! -f "VERSION" ]; then
  echo "ERROR: VERSION nicht gefunden."
  echo "Einmalig initialisieren mit: bash scripts/init-version.sh"
  exit 1
fi

if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "ERROR: Ungültiger Typ. Verwende: patch | minor | major"
  exit 1
fi

# --- Berechnung ---
CURRENT=$(cat VERSION)
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"

case $BUMP_TYPE in
  major)
    MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1)); PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"

# --- Dateien updaten ---
echo "$NEW_VERSION" > VERSION

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated');
"

echo ""
echo "Version: $CURRENT → $NEW_VERSION ($BUMP_TYPE)"
echo ""
