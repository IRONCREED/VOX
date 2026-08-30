#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm ci before building." >&2
  exit 69
fi

node "${SITES_PROJECT_ROOT}/constitutional-guard/run.mjs" prebuild
npm --prefix "${SITES_PROJECT_ROOT}" run sitemaps:check
"${vinext}" build
"${script_dir}/validate-artifact.sh"
node "${SITES_PROJECT_ROOT}/constitutional-guard/run.mjs" postbuild
