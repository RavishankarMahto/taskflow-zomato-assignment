#!/usr/bin/env sh
set -e

# Run migrations + seed on container start
./node_modules/.bin/node-pg-migrate up -m migrations --tsx
node dist/seed.js

exec node dist/index.js

