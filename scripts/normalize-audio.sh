#!/usr/bin/env bash
# Normalize real recordings into public/audio.
#
#   raw-audio/narration/*.{wav,mp3,m4a}  -> public/audio/narration/<name>.mp3  (mono, trimmed)
#   raw-audio/sfx/*                      -> public/audio/sfx/<name>.mp3        (mono, trimmed)
#   raw-audio/ambient/*                  -> public/audio/ambient/<name>.mp3    (stereo, NOT trimmed: loops)
#
# Loudness: EBU R128 loudnorm I=-16 LUFS, TP=-1.5 dBTP, LRA=11.
# Silence trim: strips leading and trailing silence below -45 dB.
# Name files without diacritics: zaba, not žaba.
set -euo pipefail
cd "$(dirname "$0")/.."

LOUD="loudnorm=I=-16:TP=-1.5:LRA=11"
TRIM="silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.1,areverse"

process() { # category channels bitrate filter
  local cat=$1 ch=$2 br=$3 filter=$4
  shopt -s nullglob nocaseglob
  for f in "${RAW_DIR:-raw-audio}"/"$cat"/*.{wav,mp3,m4a,aif,aiff,flac,ogg}; do
    name=$(basename "${f%.*}")
    if [[ "$name" =~ [^a-zA-Z0-9._-] ]]; then
      echo "!! skipping '$name': use plain ASCII names (zaba, not žaba)" >&2; continue
    fi
    out="public/audio/$cat/$name.mp3"
    ffmpeg -hide_banner -loglevel error -y -i "$f" -af "$filter" -ac "$ch" -ar 44100 -b:a "$br" "$out"
    echo "✓ $out"
  done
}

mkdir -p public/audio/{narration,sfx,ambient}
process narration 1 96k  "$TRIM,$LOUD"
process sfx       1 128k "$TRIM,$LOUD"
process ambient   2 128k "$LOUD"
