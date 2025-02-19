from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from db.prisma import prisma
import uvicorn

from config import (
    API_URL_PREFIX, PORT, TEE_NAME, 
    NITRIDING_URL, NITRIDING_EXT_URL, 
    FRONTEND_HOST
)
from utils.nitriding import signal_ready
from utils.utils import get_attestation
from routes import auth, data, verify

app = FastAPI()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_HOST],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Event handlers
@app.on_event("startup")
async def startup():
    await prisma.connect()

@app.on_event("shutdown")
async def shutdown():
    await prisma.disconnect()

# Base routes
@app.get(API_URL_PREFIX + "/")
def home():
    return "Hello world, I am running in an enclave !"

@app.get(API_URL_PREFIX + "/config")
async def get_tee_config(request: Request):
    """Get the TEE configuration"""
    attestation = get_attestation(NITRIDING_EXT_URL)
    return {
        "tee_name": TEE_NAME,
        "code_attestation": attestation.decode("utf-8"),
    }

# Include routers
app.include_router(auth.router, prefix=API_URL_PREFIX)
app.include_router(data.router, prefix=API_URL_PREFIX)
app.include_router(verify.router, prefix=API_URL_PREFIX)

if __name__ == "__main__":
    print("🤖 Starting TEE-Agent")
    try:
        signal_ready(NITRIDING_URL)
        print("[py] Signalled to nitriding that we're ready.")
    except Exception as e:
        print(f"Error during signal_ready: {e} \n Are you running inside an enclave?")

    uvicorn.run(app, host="0.0.0.0", port=PORT) 