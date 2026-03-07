#!/bin/sh
set -eu

echo "Running staged-file whitespace checks..."
git diff --cached --check

if command -v npm >/dev/null 2>&1; then
  echo "Running lint..."
  npm run lint
else
  echo "Skipping lint: npm is not available in this shell."
fi
