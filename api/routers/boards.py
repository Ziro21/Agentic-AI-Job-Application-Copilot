from __future__ import annotations

import datetime as dt
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from api.db import get_db
from db.models import Board

router = APIRouter(tags=["boards"])


@router.post("/boards/{board_id}/reactivate")
def reactivate_board(board_id: uuid.UUID, db: Session = Depends(get_db)):
    """Reactivate a board that was automatically disabled due to 404s."""
    board = db.get(Board, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board not found")

    board.is_active = True
    board.updated_at = dt.datetime.now(dt.timezone.utc)
    db.commit()
    return {"status": "success", "message": f"Board {board.token} reactivated"}
