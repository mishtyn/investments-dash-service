from fastapi import APIRouter

from app.api import investments

router = APIRouter()

router.include_router(investments.router, prefix="/investments", tags=["investments"])

