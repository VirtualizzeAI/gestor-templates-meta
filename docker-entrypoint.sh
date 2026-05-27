#!/bin/sh
# =============================================================
# Luna Templates — Docker entrypoint
# Generates /usr/share/nginx/html/env.js from runtime env vars
# so the SAME built image can be reused with different Supabase
# projects without rebuilding.
# =============================================================
set -e

TARGET=/usr/share/nginx/html/env.js

cat > "$TARGET" <<EOF
window.__ENV__ = {
  VITE_SUPABASE_URL: "${VITE_SUPABASE_URL:-}",
  VITE_SUPABASE_ANON_KEY: "${VITE_SUPABASE_ANON_KEY:-}"
};
EOF

# Inject <script src="/env.js"> into index.html if not yet there
INDEX=/usr/share/nginx/html/index.html
if ! grep -q 'src="/env.js"' "$INDEX"; then
  sed -i 's|</head>|<script src="/env.js"></script></head>|' "$INDEX"
fi

echo "[luna] Runtime env injected:"
echo "  VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-(empty)}"
echo "  VITE_SUPABASE_ANON_KEY=${VITE_SUPABASE_ANON_KEY:+set (hidden)}"

exec "$@"
