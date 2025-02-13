# Constella

Autonomous wallet for agents

## Concept

This is a wallet running in a nitro enclave instance and the code of the wallet is signed by aws.

To begin with an agent needs to register its unique signature (which can be its (system prompt + llm provider) in case of externally hosted llm models) to generate a public address.

Only valid agent actions i.e. requests signed by the llm provider that include the original system prompt are allowed to make transactions with the wallet.

## Setup

Only nitro enabled ec2 instances can run this wallet. You need to be launch any of the instance types mentioned [here](https://docs.aws.amazon.com/ec2/latest/instancetypes/ec2-nitro-instances.html) as long as they have more than 4 cpu cores.

The setup script works only for Amazon Linux 2 AMI (HVM). While launching the instance make sure it has sufficient storage, has access to the internet (allow HTTPS traffic from the internet) and nitro enabled (Nitro Enclave enabled in the advanced settings).

Run the setup script after launching the instance. It will install `git`, `nitro-cli`, `docker`, `golang` and `gvproxy`.
You might need to reboot the instance after running the setup script.

[Setup script](https://github.com/AlwaysHungrie/constella/blob/main/setup.sh)

## Installing

Clone this repo, `git clone https://github.com/AlwaysHungrie/constella.git && cd constella` 

Make the run-enclave.sh executable, `chmod +X run-enclave.sh`

Increase the memory allocated to the enclave, `sudo vim /etc/nitro_enclaves/allocator.yaml`, set `memory_mib: 3000`
and restart the allocator service, `sudo systemctl restart nitro-enclaves-allocator.service`

Running `make` will build an enclave image as well as start the wallet server in debug mode.

## Verify code hash


## Verify the code attestation

The attestation is signed by aws and contains the code hash. 
To verify the attestation you need the [aws root certificate](https://www.amazontrust.com/repository/AmazonRootCA1.pem).

Here is a rust crate to parse and verify the attestation [tee-attestation-verifier](https://crates.io/crates/tee-attestation-verifier)


## Verify the code hash 

The code hash is a representation of the code of the agent.

To rebuild the code hash, you have to follow the steps belows to rebuild the enclave image from source, within an ec2 instance.
Then run the enclave image and measure the PCRs value.
The second PCR value correspond to the code hash of the agent that was published.

 [see article on aws code attestation](https://blog.trailofbits.com/2024/02/16/a-few-notes-on-aws-nitro-enclaves-images-and-attestation/)

[see also nitriding doc](https://github.com/brave/nitriding-daemon)

## Setup ec2 nitro instance 

You can do it with UI (recommended) or with CLI:

``` shell
aws ec2 run-instances \
--image-id ami-0b5eea76982371e91 \
--count 1 \
--instance-type m5.xlarge \
--key-name <key-name> \
--security-group-ids sg-0a006bcdd6147509f \
--tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=my-nitro-tee-1}]' \
--enclave-options 'Enabled=true'
```

If you go with the UI:
- Pick a instance good enough such as md5.xlarge, enable nitro 
- Make sure that the ports needed by your application are open by checking the security group, in "security" tab in the instance screen.

### Setup nitro cli

[see doc](https://docs.aws.amazon.com/enclaves/latest/user/nitro-enclave-cli-install.html)

``` shell
sudo /setup.sh
```


Allocate more memory for the enclave if necessary
``` shell
sudo nano /etc/nitro_enclaves/allocator.yaml

sudo systemctl restart nitro-enclaves-allocator.service

```

## Run enclave

- clone this repo in the instance 

``` shell
make
```
### Start gvproxy 

Gvproxy is a reverse proxy that allows the enclave to communicate with the outside world.

Use screen to run gvproxy in background

``` shell
screen
./gvproxy.sh
```

### Run in production mode

``` shell
sudo ./run-enclave.sh <image_eif>
```

### Test

Get current instance ip

``` shell
curl ifconfig.me
```

call config endpoint to confirm that the enclave is running

``` shell
curl http://127.0.0.1:7047/api/v1/config
```

### Measure enclave PCRS to verify code hash

``` shell
nitro-cli describe-enclaves
```

## Setup environment variables

The env variable system is similar to variables in a smart contract. 
An operator address is hardcoded before enclave initialization.
After deployment, the operator can set the environment variables using a SECP256k1 signature.
Message is (tee_name, function, var_name, new_value).
Variables can also have immutable property, and therefore be set only once.
The difference with a smart contract is that the environment variables can be set to hidden.
Hidden variables can be changed to public, but not the other way.
Similarly, mutable variables can be changed to immutable, but not the other way.


Example:

``` shell
curl --location 'http://127.0.0.1:7047/api/v1//variables' \
--header 'Content-Type: application/json' \
--data '{
    "variables": [ {
    "name": "anthropic_api_key" ,
    "value": "sk-proj-f-xxxxxx",
    "signature": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}]
}
'
```

## Prompting Chat Agent

All responses are signed using the TEE Agent key.

```
        result = {}
        result["model"] = model
        result["response"] = prompt_openrouter(model, system_prompt, messages, tools, tool_choice)
        result["messages"] = messages
        result["tools"] = tools
        result["system_prompt"] = system_prompt
        result["signature"] = sign_ethereum_message(str(result), private_key.to_string().hex())  
```

Query endpoint 

```
curl --location 'http://127.0.0.1:7047/api/v1/prompt' \
--header 'Content-Type: application/json' \
--data '{
    "system_prompt": "You are a helpful AI assistant focused on technical writing and documentation.",
    "messages": [
        {
            "role": "user",
            "content": "give me the weather in paris"
        }
    ],
    "tools": [
        {
            "type": "function",
            "function": {
                "name": "get_weather",
                "description": "Get the current weather",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "location": {
                            "type": "string"
                        },
                        "unit": {
                            "type": "string",
                            "enum": [
                                "celsius",
                                "fahrenheit"
                            ]
                        }
                    },
                    "required": [
                        "location"
                    ]
                }
            }
        }
    ]
}'
```
## Signing and broadcasting transaction

 `POST /api/v1/sign-transaction`

ETH transfer Request
 ```
 {
    "transaction": {
        "to": "0x86693CbE3f2581DF512635823F46f0d593D96dbA",
        "value": 3,
        "data": "0x"
    },
    "rpc_url": "https://sepolia.base.org"
}
 ```

 ERC20 transfer Request
 ```
 {
    "transaction": {
        "to": "0x1c23A3912247f104D707dfEf41F4B7842B241d4B",
        "value": 0,
        "data": "0xa9059cbb00000000000000000000000000693cbe3f2581df512635823f46f0d593d96dba0000000000000000000000000000000000000000000000000000048c27395000",
        "gas": 60000
    },
    "rpc_url": "https://sepolia.base.org"
}
 ```

Response
 ```
 {
    "signed_transaction": "0xf8668180830f43cb8252089486693cbe3f2581df512635823f46f0d593d96dba03808302948ca01a05e840f30baa629670d7c7c68b1ed3898a6f5fbd5ff3581663f3de323ccf1ba03d43ae83cdf13530ee45741169d71c6fef92bf6daa0015b4716e92380c7df827",
    "transaction_hash": "0xde41dd0a0eac568e51306acff9742fe6503f4c57c0735f43b813a82be260bc48"
}
 ```

