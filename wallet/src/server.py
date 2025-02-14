import urllib.request
import logging
import requests
from utils import *
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

import uvicorn
app = FastAPI()

NITRIDING_URL = "http://127.0.0.1:8080/enclave"
NITRIDING_EXT_URL = "https://3.6.235.47:8443"

API_URL_PREFIX = "/api/v1"
PORT = 7047

TEE_NAME = "constella_wallet"

# logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@app.get(API_URL_PREFIX + "/config")
async def get_tee_config(request: Request):
    """Get the TEE configuration"""
    attestation = get_attestation(NITRIDING_EXT_URL)

    return {
        "tee_name": TEE_NAME,
        "code_attestation": attestation.decode("utf-8"),
    }
 
def signal_ready(nitriding_url):
    """Signal the TEE that the API is ready"""
    print("🔑 signal_ready", nitriding_url)
    r = urllib.request.urlopen(nitriding_url + "/ready")
    if r.getcode() != 200:
        raise Exception(
            "Expected status code %d but got %d"
            % (r.status_codes.codes.ok, r.status_code)
        )

@app.get(API_URL_PREFIX + "/")
def home():
    return "Hello world, I am running in an enclave !"

@app.post(API_URL_PREFIX + "/dummy-data")
async def get_dummy_data(request: Request):
    try:
        # Get the request data
        request_data = await request.json()
        
        # Extract the endpoint from the request data
        endpoint = request_data.get('endpoint', 'products')
        
        # Get the data from the endpoint
        response = requests.get(f'https://dummyjson.com/{endpoint}')
        
        # Check if the request was successful
        if response.status_code == 200:
            return JSONResponse(content=response.json(), status_code=200)
        else:
            return JSONResponse(
                content={
                    'error': 'Failed to fetch data from DummyJSON',
                    'status_code': response.status_code,
                    'message': f'The endpoint {endpoint} returned an error'
                },
                status_code=response.status_code
            )
        
    except Exception as e:
        return JSONResponse(
            content={
                'error': 'Internal server error',
                'message': str(e)
            },
            status_code=500
        )

if __name__ == "__main__":
    print("🤖 Starting TEE-Agent")
    try:
        signal_ready(NITRIDING_URL)
        print("[py] Signalled to nitriding that we're ready.")
    except Exception as e:
        print(f"Error during signal_ready: {e} \n Are you running inside an enclave?")

    uvicorn.run(app, host="0.0.0.0", port=PORT)
