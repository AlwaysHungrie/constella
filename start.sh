#!/bin/sh

nitriding -fqdn example.com -ext-pub-port 443 -intport 8080 -wait-for-app &
echo "[sh] Started nitriding."

sleep 1

echo "🚀 starting python server"
cd /bin/src
python3 server.py
echo "[sh] Python server started."
