#!/bin/bash
# Check YouTube video licenses using agent-browser

VIDEO_IDS=(
  "V774LxOW_lw"
  "q0WkOBwdmwk"
  "AfopFGZ1zf4"
  "kkrGcf7wkO8"
  "mHBxWGCJx6s"
  "RN4Txcq2nZQ"
  "_bkj6pe6gDo"
  "lzL_W4p-4OU"
  "CKgttgRN_QU"
  "kUZg5gRURzo"
)

for id in "${VIDEO_IDS[@]}"; do
  echo "============================================"
  echo "VIDEO: https://www.youtube.com/watch?v=$id"
  echo "============================================"
  
  agent-browser open "https://www.youtube.com/watch?v=$id" 2>&1 | tail -2
  agent-browser wait 3000 2>&1 > /dev/null
  
  # Get page title (contains video title)
  TITLE=$(agent-browser get title 2>/dev/null)
  echo "Title: $TITLE"
  
  # Scroll down to find description and license info
  agent-browser scroll down 800 2>&1 > /dev/null
  agent-browser wait 2000 2>&1 > /dev/null
  
  # Try to get description text
  agent-browser snapshot -c 2>/dev/null | grep -i -E "license|creative commons|standard|copyright" | head -5
  
  echo ""
done

agent-browser close 2>&1 | tail -1
