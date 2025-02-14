#!/bin/bash

# Kill any existing gvproxy processes
sudo pkill gvproxy || true

# Remove the network socket file if it exists
sudo rm -rf /tmp/network.sock

sleep 2

# Kill any existing gvproxy screen sessions if they exist
screen -ls | grep gvproxy | cut -d. -f1 | xargs -I {} screen -X -S {} quit > /dev/null 2>&1

# Create new screen session with explicit name
screen -dmS gvproxy bash -c 'sudo /home/ec2-user/gvisor-tap-vsock/bin/gvproxy -listen vsock://:1024 -listen unix:///tmp/network.sock'

# Wait a moment to ensure screen session starts
sleep 2

# Verify the screen session is running
if screen -ls | grep -q "gvproxy"; then
    echo "gvproxy started successfully in screen session"

    sudo curl --unix-socket /tmp/network.sock \
        http:/unix/services/forwarder/expose \
        -X POST \
        -d '{"local":":7047","remote":"192.168.127.2:7047"}'

    sudo curl --unix-socket /tmp/network.sock \
        http:/unix/services/forwarder/expose \
        -X POST \
        -d '{"local":":8443","remote":"192.168.127.2:443"}'
else
    echo "Failed to start gvproxy screen session"
fi
