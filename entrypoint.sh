#!/bin/sh
set -e

# Start the server with node (compatible with both N-Solid and regular Node.js)
echo "[entrypoint] Starting application server..."
exec node server.js
