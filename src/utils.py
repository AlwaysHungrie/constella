import hashlib
import ecdsa
import ssl
import urllib.request
from eth_hash.auto import keccak
from eth_account.messages import encode_defunct
from web3 import Web3
from eth_account import Account

def pubkey_to_eth_address(public_key_hex):
    """Convert a public key to an Ethereum address"""
    keccak_hash = keccak(bytes.fromhex(public_key_hex))
    eth_address = "0x" + keccak_hash[-20:].hex()
    return eth_address
    
def get_attestation(nitriding_ext_url):
    """Get the TEE code attestation"""
    url = (
        nitriding_ext_url
        + "/enclave/attestation?nonce=0123456789abcdef0123456789abcdef01234567"
    )
    print(url)
    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    r = urllib.request.urlopen(url, context=context)
    if r.getcode() != 200:
        return "Error fetching nitriding"
    else:
        return r.read()
    
def sign_message(message, private_key):
    """Sign a message"""
    messageb = bytes(message, "utf-8")
    # Create a SHA-256 hash of the message
    message_hash = hashlib.sha256(messageb).digest()
    print("message_hash: ", message_hash.hex())
    public_key = private_key.verifying_key
    print("public_key: ",  public_key.to_string().hex())
    print("message: ",  message)
    signature = private_key.sign_deterministic(message_hash)
    print("signature: ", signature.hex())
    return signature.hex()

def verify_signature(signature_str, public_key_str, message_str):
    """Verify a signature"""
    signature = bytes.fromhex(signature_str)
    message = bytes(message_str, "utf-8")

    public_key = ecdsa.VerifyingKey.from_string(
        bytes.fromhex(public_key_str), curve=ecdsa.SECP256k1
    )
    message_hash = hashlib.sha256(message).digest()

    try:
        result = public_key.verify(signature, message_hash)
    except ecdsa.BadSignatureError:
        return False  # Return False if the signature is invalid
    return result


def test_verify_signature(tee_name, operator_pubkey):
    signature = "0a3a65c5b35cca957bd8992f6944d2434370bad3bcf503756e7767b0d54e84ace81e6ff0e8d11210706ff299c512bfed555ff2c3b7525c672e30d040a51f2ce0"
    message = f"{tee_name};update_variables;anthropic_api_key;123"
    result = verify_signature(signature, operator_pubkey, message)
    print("signature valid: ", result)
    return result


def test_operator_sign(tee_name, operator_pkey_str, function, variable, value):
    message = bytes(f"{tee_name};{function};{variable};{value}", "utf-8")
    message_hash = hashlib.sha256(message).digest()
    private_key = ecdsa.SigningKey.from_string(
        bytes.fromhex(operator_pkey_str), curve=ecdsa.SECP256k1
    )
    signature = private_key.sign(message_hash)
    print("signature: ", variable, signature.hex())
    return signature.hex()

def sign_ethereum_message(message: str, private_key: str) -> dict:
    print("sign_ethereum_message: ", private_key)
    w3 = Web3()
    
    message_with_prefix = encode_defunct(text=message)
    
    signed_message = w3.eth.account.sign_message(
        message_with_prefix,
        private_key=private_key
    )
    
    public_key = get_public_key_from_private(private_key)
    eth_address = pubkey_to_eth_address(public_key)

    print("eth_address: ", eth_address)
    print("message: ", message)
    print("signature: ", signed_message.signature.hex())
    print("messageHash: ", signed_message.message_hash.hex())
    
    return "0x" + signed_message.signature.hex()

def get_public_key_from_private(private_key_hex: str) -> str:
    """Convert a private key to its corresponding public key"""
    private_key = ecdsa.SigningKey.from_string(
        bytes.fromhex(private_key_hex), 
        curve=ecdsa.SECP256k1
    )
    public_key = private_key.get_verifying_key()
    return public_key.to_string().hex()
