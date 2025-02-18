from eth_account import Account
import hashlib
from typing import Tuple

def generate_eth_wallet(random_string: str) -> Tuple[str, str]:
    """
    Generate an Ethereum wallet from a random string input.
    Returns a tuple of (private_key, address)
    
    Args:
        random_string (str): Random string to seed the wallet generation
        
    Returns:
        Tuple[str, str]: (private_key_hex, ethereum_address)
    """
    # Create a SHA256 hash of the input string to get 32 bytes
    hashed = hashlib.sha256(random_string.encode()).digest()
    
    # Create an account from the private key
    account = Account.from_key(hashed)
    
    # Get the private key and address
    private_key = account.key.hex()
    address = account.address
    
    return private_key, address

