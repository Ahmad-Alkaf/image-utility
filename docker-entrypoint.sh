#!/bin/sh
# Apply pending database migrations, then start the Next.js server.
set -e

if [ -z "$DATABASE_URL" ]; then
  echo "DATABASE_URL is not set" >&2
  exit 1
fi

echo "Applying database migrations..."
cd /migrate
node node_modules/prisma/build/index.js migrate deploy
cd /app

exec "$@"
