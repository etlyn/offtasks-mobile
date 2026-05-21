#!/bin/zsh

set -euo pipefail

required_ios_sdk_major=26

if ! xcode_version_output="$(xcodebuild -version 2>&1)"; then
  echo "$xcode_version_output" >&2
  echo "error: Full Xcode ${required_ios_sdk_major} or later must be selected before building for App Store distribution." >&2
  echo "In Xcode Cloud, update the workflow Environment Xcode version to Xcode ${required_ios_sdk_major} or later." >&2
  exit 1
fi

if ! ios_sdk_version="$(xcrun --sdk iphoneos --show-sdk-version 2>&1)"; then
  echo "$ios_sdk_version" >&2
  echo "error: Could not resolve the iPhoneOS SDK from the active Xcode." >&2
  echo "Install and select Xcode ${required_ios_sdk_major} or later, then rebuild the archive." >&2
  exit 1
fi

ios_sdk_major="${ios_sdk_version%%.*}"

echo "Active Xcode:"
echo "$xcode_version_output"
echo "Active iPhoneOS SDK: $ios_sdk_version"

if ! [[ "$ios_sdk_major" =~ "^[0-9]+$" ]]; then
  echo "error: Could not parse iPhoneOS SDK version '$ios_sdk_version'." >&2
  exit 1
fi

if (( ios_sdk_major < required_ios_sdk_major )); then
  cat >&2 <<EOF
error: This workflow is using iPhoneOS SDK $ios_sdk_version, but App Store Connect requires iOS $required_ios_sdk_major SDK or later.
Select Xcode $required_ios_sdk_major or later for the Xcode Cloud workflow before archiving/uploading.
Changing IPHONEOS_DEPLOYMENT_TARGET does not satisfy this requirement; the archive must be produced by the newer Xcode toolchain.
EOF
  exit 1
fi