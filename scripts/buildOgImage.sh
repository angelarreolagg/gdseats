#!/usr/bin/env bash
#
# Rasterise public/og-image.svg to the 1200x630 PNG that social scrapers read.
#
# macOS only, and on purpose: there is no ImageMagick, sharp, or headless browser
# in this repo, and adding one for a file that changes twice a year is a poor
# trade. `qlmanage` (Quick Look, WebKit underneath) and `sips` ship with the OS.
#
# Read the comment at the top of og-image.svg before editing it — the square
# viewBox and the half-size width/height are both working around Quick Look and
# will look like mistakes otherwise.
#
# Usage: pnpm og:build

set -euo pipefail

cd "$(dirname "$0")/.."

SRC=public/og-image.svg
TMP=public/og-image.svg.png
OUT=public/og-image.png

if [[ "$(uname)" != "Darwin" ]]; then
  echo "og:build needs macOS (qlmanage + sips). Regenerate on a Mac, or hand-export" >&2
  echo "$SRC to a 1200x630 PNG at $OUT with any tool you like." >&2
  exit 1
fi

rm -f "$TMP" "$OUT"

# Quick Look only emits squares, so this lands 1200x1200 with the card centred.
qlmanage -t -s 1200 -o public "$SRC" >/dev/null

# Centre crop back down to the card. Exact, because the source centred it.
sips --cropToHeightWidth 630 1200 "$TMP" --out "$OUT" >/dev/null

rm -f "$TMP"

# A silent XML parse error renders WebKit's pink error page at the right size, so
# checking the dimensions is not enough — open the file and look at it.
sips -g pixelWidth -g pixelHeight "$OUT"
echo "Wrote $OUT — open it and confirm it is the wordmark, not a WebKit error page."
