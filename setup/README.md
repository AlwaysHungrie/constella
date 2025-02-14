# Setup Nitro Enclaves

## Prerequisites

You need a nitro enabled EC2 instance to build and run the wallet. You can use any of the instance types mentioned [here](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html) as long as they have more than 4 cpu cores.
`eg. m5a.xlarge`

The setup script works only for Amazon Linux 2 AMI (HVM). While launching the instance make sure it has sufficient storage `eg. 30GB`, has access to the internet `check "allow HTTPS traffic from the internet"` and nitro enabled `select enabled under "Nitro Enclave" in the advanced settings`.

## 0. Network configuration

In your EC2 instance's security group, add an inbound rule to allow port 8443 from the internet.

```
Add rule:
Custom TCP, Port Range: 8443, Source: Custom 0.0.0.0/0
```

## 1. Setup script

The `setup.sh` script provided needs to be run at the root directory so you need to copy the script to the root directory first.

```bash
cp setup.sh ~ && cd ~ && chmod +x setup.sh && ./setup.sh 
```

The script will install the tools required to build and run the wallet inside a nitro enclave.
 - `git`
 - `nitro-cli`
 - `docker`
 - `golang`
 - `gvproxy`
  
## 2. Configure TLS (Optional)

In order to setup the wallet to work with an actual domain, follow instructions [here](https://github.com/AlwaysHungrie/constella/setup/TLS.md)

## 3. Gvproxy Setup (Optional)

In order for a wallet to connect with the internet, gvproxy is required to be configured and running.
Run the `./gvproxy.sh` script in order to setup gvproxy to start on boot and start port forwarding correctly.

## Next Steps

You can now build the [wallet](https://github.com/AlwaysHungrie/constella/wallet/README.md), the [verifier](https://github.com/AlwaysHungrie/constella/verifier/README.md) and run as per requirements by following their respective instructions.