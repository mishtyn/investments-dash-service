from fastapi import APIRouter

from app.api import investments, auth

router = APIRouter()

router.include_router(auth.router, prefix="/auth", tags=["authentication"])
router.include_router(investments.router, prefix="/investments", tags=["investments"])

