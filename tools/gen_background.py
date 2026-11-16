"""Draws the RPG Pixel background: a starlit night road with meteors and a distant castle.

Pure standard library (no Pillow). The scene is drawn on a 320x180 pixel grid and scaled up
8x with nearest-neighbour, so every art pixel is an 8x8 block in the 2560x1440 output.

usage: python3 tools/gen_background.py [out.png] [--scale N]
"""
import random
import struct
import sys
import zlib

W, H = 320, 180

PALETTE = [
    (0x06, 0x08, 0x1e),  # 0  sky top
    (0x0a, 0x0e, 0x2e),  # 1  sky
    (0x10, 0x16, 0x42),  # 2  sky
    (0x18, 0x1f, 0x58),  # 3  sky
    (0x24, 0x27, 0x6a),  # 4  sky near horizon
    (0x35, 0x2e, 0x74),  # 5  horizon glow (violet)
    (0x4a, 0x38, 0x7c),  # 6  horizon glow (warm violet)
    (0x5c, 0x66, 0xb4),  # 7  dim star
    (0xa8, 0xb8, 0xf0),  # 8  star
    (0xf4, 0xee, 0xd6),  # 9  bright star / moon
    (0xff, 0xd8, 0x78),  # 10 gold (meteor head, windows)
    (0xe0, 0x9a, 0x5a),  # 11 meteor tail warm
    (0x8a, 0x6c, 0x9c),  # 12 meteor tail cool
    (0x1e, 0x24, 0x62),  # 13 far mountains
    (0x2a, 0x32, 0x78),  # 14 far mountain snow / rim
    (0x13, 0x18, 0x4a),  # 15 mid hills
    (0x0f, 0x13, 0x3c),  # 16 castle / trees
    (0x0b, 0x0e, 0x30),  # 17 near meadow
    (0x08, 0x0a, 0x24),  # 18 foreground
    (0x1a, 0x30, 0x5a),  # 19 grass highlight
    (0x2c, 0x3e, 0x7e),  # 20 road
    (0x3a, 0x4c, 0x90),  # 21 road edge light
    (0xd0, 0x88, 0xc8),  # 22 flower pink
    (0x7f, 0xd8, 0xc0),  # 23 flower teal
    (0xc8, 0xc2, 0xe8),  # 24 moon shade
]

BAYER = [
    [0, 8, 2, 10],
    [12, 4, 14, 6],
    [3, 11, 1, 9],
    [15, 7, 13, 5],
]

rng = random.Random(20261116)
px = bytearray(W * H)


def put(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        px[y * W + x] = c


def get(x, y):
    return px[y * W + x]


def sky():
    # Bands from top to horizon, dithered where they meet.
    stops = [(0, 0), (30, 1), (62, 2), (92, 3), (112, 4), (124, 5), (132, 6)]
    for y in range(H):
        for x in range(W):
            c = stops[0][1]
            for i in range(len(stops) - 1):
                y0, c0 = stops[i]
                y1, c1 = stops[i + 1]
                if y0 <= y < y1:
                    t = (y - y0) / (y1 - y0)
                    # Only the last 40% of each band dithers into the next one.
                    t = max(0.0, (t - 0.6) / 0.4)
                    c = c1 if t * 16 > BAYER[y % 4][x % 4] else c0
                    break
            else:
                c = stops[-1][1]
            put(x, y, c)


def stars():
    for _ in range(260):
        x, y = rng.randrange(W), rng.randrange(0, 118)
        put(x, y, 7 if rng.random() < 0.7 else 8)
    # A few four-point twinkles.
    for _ in range(9):
        x, y = rng.randrange(6, W - 6), rng.randrange(4, 80)
        put(x, y, 9)
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            put(x + dx, y + dy, 8)


def moon(cx=262, cy=30, r=11):
    for y in range(cy - r - 3, cy + r + 4):
        for x in range(cx - r - 3, cx + r + 4):
            d2 = (x - cx) ** 2 + (y - cy) ** 2
            if d2 <= r * r:
                # Crescent: cut by an offset circle.
                if (x - cx + 6) ** 2 + (y - cy + 3) ** 2 > (r - 1) ** 2:
                    put(x, y, 9)
                else:
                    put(x, y, get(x, y))
            elif d2 <= (r + 2) ** 2 and BAYER[y % 4][x % 4] < 4:
                put(x, y, 4)  # faint halo
    # Shade on the inner edge of the crescent.
    for y in range(cy - r, cy + r + 1):
        for x in range(cx - r, cx + r + 1):
            if get(x, y) == 9:
                if (x - cx + 6) ** 2 + (y - cy + 3) ** 2 <= (r + 1) ** 2:
                    put(x, y, 24)


def meteor(x0, y0, length):
    # Starts at (x0, y0) and falls down and to the left on a 2:1 slope; the head is the
    # lower-left end, the tail fades back toward the start.
    for i in range(length):
        x, y = x0 - i * 2, y0 + i
        from_head = length - 1 - i
        t = from_head / length
        c = 10 if from_head < 2 else (9 if from_head < 4 else (11 if t < 0.45 else 12))
        put(x, y, c)
        if from_head < 6:
            put(x - 1, y, c)
    hx, hy = x0 - (length - 1) * 2, y0 + length - 1
    put(hx - 2, hy + 1, 9)


def ridge(base, amp, rough, color, rim=None, seed=0):
    r = random.Random(seed)
    h = base
    heights = []
    for x in range(W):
        h += r.uniform(-rough, rough)
        h = max(base - amp, min(base + amp, h))
        heights.append(int(h))
    # Smooth once so the silhouette reads as hills, not noise.
    sm = [heights[0]] + [
        (heights[i - 1] + heights[i] * 2 + heights[i + 1]) // 4 for i in range(1, W - 1)
    ] + [heights[-1]]
    for x, top in enumerate(sm):
        for y in range(top, H):
            put(x, y, color)
        if rim is not None:
            put(x, top, rim)
    return sm


def mountains():
    # Far range with a few sharp peaks.
    peaks = [(40, 96), (98, 88), (150, 100), (210, 92), (290, 98)]
    for x in range(W):
        top = 140
        for px_, py in peaks:
            top = min(top, py + abs(x - px_) * 0.8)
        top = int(top + rng.choice((0, 0, 1)))
        for y in range(top, H):
            put(x, y, 13)
        # Snow caps near the summits.
        for px_, py in peaks:
            if abs(x - px_) < 6 and top < py + 6:
                put(x, top, 14)
                if abs(x - px_) < 3:
                    put(x, top + 1, 14)


def castle(cx=236, ground=124):
    def rect(x0, y0, x1, y1, c=16):
        for y in range(y0, y1):
            for x in range(x0, x1):
                put(x, y, c)

    def battlements(x0, x1, y):
        for x in range(x0, x1, 2):
            put(x, y - 1, 16)

    # Curtain wall.
    rect(cx - 22, ground - 10, cx + 24, ground)
    battlements(cx - 22, cx + 24, ground - 10)
    # Side towers.
    for tx in (cx - 24, cx + 20):
        rect(tx, ground - 18, tx + 6, ground)
        battlements(tx, tx + 6, ground - 18)
    # Keep with a pointed roof.
    rect(cx - 6, ground - 26, cx + 6, ground)
    for i in range(9):
        rect(cx - 6 + i * 2 // 3, ground - 26 - i, cx + 6 - i * 2 // 3, ground - 25 - i)
    put(cx, ground - 36, 16)
    put(cx, ground - 37, 16)
    # Spire flag.
    put(cx + 1, ground - 37, 10)
    # Lit windows.
    for wx, wy in ((cx - 2, ground - 20), (cx + 2, ground - 20), (cx - 21, ground - 13),
                   (cx + 22, ground - 13), (cx - 12, ground - 6), (cx + 10, ground - 6),
                   (cx, ground - 14)):
        put(wx, wy, 10)


def pine(x, base, h, c=16):
    for i in range(h):
        half = (h - i) // 3
        for dx in range(-half, half + 1):
            put(x + dx, base - i, c)
    put(x, base - h, c)


def trees():
    for x in range(4, 120, 5):
        pine(x + rng.randrange(-1, 2), 138 + rng.randrange(-2, 3), rng.randrange(8, 15))
    for x in range(282, 318, 6):
        pine(x, 140 + rng.randrange(-2, 2), rng.randrange(7, 12))


def road():
    # A path that widens toward the viewer and bends to the left.
    for y in range(136, H):
        t = (y - 136) / (H - 136)
        center = int(200 - t * 70 - (t ** 2) * 30)
        half = int(2 + t * 26)
        for x in range(center - half, center + half + 1):
            edge = abs(x - center) >= half - 1
            put(x, y, 21 if edge and BAYER[y % 4][x % 4] < 8 else 20)


def meadow_details():
    # Sparse on purpose: terminal text sits over this part of the window.
    for _ in range(160):
        x, y = rng.randrange(W), rng.randrange(140, H)
        if get(x, y) in (17, 18):
            put(x, y, 19)
            if rng.random() < 0.3:
                put(x, y - 1, 19)
    for _ in range(24):
        x, y = rng.randrange(W), rng.randrange(150, H)
        if get(x, y) in (17, 18, 19):
            put(x, y, rng.choice((10, 22, 23, 9)))
    # Fireflies above the meadow.
    for _ in range(14):
        x, y = rng.randrange(W), rng.randrange(128, 160)
        if get(x, y) not in (20, 21):
            put(x, y, 10)


def draw():
    sky()
    stars()
    moon()
    for x0, y0, n in ((226, 6, 20), (170, 30, 14), (120, 4, 26), (70, 40, 10), (310, 50, 12)):
        meteor(x0, y0, n)
    mountains()
    ridge(128, 6, 1.2, 15, seed=3)
    castle()
    trees()
    ridge(142, 4, 0.9, 17, seed=7)
    ridge(158, 3, 0.7, 18, seed=11)
    road()
    meadow_details()


def write_png(path, scale):
    out_w, out_h = W * scale, H * scale
    raw = bytearray()
    for y in range(H):
        row = bytearray([0])  # filter: none
        for x in range(W):
            row += bytes([px[y * W + x]]) * scale
        raw += bytes(row) * scale

    def chunk(kind, data):
        return (struct.pack(">I", len(data)) + kind + data
                + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF))

    png = b"\x89PNG\r\n\x1a\n"
    png += chunk(b"IHDR", struct.pack(">IIBBBBB", out_w, out_h, 8, 3, 0, 0, 0))
    png += chunk(b"PLTE", b"".join(bytes(c) for c in PALETTE))
    png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    png += chunk(b"IEND", b"")
    with open(path, "wb") as f:
        f.write(png)


if __name__ == "__main__":
    args = sys.argv[1:]
    scale = 8
    if "--scale" in args:
        i = args.index("--scale")
        scale = int(args[i + 1])
        del args[i:i + 2]
    out = args[0] if args else "images/starlit-road.png"
    draw()
    write_png(out, scale)
    print(f"wrote {out} ({W * scale}x{H * scale})")
