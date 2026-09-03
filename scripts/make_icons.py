"""Generate the PWA icon set. Run from portal/: python scripts/make_icons.py"""

from PIL import Image, ImageDraw

BG = (15, 17, 21)  # --bg #0f1115
ACCENT = (106, 166, 255)  # --accent #6aa6ff
FAR = (58, 96, 154)  # dimmed accent for the back ridge
SS = 8  # supersample factor; downsampled with LANCZOS for clean edges

OUT = "public/icons"


def ridge(size: int, inset: float, rounded: bool) -> Image.Image:
    """A two-peak mountain mark on the portal's panel background."""
    n = size * SS
    img = Image.new("RGB", (n, n), BG)
    d = ImageDraw.Draw(img)

    if rounded:
        # Rounded square keeps the mark from looking like a bare screenshot on
        # platforms that do not mask icons themselves.
        d.rounded_rectangle([0, 0, n - 1, n - 1], radius=int(n * 0.22), fill=(23, 26, 33))

    # Glyph box, centred. `inset` is the fraction of the canvas left as margin --
    # maskable icons need the mark inside the middle 80% safe zone.
    m = n * inset
    w = n - 2 * m
    top, bot = m + w * 0.14, n - m - w * 0.06

    d.polygon(
        [(m + w * 0.30, bot), (m + w * 0.70, top), (m + w * 1.00, bot)],
        fill=FAR,
    )
    d.polygon(
        [(m, bot), (m + w * 0.40, top), (m + w * 0.80, bot)],
        fill=ACCENT,
    )
    # Snow line on the front peak.
    d.polygon(
        [(m + w * 0.40, top), (m + w * 0.53, top + w * 0.26), (m + w * 0.27, top + w * 0.26)],
        fill=(214, 228, 250),
    )

    return img.resize((size, size), Image.LANCZOS)


for name, size, inset, rounded in [
    ("icon-192.png", 192, 0.16, True),
    ("icon-512.png", 512, 0.16, True),
    ("icon-maskable-512.png", 512, 0.26, False),
    ("apple-touch-icon.png", 180, 0.16, True),
]:
    ridge(size, inset, rounded).save(f"{OUT}/{name}", optimize=True)
    print(f"{OUT}/{name} {size}x{size}")
