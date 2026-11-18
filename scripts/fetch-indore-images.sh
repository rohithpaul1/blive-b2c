#!/usr/bin/env bash
# Downloads the Sprinto HS photos from esprinto.in into public/images/franchises/indore/.
# Run from the repo root: bash scripts/fetch-indore-images.sh
# NOTE: the files in the repo are refined versions (close-ups cropped out of their red
# rings and upscaled; side shots trimmed to one size, floor line and shadow). Re-running
# this overwrites them with the raw downloads.
set -euo pipefail
cd "$(dirname "$0")/../public/images/franchises/indore"
BASE="https://www.esprinto.in/wp-content/uploads"
while read -r name url; do
  curl -fsSL "$url" -o "$name" && echo "ok   $name" || echo "FAIL $name  ($url)"
done <<LIST
sprinto-hs.webp     $BASE/elementor/thumbs/sprinto-hs-r2ect8f2yczadnhpr20lno8mkjm8e7e3iah60rum2g.webp
hs-scooter.webp     $BASE/elementor/thumbs/hs-scooter-r2ecubwaya1tyzxbwh8672py6qilmz0nxrdbw1f8e4.webp
hs-high-speed.webp  $BASE/2025/03/high-speed-scooter-hs.webp
hs-spec.webp        $BASE/2025/03/hs_pic_spec.webp
hs-battery.webp     $BASE/2025/03/hs-battery.webp
hs-features.webp    $BASE/2025/03/hs-features.webp
hs-dashboard.webp   $BASE/2025/03/hs-dashboard.webp
hs-red.webp         $BASE/2025/03/hs-red-scooter.webp
hs-blue.webp        $BASE/2025/03/hs-blue-scooter.webp
hs-white.webp       $BASE/2025/03/hs-white-scooter.webp
LIST
ls -la
