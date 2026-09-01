"""Render HABI (Habing ng Bayan) logo concept + app icons with Pillow.

Outputs:
  logo/habi-logo-concept.png     # concept sheet (mark + wordmark + tagline + variants)
  logo/habi-lockup.png           # horizontal lockup on white
  logo/habi-lockup-white.png     # white lockup on transparent (dark backgrounds)
  logo/habi-mark-transparent.png # full-color knot on transparent
  frontend/public/habi-icon-512.png / -192 / -64 / -32  # PWA icons

Run:  python frontend/scripts/habi_logo.py
"""
from PIL import Image, ImageDraw, ImageFont
import math
import os

BASE = r'C:\xampp\htdocs\bayan-box'
SS = 4  # supersample factor for anti-aliasing

INK = (18, 17, 29, 255)        # #12111d
PURPLE = (103, 61, 230, 255)   # #673de6
PURPLE_D = (86, 51, 196, 255)  # #5633c4
PURPLE_L = (128, 88, 238, 255) # #8058ee
AMBER = (245, 158, 11, 255)    # #f59e0b
AMBER_L = (251, 191, 36, 255)  # #fbbf24
WHITE = (255, 255, 255, 255)
GRAY = (117, 117, 125, 255)

TAGLINE = 'HABING NG BAYAN'


def load_font(px):
    """Wordmark font: DM Sans 900 ideal, Segoe UI Bold as system fallback."""
    for cand in (r'C:\Windows\Fonts\segoeuib.ttf', r'C:\Windows\Fonts\arialbd.ttf'):
        if os.path.exists(cand):
            return ImageFont.truetype(cand, px)
    return ImageFont.load_default()


def _cap(d, x, y, radius, color):
    """Round line cap (Pillow lines have flat caps)."""
    r = max(1, round(radius / 2))
    d.ellipse([x - r, y - r, x + r, y + r], fill=color)


def draw_mark(d, size, scale, cx=0.5, cy=0.5, strand=INK, diag=PURPLE, eye=AMBER, eye_stroke=INK, caps=True):
    """Draw the Habi Knot centered at (cx,cy) fraction of size.

    Geometry mirrors logo/bayan-lockup.svg (64-unit viewBox):
      vertical strand, two diagonal strands, rounded diamond eye.
    """
    c_x, c_y = size * cx, size * cy
    u = size / 64.0
    w = max(1, round(9 * u * scale))
    r_cap = w / 2

    strands = [
        (c_x, c_y - 27 * u, c_x, c_y + 27 * u, strand),
        (c_x - 23.5 * u, c_y - 13.5 * u, c_x + 23.5 * u, c_y + 13.5 * u, diag),
        (c_x + 23.5 * u, c_y - 13.5 * u, c_x - 23.5 * u, c_y + 13.5 * u, diag),
    ]
    for x1, y1, x2, y2, color in strands:
        d.line([(x1, y1), (x2, y2)], fill=color, width=w)
        if caps:
            _cap(d, x1, y1, r_cap, color)
            _cap(d, x2, y2, r_cap, color)

    # Diamond "suki" eye: 12x12 square rotated 45 deg
    r = 6 * math.sqrt(2) * u
    pts = [(c_x, c_y - r), (c_x + r, c_y), (c_x, c_y + r), (c_x - r, c_y)]
    d.polygon(pts, fill=eye)
    ow = max(1, round(1.5 * u * scale))
    d.line(pts + [pts[0]], fill=eye_stroke, width=ow)


def rounded_tile(size, c1=PURPLE_D, c2=PURPLE_L):
    """Purple gradient squircle tile (same size as input), RGBA."""
    grad = Image.new('RGB', (size, size))
    gp = grad.load()
    for y in range(size):
        for x in range(size):
            t = min(1.0, max(0.0, (x + y) / (2 * (size - 1))))
            gp[x, y] = (int(c1[0] + (c2[0] - c1[0]) * t),
                        int(c1[1] + (c2[1] - c1[1]) * t),
                        int(c1[2] + (c2[2] - c1[2]) * t))
    grad = grad.convert('RGBA')
    mask = Image.new('L', (size, size), 0)
    md = ImageDraw.Draw(mask)
    md.rounded_rectangle([0, 0, size - 1, size - 1], radius=int(size * 115 / 512), fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


# ─────────────────────────── Renderers ───────────────────────────
# Every renderer works at supersampled resolution internally, then downscales.

def render_icon(out_path, px):
    """App icon: purple gradient squircle + white knot + amber eye."""
    S = px * SS
    img = rounded_tile(S)
    d = ImageDraw.Draw(img)
    draw_mark(d, S, 1.0, strand=WHITE, diag=WHITE, eye=AMBER_L, eye_stroke=WHITE)
    img = img.resize((px, px), Image.LANCZOS)
    img.save(out_path)
    print('OK', out_path, os.path.getsize(out_path))


def render_mark_transparent(out_path, px=512):
    """Full-color knot on transparent background."""
    S = px * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    draw_mark(d, S, 1.0)
    img = img.resize((px, px), Image.LANCZOS)
    img.save(out_path)
    print('OK', out_path, os.path.getsize(out_path))


def render_lockup(out_path, px_w=1400, dark_text=True, bg=None):
    """Horizontal lockup: knot mark + 'habi' wordmark + tagline.

    All layout is done in supersampled space, then downscaled for AA.
    """
    W = px_w * SS               # supersampled width
    H = int(W * 0.42)           # supersampled height
    mark = int(H * 0.52)        # knot mark size (square)
    text_color = INK if dark_text else WHITE

    font_word = load_font(int(H * 0.16))
    font_tag = load_font(int(H * 0.045))

    img = Image.new('RGBA', (W, H), (0, 0, 0, 0) if bg is None else bg)
    d = ImageDraw.Draw(img)
    cy = H // 2

    # Knot mark (full color) on the left
    mark_img = Image.new('RGBA', (mark, mark), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark_img), mark, 1.0, strand=text_color,
              diag=PURPLE if dark_text else WHITE, eye=AMBER, eye_stroke=text_color)
    img.alpha_composite(mark_img, (int(W * 0.07), int(cy - mark / 2)))

    # Wordmark 'habi' (vertically centered on the mark)
    word_x = int(W * 0.07) + mark + int(mark * 0.22)
    word = 'habi'
    bbox = d.textbbox((0, 0), word, font=font_word)
    d.text((word_x, int(cy - (bbox[3] - bbox[1]) / 2 - bbox[1])), word, font=font_word, fill=text_color)

    # Tagline below wordmark
    tag_y = int(cy + mark * 0.18)
    letter_sp = int(mark * 0.045)
    tx = word_x
    for ch in TAGLINE:
        d.text((tx, tag_y), ch, font=font_tag, fill=PURPLE if dark_text else WHITE)
        tx += d.textlength(ch, font=font_tag) + letter_sp

    img = img.resize((px_w, int(H / SS)), Image.LANCZOS)
    if bg is not None:
        flat = Image.new('RGB', img.size, bg[:3])
        flat.paste(img, (0, 0), img)
        img = flat
    img.save(out_path)
    print('OK', out_path, os.path.getsize(out_path))


def render_concept_sheet(out_path, px_w=1800):
    """Concept sheet: lockup + icon variants on clean background."""
    W = px_w * SS               # supersampled width
    H = int(W * 0.62)           # supersampled height
    sheet = Image.new('RGBA', (W, H), (247, 247, 248, 255))
    d = ImageDraw.Draw(sheet)

    # Centered lockup (dark text)
    mark_px = int(W * 0.16)
    mark = Image.new('RGBA', (mark_px, mark_px), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark), mark_px, 1.0)

    font_word = load_font(int(W * 0.085))
    font_tag = load_font(int(W * 0.020))

    ly = int(H * 0.14)
    lx = int(W * 0.08)
    sheet.alpha_composite(mark, (lx, ly))

    wx = lx + mark_px + int(mark_px * 0.25)
    wy = ly + int(mark_px * 0.30)
    d.text((wx, wy), 'habi', font=font_word, fill=INK)
    tag = TAGLINE
    tx = wx + int(W * 0.004)
    ty = wy + int(W * 0.088)
    for ch in tag:
        d.text((tx, ty), ch, font=font_tag, fill=PURPLE)
        tx += d.textlength(ch, font=font_tag) + int(W * 0.006)

    d.line([(int(W * 0.08), int(H * 0.52)), (int(W * 0.92), int(H * 0.52))],
           fill=(224, 224, 227, 255), width=max(1, int(SS)))

    # Variant row: icon tile / ink mark / white-on-purple / note
    vsize = int(W * 0.15)
    vy = int(H * 0.60)
    vx = int(W * 0.08)
    gap = int(W * 0.03)

    tile = rounded_tile(vsize)
    td = ImageDraw.Draw(tile)
    draw_mark(td, vsize, 1.0, strand=WHITE, diag=WHITE, eye=AMBER_L, eye_stroke=WHITE)
    sheet.alpha_composite(tile, (vx, vy))

    mark2 = Image.new('RGBA', (vsize, vsize), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(mark2), vsize, 1.0)
    sheet.alpha_composite(mark2, (vx + vsize + gap, vy))

    purple_flat = Image.new('RGBA', (vsize, vsize), PURPLE)
    pm = Image.new('RGBA', (vsize, vsize), (0, 0, 0, 0))
    draw_mark(ImageDraw.Draw(pm), vsize, 1.0, strand=WHITE, diag=WHITE, eye=AMBER_L, eye_stroke=WHITE)
    purple_flat.alpha_composite(pm)
    sheet.alpha_composite(purple_flat, (vx + 2 * (vsize + gap), vy))

    font_note = load_font(int(W * 0.014))
    d.text((vx, vy + vsize + int(W * 0.02)),
           'Habi Knot — three strands: merchant / rider / customer. Amber eye: the suki.',
           font=font_note, fill=GRAY)

    sheet = sheet.resize((px_w, int(H / SS)), Image.LANCZOS).convert('RGB')
    sheet.save(out_path)
    print('OK', out_path, os.path.getsize(out_path))


if __name__ == '__main__':
    os.makedirs(os.path.join(BASE, 'logo'), exist_ok=True)
    os.makedirs(os.path.join(BASE, 'frontend', 'public'), exist_ok=True)

    render_concept_sheet(os.path.join(BASE, 'logo', 'habi-logo-concept.png'), 1800)
    render_lockup(os.path.join(BASE, 'logo', 'habi-lockup.png'), 1400, dark_text=True, bg=(255, 255, 255, 255))
    render_lockup(os.path.join(BASE, 'logo', 'habi-lockup-white.png'), 1400, dark_text=False)
    render_mark_transparent(os.path.join(BASE, 'logo', 'habi-mark-transparent.png'))

    render_icon(os.path.join(BASE, 'frontend', 'public', 'habi-icon-512.png'), 512)
    render_icon(os.path.join(BASE, 'frontend', 'public', 'habi-icon-192.png'), 192)
    render_icon(os.path.join(BASE, 'frontend', 'public', 'habi-icon-64.png'), 64)
    render_icon(os.path.join(BASE, 'frontend', 'public', 'habi-icon-32.png'), 32)
