"""
Custom exception classes for structured error handling.
These are caught by FastAPI exception handlers and converted to clean JSON responses.
"""

from fastapi import HTTPException, status


class AppException(HTTPException):
    """Base application exception with a human-readable message."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        error_code: str | None = None,
    ):
        super().__init__(status_code=status_code, detail=detail)
        self.error_code = error_code


# ---------- Authentication Exceptions ----------

class InvalidCredentialsError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID or password.",
            error_code="INVALID_CREDENTIALS",
        )


class PasswordExpiredError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your password has expired. Please change your password.",
            error_code="PASSWORD_EXPIRED",
        )


class MustChangePasswordError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You must change your temporary password before continuing.",
            error_code="MUST_CHANGE_PASSWORD",
        )


class InactiveUserError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Contact an administrator.",
            error_code="INACTIVE_USER",
        )


class TokenExpiredError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
            error_code="TOKEN_EXPIRED",
        )


# ---------- Authorization Exceptions ----------

class PermissionDeniedError(AppException):
    def __init__(self, detail: str = "You do not have permission to perform this action."):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            error_code="PERMISSION_DENIED",
        )


class AdminRequiredError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires administrator privileges.",
            error_code="ADMIN_REQUIRED",
        )


# ---------- Resource Exceptions ----------

class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found.",
            error_code="NOT_FOUND",
        )


class DuplicateError(AppException):
    def __init__(self, detail: str = "A record with this identifier already exists."):
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            error_code="DUPLICATE",
        )


# ---------- Business Logic Exceptions ----------

class NoCategoryError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No active task category is available. Please contact the administrator.",
            error_code="NO_CATEGORY",
        )


class StageSequenceError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must complete the previous stage before proceeding to this one.",
            error_code="STAGE_SEQUENCE_ERROR",
        )


class TaskNotEditableError(AppException):
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This task cannot be modified in its current state.",
            error_code="TASK_NOT_EDITABLE",
        )


class PasswordValidationError(AppException):
    def __init__(self, errors: list[str]):
        detail = " ".join(errors)
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            error_code="PASSWORD_VALIDATION",
        )
