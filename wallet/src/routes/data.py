from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import requests
from ..config import logger
from ..db.prisma import prisma
router = APIRouter()

@router.post("/dummy-data")
async def get_dummy_data(request: Request):
    try:
        request_data = await request.json()
        endpoint = request_data.get('endpoint', 'products')
        
        response = requests.get(f'https://dummyjson.com/{endpoint}')
        
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