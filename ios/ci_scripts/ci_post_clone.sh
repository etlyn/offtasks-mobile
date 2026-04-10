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

export GEM_HOME="${GEM_HOME:-$HOME/.gem}"
export GEM_PATH="$GEM_HOME:${GEM_PATH:-}"
export PATH="$GEM_HOME/bin:$PATH"

echo "Node version: $(node --version)"
echo "Ruby version: $(ruby --version)"

if ! command -v bundle >/dev/null 2>&1; then
  echo "Installing Bundler to $GEM_HOME"
  gem install bundler --user-install --no-document
fi

if command -v yarn >/dev/null 2>&1; then
  YARN_CMD=(yarn)
elif command -v corepack >/dev/null 2>&1; then
  YARN_CMD=(corepack yarn)
else
  YARN_CMD=(npx --yes yarn@1.22.22)
fi

echo "Using Yarn command: ${YARN_CMD[*]}"
"${YARN_CMD[@]}" install --frozen-lockfile --ignore-engines

bundle config set path vendor/bundle
bundle install
bundle exec pod install --project-directory=ios --repo-update
