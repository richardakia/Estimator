#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"
if ! command -v pnpm >/dev/null 2>&1; then
  echo "ERROR: pnpm is not installed."
  echo "Install Node.js v22.7+ from https://nodejs.org and then run:"
  echo "  npm install -g pnpm"
  exit 1
fi
pnpm setup:local
