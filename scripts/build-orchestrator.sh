#!/usr/bin/env bash
set -euo pipefail

echo "🏗️ Build orchestrator starting..."

# Group A: Must succeed before proceeding (sequential)
echo "📚 Step A1: Building bibliography..."
node scripts/build-bibliography.js

echo "🔎 Step A2: Validating citations..."
node scripts/validate-citations.js

echo "🗺️  Step A3: Building citation map..."
node scripts/build-citation-map.js

echo "✅ Group A complete. Proceeding with parallel tasks."

# Groups B and C: Run in parallel, fail if any fails
echo "🔗 Group B: Graph JSON + SVG (parallel)"
node scripts/build-graph-billets.cjs &
PID_GRAPH=$!
node scripts/render-graph-svg.cjs &
PID_SVG=$!

echo "🔍 Group C: Search index (parallel)"
node scripts/build-search-index.js &
PID_SEARCH=$!

ret=0

for pid in $PID_GRAPH $PID_SVG $PID_SEARCH; do
  if ! wait "$pid"; then
    ret=1
  fi
done

if [ "$ret" -ne 0 ]; then
  echo "❌ One or more parallel build steps failed."
  exit 1
fi

echo "✅ Build orchestrator completed successfully."

