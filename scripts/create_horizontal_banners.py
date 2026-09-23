#!/usr/bin/env python3
"""
Genera banners horizontales rectangulares de Euro Voice en múltiples tamaños
para el intercambio publicitario con el socio.

Formatos horizontales rectangulares más comunes en web:
- 728x90   (leaderboard clásico)
- 970x90   (leaderboard grande)
- 970x250  (billboard)
- 1200x150 (alta resolución)
- 468x60   (banner tradicional pequeño)
- 320x50   (banner móvil)
"""

from PIL import Image, ImageDraw, ImageFont
import os

OUTPUT_DIR = '/home/z/my-project/download/banners-horizontal'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Colores de Euro Voice
BLUE = (59, 130, 246)
INDIGO = (79, 70, 229)
WHITE = (255, 255, 255)
TAGLINE_COLOR = (220, 230, 255, 255)


def create_gradient_background(width: int, height: int) -> Image.Image:
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    for x in range(width):
        ratio = x / max(width - 1, 1)
        r = int(BLUE[0] + (INDIGO[0] - BLUE[0]) * ratio)
        g = int(BLUE[1] + (INDIGO[1] - BLUE[1]) * ratio)
        b = int(BLUE[2] + (INDIGO[2] - BLUE[2]) * ratio)
        for y in range(height):
            img.putpixel((x, y), (r, g, b, 255))
    return img


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_v_logo(draw, x, y, size, color=WHITE):
    scale = size / 64
    points = [
        (x + 18 * scale, y + 20 * scale),
        (x + 28 * scale, y + 20 * scale),
        (x + 32 * scale, y + 36 * scale),
        (x + 36 * scale, y + 20 * scale),
        (x + 46 * scale, y + 20 * scale),
        (x + 36 * scale, y + 48 * scale),
        (x + 28 * scale, y + 48 * scale),
    ]
    draw.polygon(points, fill=color)
    dot_r = max(1, int(2 * scale))
    cx = x + int(50 * scale)
    cy = y + int(34 * scale)
    draw.ellipse(
        [(cx - dot_r, cy - dot_r), (cx + dot_r, cy + dot_r)],
        fill=color
    )


def create_horizontal_banner(width: int, height: int, output_path: str, label: str = ""):
    """Crea un banner horizontal rectangular."""

    # 1. Fondo con gradiente
    img = create_gradient_background(width, height)
    draw = ImageDraw.Draw(img)

    # 2. Logo V (izquierda)
    # El logo ocupa ~60% de la altura, ajustado según aspect ratio
    logo_size = int(height * 0.55)
    logo_x = int(width * 0.025)
    logo_y = (height - logo_size) // 2
    draw_v_logo(draw, logo_x, logo_y, logo_size)

    # 3. Texto "Euro Voice" (centro-izquierda)
    # Tamaño del título proporcional a la altura
    title_font_size = max(14, int(height * 0.30))
    title_font = get_font(title_font_size, bold=True)

    text_x = logo_x + logo_size + int(width * 0.025)
    title_text = "Euro Voice"
    title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]

    # Tagline
    tagline_font_size = max(10, int(height * 0.13))
    tagline_font = get_font(tagline_font_size, bold=False)

    # Espacio entre título y tagline
    gap_between = max(4, int(height * 0.08))

    total_block_height = title_h + gap_between + tagline_font_size
    block_start_y = (height - total_block_height) // 2

    title_y = block_start_y - int(title_bbox[1])
    tagline_y = title_y + title_h + gap_between - int(tagline_font_size * 0.2)

    draw.text((text_x, title_y), title_text, font=title_font, fill=WHITE)

    # 4. Tagline
    tagline_text = "Música europea 24/7"
    draw.text((text_x, tagline_y), tagline_text, font=tagline_font, fill=TAGLINE_COLOR)

    # 5. Botón "Escucha Ahora" (derecha)
    btn_font_size = max(11, int(height * 0.20))
    btn_font = get_font(btn_font_size, bold=True)
    btn_text = "▶ Escucha Ahora"
    btn_bbox = draw.textbbox((0, 0), btn_text, font=btn_font)
    btn_text_w = btn_bbox[2] - btn_bbox[0]
    btn_text_h = btn_bbox[3] - btn_bbox[1]

    btn_padding_x = max(8, int(height * 0.20))
    btn_padding_y = max(6, int(height * 0.22))
    btn_w = btn_text_w + btn_padding_x * 2
    btn_h = btn_text_h + btn_padding_y * 2

    btn_x = width - btn_w - int(width * 0.03)
    btn_y = (height - btn_h) // 2

    radius = int(btn_h * 0.35)
    draw.rounded_rectangle(
        [(btn_x, btn_y), (btn_x + btn_w, btn_y + btn_h)],
        radius=radius, fill=WHITE
    )

    btn_text_x = btn_x + (btn_w - btn_text_w) // 2
    btn_text_y = btn_y + (btn_h - btn_text_h) // 2 - int(height * 0.02)
    draw.text((btn_text_x, btn_text_y), btn_text, font=btn_font, fill=BLUE)

    # Guardar
    img.save(output_path, 'PNG')
    print(f"Created: {output_path} ({label})")


def main():
    # Formatos horizontales rectangulares más comunes
    banners = [
        (728, 90,   'eurovoice-banner-728x90.png',    'Leaderboard estándar (web)'),
        (970, 90,   'eurovoice-banner-970x90.png',    'Leaderboard grande'),
        (970, 250,  'eurovoice-banner-970x250.png',   'Billboard (grande)'),
        (468, 60,   'eurovoice-banner-468x60.png',    'Banner tradicional pequeño'),
        (320, 50,   'eurovoice-banner-320x50.png',    'Banner móvil'),
        (1200, 150, 'eurovoice-banner-1200x150.png',  'Alta resolución'),
        (1200, 300, 'eurovoice-banner-1200x300.png',  'Alta resolución grande'),
    ]

    print("=== Generando banners horizontales rectangulares ===\n")
    for width, height, filename, label in banners:
        output_path = os.path.join(OUTPUT_DIR, filename)
        create_horizontal_banner(width, height, output_path, label)

    print(f"\n✓ {len(banners)} banners creados en: {OUTPUT_DIR}")
    print("\nFormatos disponibles:")
    for w, h, fn, label in banners:
        print(f"  - {fn:<35} ({w}x{h}px) — {label}")


if __name__ == '__main__':
    main()
