from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from ..db.prisma import prisma
from ..utils.utils import generate_nonce, generate_wallet_hash
from ..config import logger
from ..web3.wallet import generate_eth_wallet

router = APIRouter()

@router.post("/register/get-nonce")
async def get_or_create_nonce(request: Request):
    try:
        request_data = await request.json()
        user_address = request_data.get('userAddress')

        if not user_address:
            return JSONResponse(
                content={'error': 'userAddress is required'},
                status_code=400
            )

        user = await prisma.user.find_unique(
            where={
                'userAddress': user_address
            }
        )

        if user:
            return JSONResponse(
                content={'nonce': user.nonce},
                status_code=200
            )
        else:
            new_nonce = generate_nonce()
            user = await prisma.user.create(
                data={
                    'userAddress': user_address,
                    'nonce': new_nonce
                }
            )

            return JSONResponse(
                content={'nonce': new_nonce},
                status_code=201
            )

    except Exception as e:
        logger.error(f"Error in get_or_create_nonce: {str(e)}")
        return JSONResponse(
            content={
                'error': 'Internal server error',
                'message': str(e)
            },
            status_code=500
        ) 
    
@router.post("/register/wallet")
async def register_wallet(request: Request):
    try:
        request_data = await request.json()
        address = request_data.get('address')
        domain = request_data.get('domain')
        system_prompt = request_data.get('systemPrompt')

        print(address, domain, system_prompt)

        if not domain or not system_prompt:
            return JSONResponse(
                content={'error': 'domain and systemPrompt are required'},
                status_code=400
            )

        user = await prisma.user.find_unique(
            where={
                'userAddress': address
            }
        )
        
        if not user or not user.nonce:
            return JSONResponse(
                content={'error': 'User not found'},
                status_code=404
            )
        
        wallet_hash = generate_wallet_hash(user.nonce, domain, system_prompt)
        private_key, address = generate_eth_wallet(wallet_hash)

        check_wallet_exists = await prisma.wallet.find_unique(
            where={
                'walletAddress': address
            }
        )

        if check_wallet_exists:
            return JSONResponse(
                content={'error': 'Wallet already exists', 'address': address},
                status_code=400
            )
        
        await prisma.wallet.create(
            data={
                'walletAddress': address,
                'privateKey': private_key,
                'domain': domain,
                'systemPrompt': system_prompt
            }
        )

        return JSONResponse(
            content={'address': address},
            status_code=201
        )
    except Exception as e:
        return JSONResponse(
            content={
                'error': 'Internal server error',
                'message': str(e)
            },
            status_code=500)