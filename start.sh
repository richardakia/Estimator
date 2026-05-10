#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is not installed."
  exit 1
fi
pnpm start:local
