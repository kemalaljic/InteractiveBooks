#!/usr/bin/env bash
# Synthesize PLACEHOLDER audio with ffmpeg so the prototype is playable end to end.
# These are stand-ins: replace with real recordings (raw-audio/ → npm run audio:normalize).
# Placeholders go to raw-audio/_placeholder/ and are then run through the same normalize pipeline.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT=raw-audio/_placeholder
mkdir -p "$OUT"/{narration,sfx,ambient}
gen() { ffmpeg -hide_banner -loglevel error -y "$@"; }
SR=44100

# ---- SFX ----
# frog: two raspy FM croaks
gen -f lavfi -i "aevalsrc='(lt(t,0.2)+between(t,0.3,0.52))*sin(2*PI*150*t+4*sin(2*PI*75*t))*(0.55+0.45*sin(2*PI*32*t))*0.8':s=$SR:d=0.7" "$OUT/sfx/zaba.wav"
# lily pad: water plop (falling chirp)
gen -f lavfi -i "aevalsrc='sin(2*PI*(170*t+55*(1-exp(-18*t))))*exp(-9*t)*0.9':s=$SR:d=0.6" "$OUT/sfx/lopoc.wav"
# dragonfly: wing buzz
gen -f lavfi -i "aevalsrc='0.5*sin(2*PI*210*t+2.5*sin(2*PI*105*t))*(0.6+0.4*sin(2*PI*47*t))*sin(PI*t/1.1)':s=$SR:d=1.1" "$OUT/sfx/vilin-konjic.wav"
# fish: splash (pink noise burst) + plop
gen -f lavfi -i "anoisesrc=d=0.9:c=pink:a=0.9:r=$SR" -f lavfi -i "aevalsrc='sin(2*PI*(140*t+50*(1-exp(-20*t))))*exp(-10*t)':s=$SR:d=0.9" \
  -filter_complex "[0]lowpass=f=3500,afade=t=in:d=0.01,afade=t=out:st=0.08:d=0.8[n];[1]volume=0.7[p];[n][p]amix=inputs=2:normalize=0" "$OUT/sfx/riba.wav"
# reed: rustle
gen -f lavfi -i "anoisesrc=d=1.3:c=white:a=0.5:r=$SR" -af "highpass=f=2500,lowpass=f=8000,volume='0.35+0.3*sin(2*PI*4*t)':eval=frame,afade=t=in:d=0.25,afade=t=out:st=0.6:d=0.7" "$OUT/sfx/trska.wav"
# bravo: C-E-G-C fanfare
gen -f lavfi -i "aevalsrc='(if(lt(t,0.15),sin(2*PI*523.25*t),if(lt(t,0.3),sin(2*PI*659.25*t),if(lt(t,0.45),sin(2*PI*783.99*t),sin(2*PI*1046.5*t)+0.3*sin(2*PI*1568*t)))))*if(lt(t,0.45),exp(-mod(t,0.15)*6),exp(-(t-0.45)*2.2))*0.7':s=$SR:d=1.6" "$OUT/sfx/bravo.wav"

# ---- Ambient pond bed (30 s; noise loops seamlessly) ----
gen -f lavfi -i "anoisesrc=d=30:c=brown:a=0.6:r=$SR" -af "lowpass=f=650,highpass=f=70,volume='0.8+0.2*sin(2*PI*t/7.5)':eval=frame" -ac 2 "$OUT/ambient/mala-zaba-1.wav"

# ---- Narration placeholders: a soft two-note chime per line (captions carry the words) ----
chime() { # name f1 f2
  gen -f lavfi -i "aevalsrc='(sin(2*PI*$2*t)*exp(-4*t)+if(gt(t,0.35),sin(2*PI*$3*(t-0.35))*exp(-3.5*(t-0.35)),0))*0.6':s=$SR:d=1.6" "$OUT/narration/$1.wav"
}
chime mala-zaba-1-intro 523.25 659.25
chime mala-zaba-1-zaba 392 523.25
chime mala-zaba-1-lopoc 440 587.33
chime mala-zaba-1-vilin-konjic 587.33 783.99
chime mala-zaba-1-riba 349.23 466.16
chime mala-zaba-1-trska 493.88 659.25
chime mala-zaba-1-bravo 523.25 783.99

# Run the placeholders through the real pipeline.
RAW_DIR="$OUT" bash scripts/normalize-audio.sh
