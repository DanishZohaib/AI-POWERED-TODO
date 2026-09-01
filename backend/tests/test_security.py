import pytest
from app.core.security import hash_password, verify_password, validate_password_strength

def test_password_hashing():
    password = "SecurePassword123"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False

def test_password_validation():
    # Valid password
    errors = validate_password_strength("ValidPass1")
    assert len(errors) == 0

    # Too short
    errors = validate_password_strength("Short1")
    assert any("at least 8" in e for e in errors)

    # Missing uppercase
    errors = validate_password_strength("lowercase1")
    assert any("uppercase" in e for e in errors)

    # Missing lowercase
    errors = validate_password_strength("UPPERCASE1")
    assert any("lowercase" in e for e in errors)

    # Missing number
    errors = validate_password_strength("NoNumbersHere")
    assert any("number" in e for e in errors)
