import os
import logging

# API Configuration
API_URL_PREFIX = "/api/v1"
PORT = 7048
TEE_NAME = "constella_wallet"

# Nitriding Configuration
NITRIDING_URL = "http://127.0.0.1:8080/enclave"
NITRIDING_EXT_URL = "https://3.6.235.47:8443"

# CORS Configuration
FRONTEND_HOST = os.getenv("FRONTEND_HOST")

# Logging Configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__) 