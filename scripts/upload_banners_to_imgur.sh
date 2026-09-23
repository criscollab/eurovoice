#!/bin/bash
# Sube todos los banners horizontales a Imgur

BANNERS_DIR="/home/z/my-project/download/banners-horizontal"
IMGUR_CLIENT_ID="b8f1e2c7e8d4f12"

echo "=== Subiendo banners horizontales a Imgur ==="
echo ""

for banner in "$BANNERS_DIR"/*.png; do
    filename=$(basename "$banner")
    echo -n "Subiendo $filename... "
    
    response=$(curl -s -X POST \
        -H "Authorization: Client-ID $IMGUR_CLIENT_ID" \
        -F "image=@$banner" \
        -F "type=file" \
        -F "name=$filename" \
        -F "title=Euro Voice Banner" \
        https://api.imgur.com/3/image)
    
    url=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('data',{}).get('link','ERROR'))" 2>/dev/null)
    
    if [ "$url" != "ERROR" ] && [ -n "$url" ]; then
        echo "✓ $url"
    else
        echo "✗ Error"
        echo "  Response: $response" | head -c 200
    fi
    
    sleep 3
done

echo ""
echo "=== Subida completada ==="
