"""
Clerk SDK-based authentication for FastAPI endpoints
"""
import logging
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from clerk_backend_api import Clerk
from clerk_backend_api.security.types import AuthenticateRequestOptions
import httpx

from philoagents.config import settings

logger = logging.getLogger(__name__)

# Security scheme for extracting Bearer tokens
security = HTTPBearer()


class User(BaseModel):
    """Authenticated user model"""
    id: str
    email: Optional[str] = None
    username: Optional[str] = None


class ClerkAuthenticator:
    """
    Clerk SDK-based authentication handler for JWT token verification.
    """
    
    def __init__(self):
        if settings.CLERK_SECRET_KEY:
            self.clerk_client = Clerk(bearer_auth=settings.CLERK_SECRET_KEY)
            self.clerk_enabled = True
            logger.info("Clerk authentication initialized")
        else:
            self.clerk_enabled = False
            self.clerk_client = None
            logger.warning("CLERK_SECRET_KEY not configured - Clerk authentication disabled")
        
        # Fallback to generic JWT if available
        self.jwt_secret_key = getattr(settings, 'JWT_SECRET_KEY', None)
        self.jwt_algorithm = getattr(settings, 'JWT_ALGORITHM', 'HS256')
    
    def verify_token(self, token: str) -> Optional[dict]:
        """
        Verify JWT token using Clerk SDK.
        """
        # Try Clerk verification first
        if self.clerk_enabled and self.clerk_client:
            try:
                # Decode JWT to get session info
                from jose import jwt
                unverified_payload = jwt.decode(token, key="", options={"verify_signature": False})
                session_id = unverified_payload.get('sid')
                
                if session_id:
                    # Verify the session using Clerk API
                    session = self.clerk_client.sessions.get(session_id=session_id)
                    
                    if session and session.status == 'active':
                        return {
                            "sub": session.user_id,
                            "user_id": session.user_id,
                            "session_id": session_id,
                            "email": None,
                            "username": None
                        }
                        
            except Exception as session_error:
                logger.debug(f"Clerk session verification failed: {session_error}")
        
        # Fallback to generic JWT verification
        if self.jwt_secret_key:
            try:
                from jose import jwt, JWTError
                payload = jwt.decode(
                    token,
                    self.jwt_secret_key,
                    algorithms=[self.jwt_algorithm]
                )
                return payload
            except JWTError as e:
                logger.debug(f"Generic JWT verification failed: {e}")
        
        return None
    
    def extract_user_from_payload(self, payload: dict) -> User:
        """
        Extract user information from verified payload.
        """
        # Extract user ID
        user_id = payload.get("user_id") or payload.get("sub")
        if not user_id:
            raise ValueError("No user ID found in token payload")
        
        return User(
            id=str(user_id),
            email=payload.get("email"),
            username=payload.get("username")
        )


# Global authenticator instance
authenticator = ClerkAuthenticator()


async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """
    FastAPI dependency to extract and validate current user from JWT token.
    
    Usage:
        @app.get("/protected")
        async def protected_endpoint(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    """
    try:
        # Extract token from Authorization header
        token = credentials.credentials
        
        # Verify token and extract payload
        payload = authenticator.verify_token(token)
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Extract user information
        user = authenticator.extract_user_from_payload(payload)
        return user
        
    except ValueError as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))) -> Optional[User]:
    """
    Optional authentication dependency for endpoints that can work with or without authentication.
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


async def get_current_user_from_query_or_header(
    token: Optional[str] = None,
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> User:
    """
    Authentication dependency that supports both query parameter and header authentication.
    Used for streaming endpoints where EventSource cannot send custom headers.
    """
    try:
        # Try token from query parameter first
        if token:
            payload = authenticator.verify_token(token)
            if payload:
                user = authenticator.extract_user_from_payload(payload)
                return user
        
        # Fall back to header authentication
        if credentials:
            token_from_header = credentials.credentials
            payload = authenticator.verify_token(token_from_header)
            if payload:
                user = authenticator.extract_user_from_payload(payload)
                return user
        
        # No valid authentication found
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    except ValueError as e:
        logger.error(f"Token validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )