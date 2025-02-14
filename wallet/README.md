# Constella Wallet

This wallet code runs inside a nitro enclave and uses [nitriding](https://github.com/brave/nitriding-daemon) to communicate over TCP. 

## Verifying PCRS values

To build the wallet image and run it in debug mode inside the enclave, run the following command:

```
make 
```

The PCRS values will be printed on the console as a part of the build process. Alternatively you can close the running console and run `nitro-cli describe-enclaves` to view the PCRS values of the wallet.

The PCRS values obtained should match the publicly posted PCRS values of Constella as well as the ones returned by in the attestation certificate.

## Running the wallet

Just running the `make` command will not allow you to interact with the wallet as it is running inside the enclave.
Nitriding requires `gvproxy` (installed during setup) to be running and forwarding ports 443 and 7047 to the nitriding's static ip 192.168.127.2.

To run gvproxy,

```
# stop any running gvproxy and clear port forwarding configuration
sudo pkill -f gvproxy
sudo rm -rf /tmp/network.sock

# run gvproxy
sudo /home/ec2-user/gvisor-tap-vsock/bin/gvproxy -listen vsock://:1024 -listen unix:///tmp/network.sock &

# wallet runs on port 7047
sudo curl --unix-socket /tmp/network.sock \
http:/unix/services/forwarder/expose \
-X POST \
-d '{"local":":7047","remote":"192.168.127.2:7047"}'

# nitriding runs on port 443
sudo curl --unix-socket /tmp/network.sock \
http:/unix/services/forwarder/expose \
-X POST \
-d '{"local":":443","remote":"192.168.127.2:443"}'
```

Once gvproxy is running, you can run the wallet in production mode:

```
# stop any running enclaves
sudo nitro-cli terminate-enclave --all

# run the enclave
sudo ./run-enclave.sh python-enclave-<version>-kaniko.eif
```

## Getting the attestation certificate

Provided the nginx proxy is not running, you can get the attestation certificate directly from nitriding by visiting 
https://<ec2-elastic-ip>/enclave/attestation?nonce=<random-20-byte-nonce>(e.g. https://3.6.235.47/enclave/attestation?nonce=a03000acdaba654d6cfff9b12d45d1c3434e7fd7)

The connection will not be secure as tls is not enabled on nitriding.

The wallet can also provide the attestation certificate by calling the nitring endpoint for you and returning the results.

```
curl -X GET http://0.0.0.0:7047/api/v1/config
```

The certificate obtained can be verified using the `verifier` section of this repository.
