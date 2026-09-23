#!/usr/bin/env python3
"""
Sube banners a Catbox (catbox.moe) — servicio gratuito sin rate limits estrictos.
"""

import requests
import os
import time
import json

BANNERS_DIR = '/home/z/my-project/download/banners-horizontal'
CATBOX_URL = 'https://catbox.moe/user/api.php'

# Solo subimos los 3 formatos más comunes para no saturar
BANNERS_TO_UPLOAD = [
    'eurovoice-banner-728x90.png',
    'eurovoice-banner-970x90.png',
    'eurovoice-banner-970x250.png',
    'eurovoice-banner-468x60.png',
    'eurovoice-banner-320x50.png',
    'eurovoice-banner-1200x150.png',
    'eurovoice-banner-1200x300.png',
]

def upload_to_catbox(filepath: str) -> str:
    """Sube un archivo a catbox.moe y devuelve la URL pública."""
    with open(filepath, 'rb') as f:
        response = requests.post(
            CATBOX_URL,
            data={'reqtype': 'fileupload', 'userhash': ''},
            files={'fileToUpload': (os.path.basename(filepath), f, 'image/png')},
            timeout=60
        )
    if response.status_code == 200 and response.text.startswith('https://'):
        return response.text.strip()
    raise Exception(f'Catbox upload failed: {response.status_code} {response.text[:200]}')


def main():
    print("=== Subiendo banners horizontales a Catbox.moe ===\n")
    
    urls = {}
    for filename in BANNERS_TO_UPLOAD:
        filepath = os.path.join(BANNERS_DIR, filename)
        if not os.path.exists(filepath):
            print(f"  ✗ {filename} — archivo no encontrado")
            continue
        
        try:
            print(f"Subiendo {filename}...", end=' ', flush=True)
            url = upload_to_catbox(filepath)
            urls[filename] = url
            print(f"✓ {url}")
        except Exception as e:
            print(f"✗ Error: {str(e)[:100]}")
        
        # Pequeño delay para no saturar Catbox
        time.sleep(2)
    
    # Guardar URLs en un archivo JSON para referencia
    urls_file = os.path.join(BANNERS_DIR, 'urls.json')
    with open(urls_file, 'w') as f:
        json.dump(urls, f, indent=2)
    
    print(f"\n✓ {len(urls)} banners subidos")
    print(f"URLs guardadas en: {urls_file}")
    
    # Imprimir resumen
    print("\n=== Resumen de URLs ===")
    for filename, url in urls.items():
        # Extraer dimensiones del nombre
        parts = filename.replace('eurovoice-banner-', '').replace('.png', '')
        print(f"{parts:<12} → {url}")


if __name__ == '__main__':
    main()
