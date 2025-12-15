"""
Asset API Routes

CRUD operations for assets.
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.repositories.asset_repository import asset_repository
from app.schemas.asset import AssetCreate, AssetUpdate, AssetResponse

router = APIRouter()


@router.post("/", response_model=AssetResponse, status_code=status.HTTP_201_CREATED)
def create_asset(asset: AssetCreate, db: Session = Depends(get_db)):
    """Create a new asset."""
    return asset_repository.create(db, asset.model_dump())


@router.get("/", response_model=List[AssetResponse])
def list_assets(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all assets."""
    return asset_repository.get_all(db, skip=skip, limit=limit)


@router.get("/{asset_id}", response_model=AssetResponse)
def get_asset(asset_id: str, db: Session = Depends(get_db)):
    """Get an asset by ID."""
    asset = asset_repository.get(db, asset_id)
    if not asset:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {asset_id} not found"
        )
    return asset


@router.put("/{asset_id}", response_model=AssetResponse)
def update_asset(asset_id: str, asset: AssetUpdate, db: Session = Depends(get_db)):
    """Update an asset."""
    # Filter out None values
    update_data = {k: v for k, v in asset.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid update data provided"
        )
    
    updated = asset_repository.update(db, asset_id, update_data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {asset_id} not found"
        )
    return updated


@router.delete("/{asset_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asset(asset_id: str, db: Session = Depends(get_db)):
    """Delete an asset."""
    deleted = asset_repository.delete(db, asset_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Asset {asset_id} not found"
        )
    return None


@router.get("/category/{category}", response_model=List[AssetResponse])
def get_assets_by_category(category: str, db: Session = Depends(get_db)):
    """Get all assets in a category."""
    return asset_repository.get_by_category(db, category)

