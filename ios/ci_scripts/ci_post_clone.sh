#!/bin/zsh

set -euo pipefail

if [[ -n "${CI_PRIMARY_REPOSITORY_PATH:-}" ]]; then
  REPO_ROOT="$CI_PRIMARY_REPOSITORY_PATH"
else
  SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
  REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
fi

MOBILE_DIR="$REPO_ROOT/mobile"

echo "Using repository root: $REPO_ROOT"
echo "Installing React Native dependencies for Xcode Cloud"

cd "$MOBILE_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "error: Node.js is required to install React Native dependencies." >&2
  exit 1
fi

if ! command -v bundle >/dev/null 2>&1; then
  echo "Installing Bundler"
  gem install bundler --no-document
fi

corepack enable
yarn install --frozen-lockfile --ignore-engines

bundle config set path vendor/bundle
bundle install
bundle exec pod install --project-directory=ios --repo-update
