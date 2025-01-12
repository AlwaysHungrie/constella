#!/bin/sh


nitriding -fqdn example.com -ext-pub-port 443 -intport 8080 -wait-for-app &
echo "[sh] Started nitriding."

sleep 1
    
pnpm --version

# echo "📦 installing pnpm packages"
# cd /bin/freysa-autonomous-project
# pnpm install

echo "🚀 starting python server"
cd /bin/src
python3 server.py
echo "[sh] Python server started."
