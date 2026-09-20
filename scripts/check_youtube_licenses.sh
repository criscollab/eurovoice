#!/bin/bash
# Script para revisar la licencia de videos de YouTube
# Usage: ./check_youtube_licenses.sh

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
  "JqnXiCKAL_k"
  "sIC0kHx6vj0"
  "Br1gGm31aJI"
  "nBaU1P8QHY8"
  "4jtrzHRI_5Y"
  "CSFBsUuP0nM"
  "Uv8GBuYAYBM"
  "Qpldqf2fGd8"
  "7ef7C_6kQXI"
  "3Altxp1ubPM"
)

for id in "${VIDEO_IDS[@]}"; do
  echo "==================================================="
  echo "VIDEO ID: $id"
  echo "URL: https://www.youtube.com/watch?v=$id"
  echo "---"
  
  # Get video page HTML and extract license info
  # The license info is usually in a meta tag or in the initial player response
  HTML=$(curl -s "https://www.youtube.com/watch?v=$id" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
  
  # Extract title
  TITLE=$(echo "$HTML" | grep -oP '<title>\K[^<]+' | head -1)
  echo "Title: $TITLE"
  
  # Check for Creative Commons license
  if echo "$HTML" | grep -q "Creative Commons"; then
    echo "License: ✅ Creative Commons (reutilización permitida)"
  else
    echo "License: ❌ Standard YouTube License (no reutilización)"
  fi
  
  # Check for channel name
  CHANNEL=$(echo "$HTML" | grep -oP '"author":"\K[^"]+' | head -1)
  echo "Channel: $CHANNEL"
  
  echo ""
done
