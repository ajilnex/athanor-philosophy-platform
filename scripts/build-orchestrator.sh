#!/usr/bin/env bash
set -euo pipefail

# --- Concurrency lock: prevent concurrent builds among multiple agents ---
LOCK_DIR=".buildlock"
LOCK_PID_FILE="$LOCK_DIR/pid"
MAX_WAIT_SECONDS=${MAX_BUILD_LOCK_WAIT_SECONDS:-600}
SLEEP_INTERVAL=2

acquire_lock() {
  local waited=0
  while true; do
    if mkdir "$LOCK_DIR" 2>/dev/null; then
      echo "$$" > "$LOCK_PID_FILE"
      trap 'rm -rf "$LOCK_DIR"' EXIT INT TERM
      echo "🔒 Build lock acquired (pid=$$)."
      return 0
    fi

    # Lock exists — check if stale
    if [[ -f "$LOCK_PID_FILE" ]]; then
      local other_pid
      other_pid=$(cat "$LOCK_PID_FILE" 2>/dev/null || true)
      if [[ -n "${other_pid:-}" ]] && kill -0 "$other_pid" 2>/dev/null; then
        # Active lock: wait
        if (( waited == 0 )); then
          echo "⏳ Another build is running (pid=$other_pid). Waiting for lock..."
        fi
      else
        # Stale lock: cleanup and retry immediately
        echo "🧹 Stale build lock detected. Cleaning up..."
        rm -rf "$LOCK_DIR"
        continue
      fi
    else
      # No pid file but dir exists — treat as stale
      echo "🧹 Incomplete build lock detected. Cleaning up..."
      rm -rf "$LOCK_DIR"
      continue
    fi

    if (( waited >= MAX_WAIT_SECONDS )); then
      echo "❌ Could not acquire build lock after ${MAX_WAIT_SECONDS}s. Aborting."
      exit 1
    fi

    sleep "$SLEEP_INTERVAL"
    waited=$(( waited + SLEEP_INTERVAL ))
  done
}

acquire_lock

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
echo "🔗 Group B: Graph JSON + SVG (now sequential to fix race condition)"
(
  node scripts/build-graph-billets.cjs && node scripts/render-graph-svg.cjs
) &
PID_GRAPH_GROUP=$!

echo "🔍 Group C: Search index (parallel)"
node scripts/build-search-index.js &
PID_SEARCH=$!

ret=0

for pid in $PID_GRAPH_GROUP $PID_SEARCH; do
  if ! wait "$pid"; then
    ret=1
  fi
done

if [ "$ret" -ne 0 ]; then
  echo "❌ One or more parallel build steps failed."
  exit 1
fi

echo "✅ Build orchestrator completed successfully."

# Lock released by trap on exit
