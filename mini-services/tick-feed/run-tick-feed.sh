#!/bin/bash
cd /home/z/my-project/mini-services/tick-feed
while true; do
    bun index.ts >> /home/z/my-project/tick-feed.log 2>&1
    EXIT=$?
    echo "[tick-feed] Exited with code $EXIT, restarting in 2s..." >> /home/z/my-project/tick-feed.log
    sleep 2
done
