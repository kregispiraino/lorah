#!/bin/sh
set -eu

storage_path="${DATA_STORAGE_PATH:-/app/storage}"
case "$storage_path" in
  ""|/|/app)
    echo "DATA_STORAGE_PATH inseguro: $storage_path" >&2
    exit 1
    ;;
esac

mkdir -p "$storage_path"
chown -R lorah:lorah "$storage_path"
exec su-exec lorah "$@"
