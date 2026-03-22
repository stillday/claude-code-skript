#!/bin/bash
# init-version.sh
# Einmalig beim Projekt-Setup ausführen.
# Initialisiert VERSION und VERSION.counter mit Startwerten.

set -e

SCHEMA=${1:-calver}  # calver | semver

if [ "$SCHEMA" = "calver" ]; then
  # Zufälliger Counter-Start zwischen 1000 und 1999
  START_COUNTER=$(( RANDOM % 1000 + 1000 ))
  TODAY=$(date +%Y.%m%d)
  INITIAL_VERSION="${TODAY}.${START_COUNTER}"

  echo "$INITIAL_VERSION" > VERSION
  echo "$START_COUNTER" > VERSION.counter

  echo "CalVer initialisiert: $INITIAL_VERSION"
  echo "Counter-Start: $START_COUNTER"

elif [ "$SCHEMA" = "semver" ]; then
  echo "0.1.0" > VERSION

  echo "SemVer initialisiert: 0.1.0"
  echo "Nächste Schritte: 0.1.x = Entwicklung, 1.0.0 = erster stabiler Release"

else
  echo "ERROR: Unbekanntes Schema. Verwende: calver | semver"
  exit 1
fi

echo ""
echo "VERSION Datei: $(cat VERSION)"
echo ""
echo "Jetzt committen:"
echo "  git add VERSION $([ '$SCHEMA' = 'calver' ] && echo 'VERSION.counter') package.json"
echo "  git commit -m \"chore: initialize version $(cat VERSION)\""
