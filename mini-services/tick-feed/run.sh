#!/bin/bash
cd "$(dirname "$0")"
while true; do
    bun index.ts 2>&1
    echo "[tick-feed] Restarting in 2s..."
    sleep 2
done
