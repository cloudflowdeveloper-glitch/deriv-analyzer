#!/bin/bash
cd /home/z/my-project/mini-services/tick-feed
while true; do
    echo "[$(date)] Starting tick-feed..." >> /home/z/my-project/tick-feed.log
    bun index.ts >> /home/z/my-project/tick-feed.log 2>&1
    echo "[$(date)] tick-feed exited, restarting in 3s..." >> /home/z/my-project/tick-feed.log
    sleep 3
done
