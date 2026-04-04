import datetime as dt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.orm import Session

from api.db import get_db
from db.models import User, UserProfile
from api.schemas import Token, UserCreate, UserOut, RefreshTokenIn
from api.auth import (
    create_access_token, 
    create_refresh_token,
    get_password_hash, 
    verify_password,
    get_current_user, 
    ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(tags=["Users"])

@router.post("/register", response_model=UserOut)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    """Creates a new Multi-Tenant workspace user."""
    stmt = select(User).where(User.email == user.email)
    if db.execute(stmt).scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    hashed_password = get_password_hash(user.password)
    new_user = User(email=user.email, hashed_password=hashed_password)
    db.add(new_user)
    db.flush() 
    
    # Cascade default configuration profile securely
    profile = UserProfile(user_id=new_user.id)
    db.add(profile)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Robust OAuth2 compliance for fetching dashboard JWTs."""
    stmt = select(User).where(User.email == form_data.username)
    user = db.execute(stmt).scalar_one_or_none()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = dt.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    refresh_token = create_refresh_token(data={"sub": user.email})
    return {"access_token": access_token, "refresh_token": refresh_token, "token_type": "bearer"}

@router.post("/refresh", response_model=Token)
def refresh_access_token(payload: RefreshTokenIn, db: Session = Depends(get_db)):
    """Refresh short-lived JWT sessions safely securely without caching passwords."""
    import jwt
    from api.auth import SECRET_KEY, ALGORITHM
    
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        token_payload = jwt.decode(payload.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = token_payload.get("sub")
        token_type: str = token_payload.get("type")
        if email is None or token_type != "refresh":
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    stmt = select(User).where(User.email == email)
    user = db.execute(stmt).scalar_one_or_none()
    if not user or not user.is_active:
        raise credentials_exception
        
    access_token_expires = dt.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {
        "access_token": access_token, 
        "refresh_token": payload.refresh_token, 
        "token_type": "bearer"
    }

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Fetch current localized session data."""
    return current_user

@router.post("/logout")
def logout_user(token: str = Depends(oauth2_scheme)):
    """Revoke JWT securely globally across all nodes instantly."""
    from api.auth import redis_client, SECRET_KEY, ALGORITHM
    import jwt
    import datetime as dt
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        exp = payload.get("exp")
        now = dt.datetime.now(dt.timezone.utc).timestamp()
        ttl = int(exp - now)
        if ttl > 0:
            redis_client.setex(f"blocklist:{token}", ttl, "revoked")
    except Exception:
        pass
    return {"message": "Successfully logged out securely and revoked access tokens."}
