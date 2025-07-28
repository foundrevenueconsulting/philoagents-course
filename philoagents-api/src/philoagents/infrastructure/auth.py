"""
JWT Authentication utilities for securing API endpoints
"""
import logging
from typing import Optional
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
import requests
from functools import lru_cache

from philoagents.config import settings

logger = logging.getLogger(__name__)

# Security scheme for extracting Bearer tokens
security = HTTPBearer()


class User(BaseModel):
    """Authenticated user model"""
    id: str
    email: Optional[str] = None
    username: Optional[str] = None


class JWTAuthenticator:
    """
    JWT Authentication handler that validates tokens and extracts user information.
    Supports Clerk.dev tokens and can be extended for other JWT providers.
    """
    
    def __init__(self):
        self.clerk_jwt_secret = getattr(settings, 'CLERK_JWT_SECRET_KEY', None)
        self.jwt_algorithm = getattr(settings, 'JWT_ALGORITHM', 'HS256')
        self.jwt_secret_key = getattr(settings, 'JWT_SECRET_KEY', None)
        
    @lru_cache(maxsize=128)
    def get_clerk_public_key(self, kid: str) -> Optional[str]:
        """
        Fetch Clerk public key for JWT verification.
        In production, this should cache keys appropriately.
        """
        try:
            # Clerk provides JWKS endpoint for public keys
            response = requests.get(f"https://api.clerk.dev/v1/jwks")
            if response.status_code == 200:
                jwks = response.json()
                for key in jwks.get("keys", []):
                    if key.get("kid") == kid:
                        return key
            return None
        except Exception as e:
            logger.error(f"Failed to fetch Clerk public key: {e}")
            return None
    
    def verify_clerk_token(self, token: str) -> Optional[dict]:
        """
        Verify a Clerk JWT token and return the payload.
        """
        try:
            # Decode token header to get key ID
            unverified_header = jwt.get_unverified_header(token)
            kid = unverified_header.get("kid")
            
            if not kid:
                logger.error("No 'kid' found in token header")
                return None
            
            # Get public key for verification
            public_key = self.get_clerk_public_key(kid)
            if not public_key:
                logger.error(f"No public key found for kid: {kid}")
                return None
            
            # Verify and decode token
            payload = jwt.decode(
                token, 
                public_key, 
                algorithms=["RS256"],  # Clerk uses RS256
                options={"verify_aud": False}  # Clerk may not set audience
            )
            
            return payload
            
        except JWTError as e:
            logger.error(f"Clerk JWT verification failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error verifying Clerk token: {e}")
            return None
    
    def verify_generic_jwt(self, token: str) -> Optional[dict]:
        """
        Verify a generic JWT token using configured secret key.
        """
        if not self.jwt_secret_key:
            logger.error("JWT_SECRET_KEY not configured")
            return None
            
        try:
            payload = jwt.decode(
                token,
                self.jwt_secret_key,
                algorithms=[self.jwt_algorithm]
            )
            return payload
        except JWTError as e:
            logger.error(f"Generic JWT verification failed: {e}")
            return None
    
    def verify_token(self, token: str) -> Optional[dict]:
        """
        Verify JWT token using available methods.
        First tries Clerk verification, then falls back to generic JWT.
        """
        # Try Clerk verification first if secret is configured
        if self.clerk_jwt_secret:
            payload = self.verify_clerk_token(token)
            if payload:
                return payload
        
        # Fall back to generic JWT verification
        payload = self.verify_generic_jwt(token)
        if payload:
            return payload
        
        return None
    
    def extract_user_from_payload(self, payload: dict) -> User:
        """
        Extract user information from JWT payload.
        Handles both Clerk and generic JWT formats.
        """
        # Clerk format
        if "sub" in payload:
            user_id = payload["sub"]
            email = payload.get("email")
            username = payload.get("username") or payload.get("preferred_username")
            
            return User(
                id=user_id,
                email=email,
                username=username
            )
        
        # Generic JWT format
        user_id = payload.get("user_id") or payload.get("sub")
        if not user_id:
            raise ValueError("No user ID found in JWT payload")
        
        return User(
            id=str(user_id),
            email=payload.get("email"),
            username=payload.get("username")
        )


# Global authenticator instance
authenticator = JWTAuthenticator()


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
        logger.info(f"Authenticated user: {user.id}")
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


def require_auth_for_multi_way():
    """
    Helper function to ensure multi-way endpoints are properly secured.
    Returns the authentication dependency.
    """
    return Depends(get_current_user)