#!/bin/bash
# Check YouTube license by clicking "Show more" and looking for license info

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
  echo "============================================"
  echo "VIDEO: https://www.youtube.com/watch?v=$id"
  
  agent-browser open "https://www.youtube.com/watch?v=$id" 2>&1 > /dev/null
  agent-browser wait 4000 2>&1 > /dev/null
  
  TITLE=$(agent-browser get title 2>/dev/null)
  echo "Title: $TITLE"
  
  # Try to find the description "Show more" button and click it
  SHOW_MORE=$(agent-browser find text "...more" click 2>/dev/null)
  agent-browser wait 2000 2>&1 > /dev/null
  
  # Get description text after expansion
  DESC=$(agent-browser eval "document.querySelector('#description-inner')?.innerText || document.querySelector('ytd-expander')?.innerText || ''" 2>/dev/null)
  
  if echo "$DESC" | grep -qi "Creative Commons"; then
    echo "License: ✅ Creative Commons"
  elif echo "$DESC" | grep -qi "Standard YouTube"; then
    echo "License: ❌ Standard YouTube License"
  else
    # Try checking the page source for license info
    LICENSE_CHECK=$(agent-browser eval "Array.from(document.querySelectorAll('*')).find(el => el.textContent.includes('License'))?.textContent || ''" 2>/dev/null | head -c 300)
    if echo "$LICENSE_CHECK" | grep -qi "Creative Commons"; then
      echo "License: ✅ Creative Commons"
    else
      echo "License: ❌ Standard YouTube License (default)"
    fi
  fi
  
  # Get channel name
  CHANNEL=$(agent-browser eval "document.querySelector('ytd-channel-name a')?.textContent || document.querySelector('#owner a')?.textContent || ''" 2>/dev/null)
  echo "Channel: $CHANNEL"
  echo ""
done

agent-browser close 2>&1 > /dev/null
