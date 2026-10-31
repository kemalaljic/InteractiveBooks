#!/usr/bin/env python3
"""
Synthesize PLACEHOLDER nature sounds so every page is playable before real recordings exist.
Writes WAVs to raw-audio/_placeholder/{sfx,narration,ambient}/, which
scripts/make-placeholder-audio.sh then runs through the normal normalize pipeline.

Replace these with real recordings (see docs/SOUND-LIST.md). Requires numpy.

Ambient beds are built so they loop seamlessly: noise is shaped in the frequency domain
(inherently circular) and every event is placed with wrap-around.
"""
import os
import wave

import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'raw-audio', '_placeholder')
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- helpers
def t_axis(dur):
    return np.arange(int(dur * SR)) / SR


def write(cat, name, x):
    """x: (n,) mono or (n, 2) stereo float in -1..1"""
    os.makedirs(os.path.join(OUT, cat), exist_ok=True)
    x = np.asarray(x, dtype=np.float64)
    peak = np.max(np.abs(x)) or 1.0
    x = x / peak * 0.9
    ch = 1 if x.ndim == 1 else 2
    data = (x * 32767).astype('<i2').tobytes()
    with wave.open(os.path.join(OUT, cat, f'{name}.wav'), 'wb') as w:
        w.setnchannels(ch)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(data)


def shaped_noise(n, shape):
    """Circular noise with spectral magnitude shape(freqs). Loops seamlessly."""
    spec = np.fft.rfft(rng.standard_normal(n))
    f = np.fft.rfftfreq(n, 1 / SR)
    spec *= shape(np.maximum(f, 1e-3))
    y = np.fft.irfft(spec, n)
    return y / (np.std(y) + 1e-12)


def band(lo, hi, slope=2):
    return lambda f: 1 / (1 + (lo / f) ** (2 * slope)) ** 0.5 / (1 + (f / hi) ** (2 * slope)) ** 0.5


def filt(x, shape):
    """Zero-phase FFT filter (circular)."""
    n = len(x)
    f = np.fft.rfftfreq(n, 1 / SR)
    return np.fft.irfft(np.fft.rfft(x) * shape(np.maximum(f, 1e-3)), n)


def reverb(x, seconds=1.2, mix=0.35, circular=False):
    n = int(seconds * SR)
    ir = rng.standard_normal(n) * np.exp(-np.arange(n) / (n / 6))
    ir = filt(ir, band(200, 5000))
    ir /= np.sqrt(np.sum(ir**2))
    if circular:
        wet = np.fft.irfft(np.fft.rfft(x) * np.fft.rfft(ir, len(x)), len(x))
    else:
        y = np.concatenate([x, np.zeros(n)])
        wet = np.fft.irfft(np.fft.rfft(y) * np.fft.rfft(ir, len(y)), len(y))
        x = y
    return (1 - mix) * x + mix * wet


def env(n, attack=0.005, release=0.1):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(attack, 1e-4))
    return e * np.exp(-t / max(release, 1e-4))


def place(bed, event, at):
    """Add event into bed starting at sample `at`, wrapping around the end (seamless loops)."""
    n = len(bed)
    idx = (at + np.arange(len(event))) % n
    np.add.at(bed, idx, event)


def chirp(f0, f1, dur, vib=0.0, vibf=30.0, shape='exp'):
    t = t_axis(dur)
    k = t / dur
    f = f0 * (f1 / f0) ** k if shape == 'exp' else f0 + (f1 - f0) * k
    f = f * (1 + vib * np.sin(2 * np.pi * vibf * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.sin(np.pi * k) ** 0.7


def silence(dur):
    return np.zeros(int(dur * SR))


def cat(*parts):
    return np.concatenate(parts)


def stereo(left, right):
    return np.stack([left, right], axis=1)


# ---------------------------------------------------------------- creature sounds
def croak(f0=140, dur=0.22, rough=32):
    t = t_axis(dur)
    k = t / dur
    f = f0 * (1.15 - 0.3 * k)
    ph = 2 * np.pi * np.cumsum(f) / SR
    carrier = np.sin(ph + 2.5 * np.sin(ph * 0.5)) + 0.5 * np.sin(2 * ph) + 0.25 * np.sin(3 * ph)
    am = 0.5 + 0.5 * np.sign(np.sin(2 * np.pi * rough * t)) * 0.8
    return filt(carrier * am * np.sin(np.pi * k) ** 0.5, band(80, 2200))


def quack(f0=330, dur=0.2):
    t = t_axis(dur)
    k = t / dur
    f = f0 * (1.1 - 0.25 * k)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.zeros_like(t)
    for h in range(1, 18):  # nasal buzz with a formant near 1.1 kHz
        w = np.exp(-(((h * f0) - 1100) / 600) ** 2) + 0.15 / h
        y += w * np.sin(h * ph)
    y *= np.minimum(1, k / 0.06) * (1 - k) ** 0.6
    return filt(y, band(250, 4000)) + 0.05 * rng.standard_normal(len(t)) * (1 - k)


def tweet(rng_local=rng):
    """One bird syllable: fast FM sweep in 2.5-6 kHz."""
    kind = rng_local.integers(0, 3)
    d = rng_local.uniform(0.05, 0.16)
    if kind == 0:
        return chirp(rng_local.uniform(2800, 3600), rng_local.uniform(4500, 6000), d)
    if kind == 1:
        return chirp(rng_local.uniform(5000, 6000), rng_local.uniform(2600, 3200), d)
    return chirp(rng_local.uniform(3200, 4200), rng_local.uniform(3300, 4300), d, vib=0.08, vibf=rng_local.uniform(25, 60))


def bird_phrase(n_syll=6, gap=(0.03, 0.12)):
    parts = []
    for _ in range(n_syll):
        parts += [tweet(), silence(rng.uniform(*gap))]
    return cat(*parts)


def hoot(f0=380, dur=0.55):
    t = t_axis(dur)
    k = t / dur
    f = f0 * (1 + 0.06 * np.sin(np.pi * k)) * (1 - 0.05 * k)
    ph = 2 * np.pi * np.cumsum(f) / SR
    breath = filt(rng.standard_normal(len(t)), band(300, 1500)) * 0.12
    e = np.minimum(1, k / 0.25) * np.minimum(1, (1 - k) / 0.35)
    return (np.sin(ph) + 0.15 * np.sin(2 * ph) + breath) * e


def cricket_chirp(f=4600, pulses=3, rate=32):
    pulse = np.sin(2 * np.pi * f * t_axis(0.014)) * np.hanning(int(0.014 * SR))
    period = silence(1 / rate - 0.014)
    return cat(*([cat(pulse, period)] * pulses))


def ping(f, dur=0.6, partials=(1, 2.76, 5.4), decay=0.25):
    t = t_axis(dur)
    y = sum(np.sin(2 * np.pi * f * p * t) * np.exp(-t * (1 + i * 2) / decay) / (i + 1) for i, p in enumerate(partials))
    return y * np.minimum(1, t / 0.003)


def droplet(f0=None):
    f0 = f0 or rng.uniform(900, 1700)
    d = 0.08
    t = t_axis(d)
    f = f0 * np.exp(-t * 18) + 250
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)


# ---------------------------------------------------------------- SFX (one-shots)
def make_sfx():
    write('sfx', 'zaba', reverb(cat(croak(150), silence(0.09), croak(140, 0.26)), 0.4, 0.15))
    write('sfx', 'zaba-daleko', filt(reverb(croak(rng.uniform(120, 160), 0.24), 1.6, 0.55), band(80, 900)))
    # lily pad: soft plop + a few drips
    plop = chirp(700, 160, 0.18) * env(int(0.18 * SR), 0.002, 0.07)
    drips = silence(0.6)
    for at in (0.15, 0.28, 0.42):
        place(drips, droplet() * 0.35, int(at * SR))
    write('sfx', 'lopoc', reverb(cat(plop, silence(0.42)) + drips, 0.6, 0.2))
    # dragonfly: wing whirr (noise AM at wingbeat ~ 35 Hz) with Doppler-ish swell
    t = t_axis(1.2)
    whirr = filt(rng.standard_normal(len(t)), band(150, 1800)) * (0.55 + 0.45 * np.sin(2 * np.pi * 36 * t)) * np.sin(np.pi * t / 1.2) ** 1.5
    write('sfx', 'vilin-konjic', whirr)
    # fish: splash = noise burst + droplets spread over time
    n = int(1.1 * SR)
    burst = filt(rng.standard_normal(n), band(400, 6000)) * env(n, 0.004, 0.12)
    for _ in range(14):
        place(burst, droplet() * rng.uniform(0.2, 0.5), int(rng.uniform(0.05, 0.8) * SR))
    write('sfx', 'riba', reverb(burst, 0.5, 0.15))
    write('sfx', 'riba-pljus-mali', droplet(1200) * 0.8)
    # reeds: leafy rustle with gusts
    t = t_axis(1.5)
    rustle = filt(rng.standard_normal(len(t)), band(1500, 9000)) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.3 * t + np.sin(2 * np.pi * 7 * t)))) * np.sin(np.pi * t / 1.5)
    write('sfx', 'trska', rustle)
    # duck: kva-kva
    write('sfx', 'patka', reverb(cat(quack(340), silence(0.08), quack(320, 0.24)), 0.4, 0.12))
    # butterfly: soft wing flutter + rising twinkle
    t = t_axis(1.2)
    flutter = filt(rng.standard_normal(len(t)), band(300, 3000)) * np.maximum(0, np.sin(2 * np.pi * 11 * t)) ** 2 * 0.25 * np.sin(np.pi * t / 1.2)
    for i, f in enumerate((1568, 2093, 2637, 3136)):
        place(flutter, ping(f, 0.5, (1, 2.0), 0.15) * 0.25, int((0.1 + i * 0.15) * SR))
    write('sfx', 'leptir', reverb(flutter, 0.8, 0.25))
    # birds
    write('sfx', 'ptica', reverb(bird_phrase(7), 0.6, 0.15))
    write('sfx', 'ptica-cvrkut-1', reverb(bird_phrase(3), 0.8, 0.3))
    write('sfx', 'ptica-cvrkut-2', reverb(bird_phrase(2, (0.05, 0.2)), 0.8, 0.3))
    # owl: hu-huuu
    write('sfx', 'sova', reverb(cat(hoot(400, 0.35), silence(0.18), hoot(380, 0.7)), 1.2, 0.3))
    write('sfx', 'sova-daleko', filt(reverb(cat(hoot(390, 0.3), silence(0.15), hoot(370, 0.6)), 2.0, 0.6), band(150, 1200)))
    # moon: gentle bell chime (no natural sound for the moon)
    chime = silence(2.2)
    for i, f in enumerate((784, 988, 1175)):
        place(chime, ping(f, 1.8, decay=0.7) * 0.5, int(i * 0.18 * SR))
    write('sfx', 'mjesec', reverb(chime, 1.5, 0.35))
    # fireflies: tiny random twinkles
    tw = silence(1.4)
    for _ in range(9):
        place(tw, ping(rng.uniform(2500, 4200), 0.35, (1, 2.0), 0.08) * rng.uniform(0.15, 0.35), int(rng.uniform(0, 1.0) * SR))
    write('sfx', 'krijesnice', reverb(tw, 1.0, 0.35))
    # cricket close-up: three trills
    write('sfx', 'cvrcak', cat(cricket_chirp(), silence(0.18), cricket_chirp(), silence(0.18), cricket_chirp(4550, 4)))
    # bravo fanfare: bright brassy arpeggio
    notes = [(523.25, 0.14), (659.25, 0.14), (783.99, 0.14), (1046.5, 0.7)]
    parts = []
    for f, d in notes:
        t = t_axis(d)
        tone = sum(np.sin(2 * np.pi * f * h * t) / h**1.3 for h in range(1, 7))
        parts.append(tone * np.minimum(1, t / 0.01) * np.exp(-t / (0.5 if d > 0.5 else 0.25)))
    write('sfx', 'bravo', reverb(cat(*parts), 1.0, 0.25))


# ---------------------------------------------------------------- ambient loops (seamless)
def make_ambient(L=40.0):
    n = int(L * SR)
    t = np.arange(n) / SR

    def lfo(*cycles):  # modulation that completes whole cycles per loop → seamless
        return sum(np.sin(2 * np.pi * c * t / L + rng.uniform(0, 6.28)) for c in cycles) / len(cycles)

    # water lapping: low swishes + scattered drips
    def water_ch():
        swish = shaped_noise(n, band(120, 900)) * (0.55 + 0.45 * lfo(9, 13, 17))
        lap = shaped_noise(n, band(500, 2500)) * np.maximum(0, lfo(11, 16)) ** 2 * 0.5
        y = swish + lap
        for _ in range(int(L * 1.2)):
            place(y, droplet() * rng.uniform(0.3, 0.9), rng.integers(0, n))
        return y

    write('ambient', 'jezero-voda', stereo(water_ch(), water_ch()))

    # distant birdsong: phrases scattered, soft, reverberant
    def birds_ch():
        y = np.zeros(n)
        for _ in range(int(L / 2.2)):
            place(y, bird_phrase(rng.integers(2, 6)) * rng.uniform(0.3, 1.0), rng.integers(0, n))
        return filt(reverb(y, 1.5, 0.5, circular=True), band(1500, 7000)) + shaped_noise(n, band(2000, 8000)) * 0.01

    write('ambient', 'jezero-ptice', stereo(birds_ch(), birds_ch()))

    # wind in leaves: band noise with slow gusts
    gust = 0.35 + 0.65 * np.maximum(0, lfo(3, 5, 7)) ** 1.5
    write(
        'ambient',
        'jezero-vjetar',
        stereo(shaped_noise(n, band(250, 3500, 1)) * gust, shaped_noise(n, band(250, 3500, 1)) * np.roll(gust, SR)),
    )

    # night crickets: several insects with their own pitch, rhythm and side
    left, right = np.zeros(n), np.zeros(n)
    for _ in range(7):
        f = rng.uniform(4000, 5200)
        period = rng.uniform(0.45, 0.9)
        pan = rng.uniform(0, 1)
        amp = rng.uniform(0.2, 1.0)
        chirp_ = cricket_chirp(f, rng.integers(2, 5), rng.uniform(26, 38)) * amp
        at = rng.uniform(0, period)
        while at < L:
            place(left, chirp_ * (1 - pan), int(at * SR))
            place(right, chirp_ * pan, int(at * SR))
            at += period * rng.uniform(0.9, 1.1)
    hum = shaped_noise(n, band(60, 300)) * 0.03
    write('ambient', 'noc-cvrcci', stereo(reverb(left, 0.8, 0.3, True) + hum, reverb(right, 0.8, 0.3, True) + hum))

    # distant frog chorus
    def frogs_ch():
        y = np.zeros(n)
        for _ in range(int(L * 1.5)):
            place(y, croak(rng.uniform(110, 260), rng.uniform(0.15, 0.3), rng.uniform(22, 40)) * rng.uniform(0.2, 1), rng.integers(0, n))
        return filt(reverb(y, 1.8, 0.55, circular=True), band(90, 1200))

    write('ambient', 'noc-zabe', stereo(frogs_ch(), frogs_ch()))


# ---------------------------------------------------------------- narration placeholders (chimes)
def make_narration():
    lines = {
        'mala-zaba-1-intro': (523.25, 659.25),
        'mala-zaba-1-zaba': (392, 523.25),
        'mala-zaba-1-lopoc': (440, 587.33),
        'mala-zaba-1-vilin-konjic': (587.33, 783.99),
        'mala-zaba-1-riba': (349.23, 466.16),
        'mala-zaba-1-trska': (493.88, 659.25),
        'mala-zaba-1-patka': (415.3, 554.37),
        'mala-zaba-1-leptir': (659.25, 880),
        'mala-zaba-1-ptica': (698.46, 932.33),
        'mala-zaba-1-bravo': (523.25, 783.99),
        'mala-zaba-2-intro': (392, 493.88),
        'mala-zaba-2-zaba': (349.23, 440),
        'mala-zaba-2-mjesec': (587.33, 739.99),
        'mala-zaba-2-sova': (329.63, 415.3),
        'mala-zaba-2-krijesnice': (783.99, 987.77),
        'mala-zaba-2-cvrcak': (622.25, 830.61),
        'mala-zaba-2-bravo': (440, 659.25),
    }
    for name, (a, b) in lines.items():
        y = silence(1.5)
        place(y, ping(a, 1.2, (1, 2.0, 3.0), 0.4) * 0.6, 0)
        place(y, ping(b, 1.0, (1, 2.0, 3.0), 0.35) * 0.6, int(0.35 * SR))
        write('narration', name, y)


if __name__ == '__main__':
    make_sfx()
    make_ambient()
    make_narration()
    print('placeholder WAVs written to', os.path.abspath(OUT))
