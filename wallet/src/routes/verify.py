from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import requests
from config import logger
from db.prisma import prisma
import subprocess
import json

router = APIRouter()

RUST_BINARY_PATH = "../rust_tlsn_llm_verifier/target/release/rust_tlsn_llm_verifier"

def execute_rust_command(command: str):
    try:
        # Add check=True to raise an exception if the command fails
        # Shell=False is safer when possible
        process = subprocess.run(
            command.split(),  # Split command into list
            check=True,
            capture_output=True,
            text=True
        )
        
        # Check both stdout and stderr
        if process.stderr:
            logger.warning(f"Rust program stderr: {process.stderr}")
            
        return process.stdout
    except subprocess.CalledProcessError as e:
        logger.error(f"Rust command failed with exit code {e.returncode}: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Error executing Rust command: {e}")
        return None

def build_rust_command(file_key: str, agent_host: str):
    return ' '.join([
        RUST_BINARY_PATH,
        '--file-key',
        file_key,
        '--agent-host',
        agent_host,
    ])


@router.post("/verify")
async def verify_attestation(request: Request):
    try:
        request_data = await request.json()
        address = request_data.get('address')
        attestation = request_data.get('attestation')

        if not address:
            return JSONResponse(
                content={'error': 'Address is required'},
                status_code=400
            )
        
        if not attestation:
            return JSONResponse(
                content={'error': 'Attestation is required'},
                status_code=400
            )
        
        wallet = await prisma.wallet.find_unique(
            where={
                'walletAddress': address
            }
        )

        if not wallet:
            return JSONResponse(
                content={'error': 'Wallet not found'},
                status_code=404
            )
        
        print(wallet, attestation)

        if wallet.domain == "https://playground.constella.one":
            wallet.domain = "http://localhost:3001"
        
        command = build_rust_command(attestation, wallet.domain)
        print('command', command)

        output = execute_rust_command(command)
        print('output', output)

        output_json = json.loads(output)
        print('output_json', output_json)

        return JSONResponse(
            content={'output': output_json},
            status_code=200
        )
    except Exception as e:
        logger.error(f"Error verifying attestation: {e}")
        return JSONResponse(
            content={'error': 'Internal server error'},
            status_code=500
        )
