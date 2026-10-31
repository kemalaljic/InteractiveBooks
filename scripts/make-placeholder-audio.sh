#!/usr/bin/env bash
# Regenerate the PLACEHOLDER audio (synthesized nature sounds + narration chimes) and run it
# through the normal normalize pipeline into public/audio/. Needs python3 + numpy + ffmpeg.
# Real recordings replace these: see docs/SOUND-LIST.md.
set -euo pipefail
cd "$(dirname "$0")/.."
rm -rf raw-audio/_placeholder
python3 scripts/make_placeholder_audio.py
RAW_DIR=raw-audio/_placeholder bash scripts/normalize-audio.sh
