# Constella Wallet

This wallet code runs inside a nitro enclave and uses [nitriding](https://github.com/brave/nitriding-daemon) to communicate over TCP. Hence it requires `gvproxy` (installed and configured by the setup script) to be running and forwarding ports 443 and 7047 to nitriding's static IP `192.168.127.2`.