import hashlib
import secrets

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError

# Argon2id password hasher with secure parameters
ph = PasswordHasher(time_cost=3, memory_cost=65536, parallelism=4, hash_len=32)


def hash_password(password: str) -> str:
    """Hashes a password using Argon2id."""
    return ph.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Verifies a plain password against an Argon2id hash."""
    try:
        return ph.verify(password_hash, password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def generate_session_token() -> str:
    """Generates a cryptographically secure 256-bit URL-safe session token."""
    return secrets.token_urlsafe(32)


def hash_session_token(token: str) -> str:
    """Returns SHA-256 hash of the session token for database lookup and storage."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def generate_csrf_token() -> str:
    """Generates a random CSRF token."""
    return secrets.token_hex(24)
