#!/usr/bin/env python3
"""
Convert favicon.svg to favicon.ico using PIL.
Since PIL doesn't natively render SVG, we'll draw the favicon programmatically
using PIL primitives — replicating the same design as the SVG version.
"""

from PIL import Image, ImageDraw
import os

def create_favicon(size: int) -> Image.Image:
    """Create the Euro Voice favicon at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background: rounded rectangle with blue-indigo gradient
    # Since PIL doesn't do gradients easily, use a solid blue with slight variation
    radius = size // 5  # ~20% rounded
    # Background color: blue-500 (#3b82f6)
    bg_color = (59, 130, 246, 255)
    # Draw rounded rectangle
    draw.rounded_rectangle([(0, 0), (size - 1, size - 1)], radius=radius, fill=bg_color)

    # Add a subtle gradient effect by drawing a darker indigo overlay on bottom-right
    indigo_overlay = (79, 70, 229, 80)  # indigo-600 with alpha
    # Draw a second rounded rectangle slightly offset for a gradient illusion
    # Simpler: just leave the solid blue

    # Draw the stylized "V" — white path
    # SVG path: M18 20 L28 20 L32 36 L36 20 L46 20 L36 48 L28 48 Z
    # Scale to the target size (original was 64x64)
    scale = size / 64
    v_points = [
        (int(18 * scale), int(20 * scale)),
        (int(28 * scale), int(20 * scale)),
        (int(32 * scale), int(36 * scale)),
        (int(36 * scale), int(20 * scale)),
        (int(46 * scale), int(20 * scale)),
        (int(36 * scale), int(48 * scale)),
        (int(28 * scale), int(48 * scale)),
    ]
    white = (255, 255, 255, 255)
    draw.polygon(v_points, fill=white)

    # Add a small dot on the right (sound wave)
    dot_radius = max(1, int(2 * scale))
    dot_x = int(50 * scale)
    dot_y = int(34 * scale)
    draw.ellipse(
        [(dot_x - dot_radius, dot_y - dot_radius), (dot_x + dot_radius, dot_y + dot_radius)],
        fill=(255, 255, 255, 180)
    )

    return img


def main():
    output_dir = '/home/z/my-project/public'
    os.makedirs(output_dir, exist_ok=True)

    # Create multiple sizes for the .ico (16, 32, 48, 64)
    sizes = [16, 32, 48, 64]
    images = [create_favicon(s) for s in sizes]

    # Save as .ico (PIL handles multi-size .ico automatically)
    ico_path = os.path.join(output_dir, 'favicon.ico')
    images[0].save(ico_path, format='ICO', sizes=[(s, s) for s in sizes], append_images=images[1:])
    print(f"Created {ico_path}")

    # Also save a 180x180 PNG for Apple touch icon
    apple = create_favicon(180)
    apple_path = os.path.join(output_dir, 'apple-touch-icon.png')
    apple.save(apple_path, format='PNG')
    print(f"Created {apple_path}")

    # Save a 32x32 PNG for legacy support
    png32 = create_favicon(32)
    png32_path = os.path.join(output_dir, 'favicon-32x32.png')
    png32.save(png32_path, format='PNG')
    print(f"Created {png32_path}")

    # Save a 192x192 PNG for Android
    png192 = create_favicon(192)
    png192_path = os.path.join(output_dir, 'android-chrome-192x192.png')
    png192.save(png192_path, format='PNG')
    print(f"Created {png192_path}")


if __name__ == '__main__':
    main()
