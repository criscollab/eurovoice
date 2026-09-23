#!/usr/bin/env python3
"""
Genera el banner horizontal de Euro Voice para ser usado por socios publicitarios.

Crea:
- eurovoice-banner-728x90.png  (banner estándar web)
- eurovoice-banner-728x90.svg  (versión vectorial, escalable)
- eurovoice-banner-1200x150.png (versión alta resolución)
"""

from PIL import Image, ImageDraw, ImageFont
import os

# === Configuración ===
OUTPUT_DIR = '/home/z/my-project/download'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Colores de Euro Voice (gradiente azul-índigo)
BLUE = (59, 130, 246)       # #3b82f6 blue-500
INDIGO = (79, 70, 229)     # #4f46e5 indigo-600
WHITE = (255, 255, 255)
LIGHT_WHITE = (255, 255, 255, 200)  # for tagline
DARK_BLUE = (30, 58, 138)  # for button text

# === Funciones auxiliares ===

def create_gradient_background(width: int, height: int) -> Image.Image:
    """Crea un fondo con gradiente horizontal de azul a índigo."""
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    for x in range(width):
        # Interpolación lineal entre BLUE y INDIGO
        ratio = x / max(width - 1, 1)
        r = int(BLUE[0] + (INDIGO[0] - BLUE[0]) * ratio)
        g = int(BLUE[1] + (INDIGO[1] - BLUE[1]) * ratio)
        b = int(BLUE[2] + (INDIGO[2] - BLUE[2]) * ratio)
        for y in range(height):
            img.putpixel((x, y), (r, g, b, 255))
    return img


def draw_rounded_rect(draw, xy, radius, fill):
    """Dibuja un rectángulo redondeado."""
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def get_font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    """Obtiene una fuente del sistema. Busca alternativas."""
    font_paths = [
        '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf' if bold else '/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf',
        '/usr/share/fonts/truetype/noto/NotoSans-Regular.ttf',
    ]
    for path in font_paths:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_v_logo(draw, x, y, size, color=WHITE):
    """Dibuja la 'V' estilizada de Euro Voice (igual que el favicon)."""
    # V path: M18 20 L28 20 L32 36 L36 20 L46 20 L36 48 L28 48 Z
    # Escalado a `size` partiendo de un canvas de 64x64
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
    # Pequeño punto (onda de sonido)
    dot_r = max(1, int(2 * scale))
    cx = x + int(50 * scale)
    cy = y + int(34 * scale)
    draw.ellipse(
        [(cx - dot_r, cy - dot_r), (cx + dot_r, cy + dot_r)],
        fill=color
    )


def create_banner(width: int, height: int, output_path: str):
    """Crea un banner con gradiente azul-índigo, logo V, título, tagline y botón."""

    # 1. Fondo con gradiente
    img = create_gradient_background(width, height)
    draw = ImageDraw.Draw(img)

    # 2. Logo V (izquierda)
    logo_size = int(height * 0.65)
    logo_x = int(width * 0.025)
    logo_y = (height - logo_size) // 2
    draw_v_logo(draw, logo_x, logo_y, logo_size)

    # 3. Texto "Euro Voice" (centro-izquierda)
    title_font_size = int(height * 0.32)
    title_font = get_font(title_font_size, bold=True)

    text_x = logo_x + logo_size + int(width * 0.02)
    title_text = "Euro Voice"
    title_bbox = draw.textbbox((0, 0), title_text, font=title_font)
    title_w = title_bbox[2] - title_bbox[0]
    title_h = title_bbox[3] - title_bbox[1]
    title_y = (height - title_h) // 2 - int(height * 0.08)

    draw.text((text_x, title_y), title_text, font=title_font, fill=WHITE)

    # 4. Tagline bajo el título
    tagline_font_size = int(height * 0.15)
    tagline_font = get_font(tagline_font_size, bold=False)
    tagline_text = "Música europea 24/7"
    tagline_y = title_y + title_h + int(height * 0.02)
    # Color blanco semi-transparente
    tagline_color = (220, 230, 255, 255)
    draw.text((text_x, tagline_y), tagline_text, font=tagline_font, fill=tagline_color)

    # 5. Botón "Escucha Ahora" (derecha)
    btn_font_size = int(height * 0.22)
    btn_font = get_font(btn_font_size, bold=True)
    btn_text = "▶ Escucha Ahora"
    btn_bbox = draw.textbbox((0, 0), btn_text, font=btn_font)
    btn_text_w = btn_bbox[2] - btn_bbox[0]
    btn_text_h = btn_bbox[3] - btn_bbox[1]

    btn_padding_x = int(height * 0.18)
    btn_padding_y = int(height * 0.18)
    btn_w = btn_text_w + btn_padding_x * 2
    btn_h = btn_text_h + btn_padding_y * 2

    btn_x = width - btn_w - int(width * 0.025)
    btn_y = (height - btn_h) // 2

    # Botón blanco con esquinas redondeadas
    radius = int(btn_h * 0.3)
    draw_rounded_rect(draw, [(btn_x, btn_y), (btn_x + btn_w, btn_y + btn_h)],
                        radius, fill=WHITE)

    # Texto del botón (azul oscuro)
    btn_text_x = btn_x + (btn_w - btn_text_w) // 2
    btn_text_y = btn_y + (btn_h - btn_text_h) // 2 - int(height * 0.02)
    draw.text((btn_text_x, btn_text_y), btn_text, font=btn_font, fill=BLUE)

    # 6. Guardar
    img.save(output_path, 'PNG')
    print(f"Created: {output_path}")


def create_svg(width: int, height: int, output_path: str):
    """Crea una versión SVG escalable del banner."""

    # Coordenadas calculadas igual que en PNG
    logo_size = int(height * 0.65)
    logo_x = int(width * 0.025)
    logo_y = (height - logo_size) // 2

    text_x = logo_x + logo_size + int(width * 0.02)
    title_font_size = int(height * 0.32)
    tagline_font_size = int(height * 0.15)

    btn_text = "▶ Escucha Ahora"
    btn_font_size = int(height * 0.22)
    # Estimación de ancho del botón (aproximación)
    btn_text_w = len(btn_text) * btn_font_size * 0.55
    btn_text_h = btn_font_size
    btn_padding_x = int(height * 0.18)
    btn_padding_y = int(height * 0.18)
    btn_w = int(btn_text_w + btn_padding_x * 2)
    btn_h = int(btn_text_h + btn_padding_y * 2)
    btn_x = width - btn_w - int(width * 0.025)
    btn_y = (height - btn_h) // 2

    # Logo V coordinates (escaladas)
    scale = logo_size / 64
    v_points = [
        f"{logo_x + 18 * scale},{logo_y + 20 * scale}",
        f"{logo_x + 28 * scale},{logo_y + 20 * scale}",
        f"{logo_x + 32 * scale},{logo_y + 36 * scale}",
        f"{logo_x + 36 * scale},{logo_y + 20 * scale}",
        f"{logo_x + 46 * scale},{logo_y + 20 * scale}",
        f"{logo_x + 36 * scale},{logo_y + 48 * scale}",
        f"{logo_x + 28 * scale},{logo_y + 48 * scale}",
    ]

    svg = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="{width}" height="{height}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="{width}" height="{height}" fill="url(#bg)"/>

  <!-- V Logo -->
  <polygon points="{' '.join(v_points)}" fill="#ffffff"/>
  <circle cx="{logo_x + 50 * scale}" cy="{logo_y + 34 * scale}"
          r="{2 * scale}" fill="#ffffff" opacity="0.7"/>

  <!-- Title: Euro Voice -->
  <text x="{text_x}" y="{logo_y + 8 + title_font_size}"
        font-family="DejaVu Sans, Arial, sans-serif"
        font-size="{title_font_size}"
        font-weight="bold"
        fill="#ffffff">
    Euro Voice
  </text>

  <!-- Tagline -->
  <text x="{text_x}" y="{logo_y + 8 + title_font_size + int(height * 0.18)}"
        font-family="DejaVu Sans, Arial, sans-serif"
        font-size="{tagline_font_size}"
        fill="#dce6ff">
    Música europea 24/7
  </text>

  <!-- Button -->
  <rect x="{btn_x}" y="{btn_y}" width="{btn_w}" height="{btn_h}"
        rx="{int(btn_h * 0.3)}" ry="{int(btn_h * 0.3)}" fill="#ffffff"/>
  <text x="{btn_x + btn_w // 2}" y="{btn_y + btn_h // 2 + btn_font_size // 3}"
        font-family="DejaVu Sans, Arial, sans-serif"
        font-size="{btn_font_size}"
        font-weight="bold"
        fill="#3b82f6"
        text-anchor="middle">
    ▶ Escucha Ahora
  </text>
</svg>
'''

    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(svg)
    print(f"Created: {output_path}")


def main():
    # 1. Banner estándar 728x90 (PNG)
    create_banner(728, 90, os.path.join(OUTPUT_DIR, 'eurovoice-banner-728x90.png'))

    # 2. Banner alta resolución 1200x150 (PNG)
    create_banner(1200, 150, os.path.join(OUTPUT_DIR, 'eurovoice-banner-1200x150.png'))

    # 3. Versión SVG escalable (728x90 viewBox)
    create_svg(728, 90, os.path.join(OUTPUT_DIR, 'eurovoice-banner-728x90.svg'))

    print("\n✓ Todos los banners creados en:", OUTPUT_DIR)


if __name__ == '__main__':
    main()
