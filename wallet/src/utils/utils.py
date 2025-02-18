import ssl
import urllib.request
import secrets
import hashlib

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


# create a random 256 bit nonce
def generate_nonce():
    return secrets.token_hex(32)

def generate_wallet_hash(nonce, domain, system_prompt):
    return hashlib.sha256(f"{nonce}{domain}{system_prompt}".encode()).hexdigest()