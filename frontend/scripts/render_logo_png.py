"""Render Habi Knot logo PNGs with Pillow (supersampled, no native cairo needed)."""
from PIL import Image, ImageDraw
import os

BASE = r'C:\xampp\htdocs\bayan-box\frontend\public'
SS = 4  # supersample factor for anti-aliasing

INK = (18, 17, 29, 255)       # #12111d
PURPLE = (103, 61, 230, 255)  # #673de6
AMBER = (245, 158, 11, 255)   # #f59e0b
AMBER_L = (251, 191, 36, 255) # #fbbf24
WHITE = (255, 255, 255, 255)


def draw_mark(d, size, scale, cx=0.5, cy=0.5, strand=INK, diag=PURPLE, eye=AMBER, eye_stroke=INK):
    """Draw Habi Knot centered at (cx,cy) fraction of size."""
    c_x, c_y = size * cx, size * cy
    u = size / 64.0  # unit = pixels per viewBox unit
    w = max(1, round(9 * u * scale))
    # vertical strand
    d.line([(c_x + 0 * u, c_y - 27 * u), (c_x + 0 * u, c_y + 27 * u)], fill=strand, width=w)
    # diagonal strands
    d.line([(c_x - 23.5 * u, c_y - 13.5 * u), (c_x + 23.5 * u, c_y + 13.5 * u)], fill=diag, width=w)
    d.line([(c_x + 23.5 * u, c_y - 13.5 * u), (c_x - 23.5 * u, c_y + 13.5 * u)], fill=diag, width=w)
    # diamond eye: square 12x12 rotated 45 deg -> vertices at radius 6*sqrt(2)
    r = 6 * 1.4142135623730951 * u
    pts = [
        (c_x, c_y - r), (c_x + r, c_y), (c_x, c_y + r), (c_x - r, c_y),
    ]
    d.polygon(pts, fill=eye)
    # outline eye
    ow = max(1, round(1.5 * u * scale))
    d.line(pts + [pts[0]], fill=eye_stroke, width=ow)


def render_tile(out, px):
    """Purple gradient squircle + white mark + amber eye."""
    S = px * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    # diagonal gradient #5633c4 -> #8058ee
    c1 = (86, 51, 196, 255)   # #5633c4
    c2 = (128, 88, 238, 255)  # #8058ee
    grad = Image.new('RGB', (S, S))
    gp = grad.load()
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * (S - 1))
            t = max(0.0, min(1.0, t))
            gp[x, y] = (int(c1[0] + (c2[0] - c1[0]) * t),
                        int(c1[1] + (c2[1] - c1[1]) * t),
                        int(c1[2] + (c2[2] - c1[2]) * t))
    grad = grad.convert('RGBA')
    # rounded rect mask (rx ~ 115/512)
    mask = Image.new('L', (S, S), 0)
    md = ImageDraw.Draw(mask)
    rx = int(S * 115 / 512)
    md.rounded_rectangle([0, 0, S - 1, S - 1], radius=rx, fill=255)
    img.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(img)
    draw_mark(d, S, 1.0, strand=WHITE, diag=WHITE, eye=AMBER_L, eye_stroke=WHITE)
    img = img.resize((px, px), Image.LANCZOS)
    img.save(os.path.join(BASE, out))
    print('OK', out, os.path.getsize(os.path.join(BASE, out)))


def render_mark(out, px, bg=True):
    """Full-color mark (transparent bg unless bg=True -> white canvas)."""
    S = px * SS
    img = Image.new('RGBA', (S, S), (255, 255, 255, 0) if not bg else (255, 255, 255, 255))
    d = ImageDraw.Draw(img)
    draw_mark(d, S, 1.0)
    img = img.resize((px, px), Image.LANCZOS)
    img.save(os.path.join(BASE, out))
    print('OK', out, os.path.getsize(os.path.join(BASE, out)))


render_tile('bayan-tile-512.png', 512)
render_tile('bayan-tile-192.png', 192)
render_mark('bayan-mark-64x64.png', 64)
render_mark('bayan-icon-32.png', 32)
print('DONE')
