#!/usr/bin/env bash
# Normalize real recordings into public/audio.
#
#   raw-audio/narration/*.{wav,mp3,m4a}  -> public/audio/narration/<name>.mp3  (mono, trimmed)
#   raw-audio/sfx/*                      -> public/audio/sfx/<name>.mp3        (mono, trimmed)
#   raw-audio/ambient/*                  -> public/audio/ambient/<name>.mp3    (stereo, not trimmed, made seamless)
#
# Loudness: EBU R128 loudnorm I=-16 LUFS, TP=-1.5 dBTP, LRA=11.
# Silence trim: strips leading and trailing silence below -45 dB.
# Name files without diacritics: zaba, not žaba.
set -euo pipefail
cd "$(dirname "$0")/.."

LOUD="loudnorm=I=-16:TP=-1.5:LRA=11"
TRIM="silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse"

# Ambient loops: after loudness normalization, cross-fade the last 2 s into the first 2 s so the
# file loops seamlessly (the output starts at 0:02 and ends flowing back into it).
LOOP_XFADE=2

process() { # category channels bitrate filter [loop]
  local cat=$1 ch=$2 br=$3 filter=$4 loop=${5:-}
  shopt -s nullglob nocaseglob
  for f in "${RAW_DIR:-raw-audio}"/"$cat"/*.{wav,mp3,m4a,aif,aiff,flac,ogg}; do
    name=$(basename "${f%.*}")
    if [[ "$name" =~ [^a-zA-Z0-9._-] ]]; then
      echo "!! skipping '$name': use plain ASCII names (zaba, not žaba)" >&2; continue
    fi
    out="public/audio/$cat/$name.mp3"
    if [[ -n "$loop" ]]; then
      local tmp; tmp=$(mktemp --suffix=.wav)
      ffmpeg -hide_banner -loglevel error -y -i "$f" -af "$filter" -ac "$ch" -ar 44100 "$tmp"
      ffmpeg -hide_banner -loglevel error -y -i "$tmp" -i "$tmp" -filter_complex \
        "[0]atrim=start=$LOOP_XFADE,asetpts=PTS-STARTPTS[body];[1]atrim=end=$LOOP_XFADE,asetpts=PTS-STARTPTS[head];[body][head]acrossfade=d=$LOOP_XFADE:c1=qsin:c2=qsin" \
        -ac "$ch" -ar 44100 -b:a "$br" "$out"
      rm -f "$tmp"
    else
      ffmpeg -hide_banner -loglevel error -y -i "$f" -af "$filter" -ac "$ch" -ar 44100 -b:a "$br" "$out"
    fi
    echo "✓ $out"
  done
}

mkdir -p public/audio/{narration,sfx,ambient}
process narration 1 96k  "$TRIM,$LOUD"
process sfx       1 128k "$TRIM,$LOUD"
process ambient   2 128k "$LOUD" loop
