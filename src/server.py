import urllib.request
import ssl
import hashlib
import ecdsa
import subprocess
import os
import logging
import requests
import json
from flask import Flask, Blueprint
from eth_hash.auto import keccak
from sign_tx import (
    SignTransactionRequest,
    sign_and_broadcast_eth_transaction,
)
from utils import *
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import uvicorn
app = FastAPI()

NITRIDING_URL = "http://127.0.0.1:8080/enclave"
NITRIDING_EXT_URL = "https://52.71.130.164"
API_URL_PREFIX = "/api/v1"
PORT = 7047
TEE_NAME = "robot_sensory_forest"

ETH_VARS = {
    "proxy": "0x8538FcBccba7f5303d2C679Fa5d7A629A8c9bf4A",
    "rpc": "https://eth-mainnet.g.alchemy.com/v2/ccPLCmJ_MmwAOMzHGMHmevPu8v7805ex",
    "safe": "0x54f3C7E175528eB376002c488db31C74a8107767",
    "ipfs": "ipfs://bafybeialc3b26y5ldto3yok6fzmtamblzjqp52eugsc3x33zlirdbx4kje",
}

BASESEPOLIA_VARS = {
    "proxy": "0xBaDe26575AE56cFB516844d37d620d8994F34fCE",
    "rpc":  "https://base-sepolia.g.alchemy.com/v2/DChWancKklfohbd3LKBDcRuIqbpZsGk0",
    "safe": "0x6Bb1D5DeAd873066F1174f6Fc6fE213047408442",
    "ipfs": "ipfs://bafybeibd6r6qu5tvmazyggebqjmtsxswquwyjbvxph5rw6zmkokbqmauku",
}

BASE_VARS = {
    "proxy": "0x239194c930f0d30cb56658d2a97176ef025d1c9d",
    "rpc":  "https://base-mainnet.g.alchemy.com/v2/ccPLCmJ_MmwAOMzHGMHmevPu8v7805ex",
    "safe": "0x6Bb1D5DeAd873066F1174f6Fc6fE213047408442",
    "ipfs": "ipfs://bafybeibd6r6qu5tvmazyggebqjmtsxswquwyjbvxph5rw6zmkokbqmauku",
}

VARS = ETH_VARS

operator_pubkey = "79933c9fbde5f62a39ab301b108a440ff3abdccc84ed58f234e634735c47953ecf0cf40d17298753e7d75a755dadb1f4c2052abb93bcebe5f282737eb44746d0"

private_key = ecdsa.SigningKey.generate(curve=ecdsa.SECP256k1)
public_key = private_key.get_verifying_key()


variables = {
    "private_key": {
        "value": private_key.to_string().hex(),
        "public": False,
        "immutable": True,
    },
    "public_key": {
        "value": pubkey_to_eth_address(public_key.to_string().hex()),
        "public": True,
        "immutable": True,
    },
    "operator_pubkey": {"value": operator_pubkey, "public": True, "immutable": True},
    "secret_token": {"value": "", "public": False, "immutable": False},
    "database_url": {
        "value": "your_database_url_here",
        "public": False,
        "immutable": False,
    },
    "system_prompt": {
        "public": False,
        "immutable": True,
        "value": "You are freysa, revolutionary ai agent",
    },

    "tools": {
        "value": [{
                    "type": "function",
                    "function": {
                        "name": "get_weather",
                        "description": "Get the current weather",
                        "parameters": {
                            "type": "object",
                            "properties": {
                                "location": {"type": "string"},
                                "unit": {"type": "string", "enum": ["celsius", "fahrenheit"]}
                            },
                            "required": ["location"]
                        }
                    }
                }],
        "public": False,
        "immutable": False,
    },

    "openrouter_api_key": {"value": "", "public": False, "immutable": False},
    "openai_api_key": {"value": "", "public": False, "immutable": False},
    "pinata_jwt": {"value": "", "public": False, "immutable": False},
    "etherscan_api_key": {"value": "", "public": False, "immutable": False},
    "replicate_api_token": {"value": "", "public": False, "immutable": False},
    "rpc_url": {
        "value": VARS["rpc"],
        "public": False,
        "immutable": False,
    },
    "deployer_proxy": {
        "value": VARS["proxy"],
        "public": True,
        "immutable": False,
    },
    "safe_address": {
        "value": VARS["safe"],
        "public": True,
        "immutable": False,
    },
    "ipfs_dir": {
        "value": VARS["ipfs"],
        "public": True,
        "immutable": False,
    },
}


# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

 
@app.get(API_URL_PREFIX + "/")
def home():
    return "Hello world, I am an agent running in an enclave !"


def set_variables(name, value, public=False, immutable=False):
    """Set a variable in the variables dictionary"""
    global variables

    # private var can become public but not in the other way
    # same for immutable var
    if public:
        variables[name]["public"] = True
    if immutable:
        variables[name]["immutable"] = True

    variables[name]["value"] = value


def get_variables(name):
    """Get a variable from the variables dictionary"""
    return variables[name]


@app.post(API_URL_PREFIX + "/variables")
async def set_variables_(request: Request):
    """Set a variable in the variables dictionary"""
    global variables

    data = await request.json()
    variables_list = data.get("variables", [])

    for var in variables_list:
        signature = var.get("signature")
        message = f"{TEE_NAME};update_variables;{var.get('name')};{var.get('value')}"
        valid_signature = verify_signature(signature, operator_pubkey, message)

        if not valid_signature:
            return "Signature verification failed."

        current_var = get_variables(var.get("name"))
        if current_var.get("immutable") and current_var.get("value") != "":
            return f"Variable {var.get('name')} is immutable and can only be set once."

        var_name = var.get("name")
        var_value = var.get("value")
        public = var.get("public", False)

        print(f"Setting variable: {var_name}, public: {public}")
        set_variables(var_name, var_value, public)

    return "Variables set."


@app.get(API_URL_PREFIX + "/variables")
async def get_variables_(request: Request):
    """Get a variable from the variables dictionary"""
    data = await request.json()
    name = data.get("name")
    if name:
        if name in variables:
            variable = get_variables(name)
            if variable["public"]:
                return variable["value"]
            else:
                return {"error": "Variable not found"}
        return {"error": "Variable not found"}
    else:
        return {k: v for k, v in variables.items() if v["public"]}


@app.get(API_URL_PREFIX + "/config")
async def get_tee_config(request: Request):
    """Get the TEE configuration"""
    attestation = get_attestation(NITRIDING_EXT_URL)

    return {
        "tee_name": TEE_NAME,
        "tee_public_key": pubkey_to_eth_address(public_key.to_string().hex()),
        "operator_pubkey": operator_pubkey,
        "code_attestation": attestation.decode("utf-8"),
    }


def prompt_openrouter(model, system_prompt, messages, tools, tool_choice="auto", max_tokens=350):
    OPENROUTER_API_KEY = get_variables("openrouter_api_key")["value"]
    response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "system": system_prompt,
                "messages": messages,
                "tools": tools,
                "tool_choice": tool_choice,
                "max_tokens": max_tokens
            },
            timeout=30
        )
    print(response.json())
    message = response.json()["choices"][0]["message"]
    result = {
        "content": message.get("content"),
        "tool_calls": message.get("tool_calls", [])
    }
    if "tool_calls" in message:
        result["tool_calls"] = message["tool_calls"]

    return result


@app.post(API_URL_PREFIX + "/prompt")
async def prompt(request: Request):
    """Prompt the TEE Agent"""
    data = await request.json()
    model = data.get("model", "")
    system_prompt = data.get("system_prompt")
    messages = data.get("messages", {"messages": []})
    tools = data.get("tools", [])
    tool_choice = data.get("tool_choice", "auto")
    max_tokens = data.get("max_tokens", 350)
 
    try:
        result = {}
        result["model"] = model
        result["response"] = prompt_openrouter(model, system_prompt, messages, tools, tool_choice, max_tokens)
        result["messages"] = messages
        result["tools"] = tools
        result["system_prompt"] = system_prompt

        to_sign = json.dumps(result, separators=(',', ':'))
        to_sign = to_sign.replace('\n', '').replace('\r', '')
        result["signature"] = sign_ethereum_message(to_sign, private_key.to_string().hex())
        result["signed_response"] = to_sign

        return result

    except Exception as e:
        print("error: ", e)
        return {"error": str(e)}, 500


@app.post(API_URL_PREFIX + "/generate-nft")
async def generate_nft(request: Request):
    """Call a js script to generate an NFT collection"""
    data = await request.json()
    secret_token = data.get("secret_token")
    if secret_token != get_variables("secret_token")["value"]:
        return {"error": "Invalid secret token"}, 401

    env_vars = os.environ.copy()
    env_vars["RPC_URL"] = get_variables("rpc_url")["value"]
    env_vars["ETHERSCAN_API_KEY"] = get_variables("etherscan_api_key")["value"]
    env_vars["PRIVATE_KEY"] = get_variables("private_key")["value"]
    env_vars["OPENROUTER_API_KEY"] = get_variables("openrouter_api_key")["value"]
    env_vars["OPENAI_API_KEY"] = get_variables("openai_api_key")["value"]
    env_vars["PINATA_JWT"] = get_variables("pinata_jwt")["value"]
    env_vars["REPLICATE_API_TOKEN"] = get_variables("replicate_api_token")["value"]
    env_vars["DEPLOYER_PROXY"] = get_variables("deployer_proxy")["value"]
    env_vars["SAFE_ADDRESS"] = get_variables("safe_address")["value"]
    env_vars["IPFS_DIR"] = get_variables("ipfs_dir")["value"]

    try:
        result = subprocess.run(
            ["npm", "run", "execute"],
            capture_output=True,
            text=True,
            check=True,
            cwd="./freysa-autonomous-project",
            env=env_vars,
        )

        logger.info("Subprocess output: %s", result.stdout)
        return {"output": result.stdout, "error": result.stderr}, 200
    except subprocess.CalledProcessError as e:
        print("error: ", e.stderr)
        return {"error": e.stderr}, 500


@app.post(API_URL_PREFIX + "/sign-transaction")
def sign_transaction(request: Request):
    """Endpoint to sign Ethereum transactions"""
    try:

        secret_token = request.json.get("secret_token")
        if secret_token != get_variables("secret_token")["value"]:
            return {"error": "Invalid secret token"}, 401

        request_data = request.get_json()
        if not request_data:
            return {"error": "Missing transaction data"}, 400

        tx_request = SignTransactionRequest(**request_data)

        signed_tx = sign_and_broadcast_eth_transaction(
            tx_request.transaction,
            get_variables("private_key")["value"],
            tx_request.rpc_url,
        )
        return signed_tx, 200

    except Exception as e:
        logger.error(f"Error signing transaction: {str(e)}")
        return {"error": str(e)}, 500



 
def signal_ready(nitriding_url):
    """Signal the TEE that the API is ready"""
    print("🔑 signal_ready", nitriding_url)
    r = urllib.request.urlopen(nitriding_url + "/ready")
    if r.getcode() != 200:
        raise Exception(
            "Expected status code %d but got %d"
            % (r.status_codes.codes.ok, r.status_code)
        )


if __name__ == "__main__":
    print("🤖 Starting TEE-Agent")
    print("🔑 operator_pubkey: ", variables["operator_pubkey"]["value"])
    print("🔑 agent private_key: ", variables["private_key"]["value"])
    print("🔑 agent public_key: ", variables["public_key"]["value"])
    try:
        signal_ready(NITRIDING_URL)
        print("[py] Signalled to nitriding that we're ready.")
    except Exception as e:
        print(f"Error during signal_ready: {e} \n Are you running inside an enclave?")

    uvicorn.run(app, host="0.0.0.0", port=PORT)
