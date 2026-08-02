#!/bin/sh
set -e

if [ -z "$APP_KEY" ] || [ "$APP_KEY" = "base64:" ]; then
  export APP_KEY=$(php artisan key:generate --show)
  echo "Generated APP_KEY for container startup."
fi

exec "$@"
