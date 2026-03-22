#!/bin/bash
# bump-version-calver.sh
# Format: YYYY.MMDD.NNNN[N]
# Counter läuft NIEMALS zurück — immer aufsteigend über alle Deploys
#
# Aufruf: bash scripts/bump-version-calver.sh
# Output: VERSION, VERSION.counter, package.json werden aktualisiert

set -e

# --- Prüfungen ---
if [ ! -f "VERSION.counter" ]; then
  echo "ERROR: VERSION.counter nicht gefunden."
  echo "Einmalig initialisieren mit: bash scripts/init-version.sh"
  exit 1
fi

if [ ! -f "package.json" ]; then
  echo "ERROR: package.json nicht gefunden. Im Projekt-Root ausführen."
  exit 1
fi

# --- Berechnung ---
TODAY=$(date +%Y.%m%d)
OLD_COUNTER=$(cat VERSION.counter)
NEW_COUNTER=$((OLD_COUNTER + 1))
NEW_VERSION="${TODAY}.${NEW_COUNTER}"
OLD_VERSION=$(cat VERSION 2>/dev/null || echo "neu")

# --- Dateien updaten ---
echo "$NEW_VERSION" > VERSION
echo "$NEW_COUNTER" > VERSION.counter

# package.json version updaten
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.version = '$NEW_VERSION';
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');
console.log('package.json updated');
"

echo ""
echo "Version: $OLD_VERSION → $NEW_VERSION"
echo "Counter: $OLD_COUNTER → $NEW_COUNTER"
echo ""
