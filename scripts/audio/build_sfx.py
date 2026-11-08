#!/usr/bin/env python3
"""
Build the runtime sound-effect set from CC0 Freesound recordings.

    python3 scripts/audio/build_sfx.py --download   # fetch previews listed in sources.json into .raw/
    python3 scripts/audio/build_sfx.py              # slice / trim / normalise / encode into src/audio/samples/

Requires ffmpeg and numpy. Development-time only: nothing here runs in the
browser and the scripts/ folder is excluded from the Docker build context.
"""
import json, os, subprocess, sys, urllib.request
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))
RAW = os.path.join(HERE, ".raw")
OUT = os.path.join(ROOT, "src", "audio", "samples")
MANIFEST = os.path.join(ROOT, "src", "audio", "sfxManifest.ts")
SR = 44100
SOURCES = json.load(open(os.path.join(HERE, "sources.json")))

# ------------------------------------------------------------------ io
def load(key, stereo=False):
    p = os.path.join(RAW, key + ".mp3")
    ch = 2 if stereo else 1
    raw = subprocess.run(["ffmpeg", "-v", "quiet", "-i", p, "-ac", str(ch), "-ar", str(SR), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, np.float32).astype(np.float64)
    return x.reshape(-1, 2) if stereo else x

def write(name, x, stereo=False, kbps=None):
    os.makedirs(OUT, exist_ok=True)
    ch = 2 if stereo else 1
    kbps = kbps or (128 if stereo else 96)
    data = np.clip(x, -1, 1).astype(np.float32).tobytes()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", str(ch), "-i", "-",
                    "-codec:a", "libmp3lame", "-b:a", f"{kbps}k", os.path.join(OUT, name + ".mp3")],
                   input=data, check=True)

# ------------------------------------------------------------------ dsp
def mono(x): return x if x.ndim == 1 else x.mean(axis=1)
def seg(x, a, b): return x[int(a * SR):int(b * SR)]
def db(v): return 20 * np.log10(np.maximum(v, 1e-9))

def highpass(x, hz=40):
    # one-pole DC/rumble removal
    a = np.exp(-2 * np.pi * hz / SR); y = np.empty_like(x); prev_x = 0.0; prev_y = 0.0
    xs = x if x.ndim == 1 else x
    if x.ndim == 2: return np.stack([highpass(x[:, 0], hz), highpass(x[:, 1], hz)], axis=1)
    for i in range(len(xs)):
        prev_y = a * (prev_y + xs[i] - prev_x); prev_x = xs[i]; y[i] = prev_y
    return y

def fade(x, fin=0.004, fout=0.03):
    x = x.copy(); n = len(x)
    i = min(int(fin * SR), n // 2); o = min(int(fout * SR), n // 2)
    if i: x[:i] = (x[:i].T * np.linspace(0, 1, i)).T
    if o: x[-o:] = (x[-o:].T * np.linspace(1, 0, o) ** 2).T
    return x

def peak_norm(x, target_db=-3.0):
    p = np.max(np.abs(x)); return x * (10 ** (target_db / 20) / p) if p > 0 else x

def rms_norm(x, target_db=-20.0, ceiling_db=-3.5):
    r = np.sqrt(np.mean(x ** 2)); y = x * (10 ** (target_db / 20) / r)
    p = np.max(np.abs(y)); c = 10 ** (ceiling_db / 20)
    return y * (c / p) if p > c else y

def frames_db(x, hop=0.005):
    h = int(SR * hop); m = mono(x); n = len(m) // h
    fr = m[:n * h].reshape(n, h); return db(np.sqrt(np.mean(fr ** 2, axis=1))), hop

def onsets(x, rise=8.0, rel=-22.0, gap=0.16):
    d, hop = frames_db(x); top = np.percentile(d, 99.5); thr = top + rel
    out = []; last = -9
    for i in range(4, len(d)):
        if d[i] > thr and d[i] - d[i - 4] > rise and (i * hop - last) > gap:
            j = i - 4
            while j > 0 and d[j - 1] < d[j]: j -= 1  # back to the local minimum before the attack
            out.append(max(0, j * hop - 0.004)); last = i * hop
    return out

def regions(x, rel=-26.0, min_len=0.12, merge=0.10):
    d, hop = frames_db(x); thr = np.percentile(d, 99.5) + rel
    on = d > thr; out = []; s = None
    for i, v in enumerate(on):
        if v and s is None: s = i
        if not v and s is not None: out.append([s * hop, i * hop]); s = None
    if s is not None: out.append([s * hop, len(on) * hop])
    merged = []
    for r in out:
        if merged and r[0] - merged[-1][1] < merge: merged[-1][1] = r[1]
        else: merged.append(r)
    return [(a, b) for a, b in merged if b - a >= min_len]

def best(slices, n):
    """keep the n slices with the strongest, cleanest attack (but preserve time order)"""
    scored = sorted(slices, key=lambda s: -np.max(np.abs(s[1])))[:n]
    return [s[1] for s in sorted(scored, key=lambda s: s[0])]

def one_shots(key, n, length, a=0, b=None, rel=-22, rise=8, gap=0.16, tail=0.05, src=None):
    x = src if src is not None else highpass(load(key))
    x = seg(x, a, b if b else len(x) / SR)
    sl = [(t, x[int(t * SR):int((t + length) * SR)]) for t in onsets(x, rise=rise, rel=rel, gap=gap)]
    sl = [(t, s) for t, s in sl if len(s) > length * SR * 0.6]
    return [peak_norm(fade(s, 0.002, tail)) for s in best(sl, n)]

def region_shots(key, n, a=0, b=None, rel=-26, min_len=0.12, maxlen=1.6, pad=0.03, src=None):
    x = src if src is not None else highpass(load(key))
    x = seg(x, a, b if b else len(x) / SR)
    rs = regions(x, rel=rel, min_len=min_len)
    sl = [(r0, x[max(0, int((r0 - pad) * SR)):int(min(r1 + pad * 3, r0 + maxlen) * SR)]) for r0, r1 in rs]
    return [peak_norm(fade(s, 0.006, 0.08)) for s in best(sl, n)]

def seamless(x, length, xfade=0.35):
    """period-`length` loop baked with an equal-power crossfade; padded with
    wrap-around content so decoder delay never lands on a seam."""
    L = int(length * SR); X = int(xfade * SR)
    body = x[:L].copy(); tail = x[L:L + X]
    t = np.linspace(0, np.pi / 2, X)
    w_in, w_out = np.sin(t), np.cos(t)
    if x.ndim == 2: w_in, w_out = w_in[:, None], w_out[:, None]
    body[:X] = body[:X] * w_in + tail * w_out
    pre = int(0.2 * SR); post = int(0.3 * SR)
    padded = np.concatenate([body[-pre:], body, body[:post]], axis=0)
    return padded, 0.2, 0.2 + length

# ------------------------------------------------------------------ the set
manifest = {}
def add(name, xs, stereo=False, loop=None):
    files = []
    for i, x in enumerate(xs if isinstance(xs, list) else [xs]):
        fn = f"{name}_{i + 1}" if isinstance(xs, list) and len(xs) > 1 else name
        write(fn, x, stereo=stereo); files.append(fn)
    manifest[name] = {"files": files, **({"loop": loop} if loop else {})}
    print(f"  {name:16} x{len(files)}" + (f"  loop {loop[0]:.2f}-{loop[1]:.2f}s" if loop else ""))

def add_loop(name, key, a, length, target=-20, stereo=True, hp=60):
    x = highpass(load(key, stereo=stereo), hp)
    x = seg(x, a, a + length + 0.5)
    y, ls, le = seamless(x, length)
    add(name, rms_norm(y, target), stereo=stereo, loop=[ls, le])

def build():
    for f in os.listdir(OUT) if os.path.isdir(OUT) else []:
        if f.endswith(".mp3"): os.remove(os.path.join(OUT, f))
    print("loops")
    add_loop("loop_cart_rattle", "cart_rattle", 12.0, 6.0)
    add_loop("loop_cart_wheels", "cart_wheels", 6.0, 6.0, target=-28)
    add_loop("loop_case_wheels", "luggage_wheels", 4.0, 6.0)
    add_loop("loop_office", "office_tone", 30.0, 16.0, target=-30)
    print("scene 1 · cart")
    add("step_sneaker", one_shots("steps_sneaker", 6, 0.32, rel=-30))
    add("box_shift", one_shots("cardboard", 4, 0.55, rel=-26))
    add("cart_jolt", region_shots("cart_rattle", 3, a=44, b=53.5, rel=-14, maxlen=0.9))
    print("scene 2 · beam")
    add("step_work", one_shots("steps_concrete", 6, 0.36, rel=-32))
    add("wood_creak", one_shots("wood_creak_single", 1, 1.15, rel=-30, tail=0.25) + one_shots("wood_creak_obj", 4, 0.55, rel=-20, gap=0.4, tail=0.15))
    add("wood_rub", [peak_norm(fade(seg(highpass(load("wood_scrape")), 0.42, 2.2), 0.08, 0.5)),
                     peak_norm(fade(seg(highpass(load("wood_scrape")), 2.2, 4.0), 0.08, 0.5))])
    add("cloth", region_shots("cloth_rustle", 2, rel=-24, maxlen=1.0) + region_shots("clothes_rustling", 2, rel=-22, maxlen=0.7))
    add("breath_m", region_shots("breath_run", 5, a=3, b=26, rel=-14, min_len=0.18, maxlen=0.7))
    print("scene 3 · desk")
    add("key", one_shots("keyboard", 10, 0.11, rel=-16, gap=0.1, tail=0.03))
    add("typing", [peak_norm(fade(seg(highpass(load("keyboard")), a, a + 1.6), 0.01, 0.25)) for a in (0.9, 7.0, 12.0)])
    add("mouse", one_shots("mouse_clicks", 3, 0.12, rel=-24, tail=0.03))
    add("chair", region_shots("chair_creak", 2, rel=-18, min_len=0.25, maxlen=1.4))
    add("mug", one_shots("mug", 3, 0.6, rel=-26, gap=0.8, tail=0.3))
    add("paper", region_shots("paper", 2, rel=-22, min_len=0.25, maxlen=1.0))
    print("scene 4 · stairs")
    add("step_stair", one_shots("stairs", 5, 0.4, rel=-26, gap=0.3))
    add("bag", region_shots("handbag", 2, rel=-26, min_len=0.06, maxlen=0.5))
    add("breath_f", region_shots("breath_woman", 4, rel=-16, min_len=0.25, maxlen=1.2))
    print("scene 5 · suitcase")
    add("step_boot", one_shots("steps_boots", 6, 0.34, rel=-22, gap=0.3))
    add("case_bump", one_shots("luggage_wheels", 4, 0.3, a=12.5, b=24, rel=-14, gap=0.25))
    add("handle", one_shots("suitcase_handling", 4, 0.45, rel=-18, gap=1.0, tail=0.12))
    add("coat", region_shots("fabric_pull", 3, rel=-22, min_len=0.2, maxlen=1.0))
    print("scene 6 · wardrobe")
    add("squeak", one_shots("sneaker_squeak", 4, 0.45, rel=-16, gap=0.4, tail=0.1))
    add("creak_deep", region_shots("armoire_creak", 4, rel=-14, min_len=0.35, maxlen=1.6))
    add("cabinet_rattle", one_shots("wardrobe_noisy", 4, 0.32, a=9, b=18, rel=-16, gap=0.25, tail=0.1))
    add("strain", region_shots("straining", 3, rel=-18, min_len=0.3, maxlen=1.4))
    print("interface")
    add("whoosh_short", peak_norm(fade(highpass(load("whoosh_short")), 0.01, 0.12)))
    add("whoosh_air", peak_norm(fade(seg(highpass(load("whoosh_light")), 0.2, 2.1), 0.05, 0.6)))
    add("whoosh_quick", peak_norm(fade(seg(highpass(load("woosh_quick")), 0.15, 1.0), 0.01, 0.3)))
    add("title_boom", peak_norm(fade(seg(highpass(load("boom"), 25), 0, 4.5), 0.003, 1.8)))
    add("btn", one_shots("wood_button", 2, 0.22, rel=-30, gap=0.5, tail=0.06))
    add("tick", peak_norm(fade(load("click"), 0.001, 0.02)))
    add("kalimba", peak_norm(fade(seg(load("kalimba"), 0.03, 2.6), 0.002, 0.9)))
    add("shimmer", peak_norm(fade(seg(highpass(load("chimes_soft"), 200), 0.7, 5.0), 0.05, 1.8)))
    add("woodblock", peak_norm(fade(load("woodblock"), 0.001, 0.12)))
    add("page", peak_norm(fade(seg(highpass(load("page_turn")), 0.05, 0.75), 0.004, 0.2)))
    add("sparkle", peak_norm(fade(seg(highpass(load("windchime"), 300), 0.0, 2.4), 0.003, 1.0)))

    with open(MANIFEST, "w") as f:
        f.write("// Generated by scripts/audio/build_sfx.py: do not edit by hand.\n")
        f.write("// Each entry lists its variant files (src/audio/samples/<file>.mp3); loops carry seamless loop points in seconds.\n")
        f.write("export const SFX_MANIFEST = " + json.dumps(manifest, indent=2) + " as const;\n")
        f.write("export type SfxName = keyof typeof SFX_MANIFEST;\n")
    total = sum(os.path.getsize(os.path.join(OUT, x)) for x in os.listdir(OUT))
    print(f"{len(os.listdir(OUT))} files, {total/1024:.0f} KiB")

def download():
    os.makedirs(RAW, exist_ok=True)
    for key, m in SOURCES.items():
        p = os.path.join(RAW, key + ".mp3")
        if os.path.exists(p): continue
        req = urllib.request.Request(m["preview"], headers={"User-Agent": "work-physics-asset-build"})
        open(p, "wb").write(urllib.request.urlopen(req, timeout=30).read()); print("downloaded", key)

if __name__ == "__main__":
    if "--download" in sys.argv: download()
    else: build()
