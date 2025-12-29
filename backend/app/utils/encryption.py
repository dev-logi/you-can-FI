"""
Encryption Utilities

Handles encryption/decryption of sensitive data like Plaid access tokens.
"""

from cryptography.fernet import Fernet
from app.config import get_settings

settings = get_settings()


class EncryptionService:
    """Service for encrypting and decrypting sensitive data."""
    
    def __init__(self):
        """Initialize encryption service with key from config."""
        self._cipher = None
        self._initialized = False
    
    @property
    def cipher(self):
        """Lazy initialization of encryption cipher."""
        if not self._initialized:
            try:
                # Generate a key if not provided (for development only)
                if not settings.plaid_encryption_key:
                    # In production, this should be set via environment variable
                    # For now, generate a key (this should be changed in production)
                    key = Fernet.generate_key()
                    print(f"WARNING: Generated encryption key. Set PLAID_ENCRYPTION_KEY in production!")
                    print(f"Generated key: {key.decode()}")
                    self._cipher = Fernet(key)
                else:
                    # Use provided key
                    self._cipher = Fernet(settings.plaid_encryption_key.encode())
                self._initialized = True
            except Exception as e:
                print(f"WARNING: Failed to initialize encryption service: {e}")
                raise
        return self._cipher
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string."""
        return self.cipher.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt a string."""
        return self.cipher.decrypt(ciphertext.encode()).decode()


# Singleton instance
encryption_service = EncryptionService()

