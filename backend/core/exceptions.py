"""Domain exceptions mapped to HTTP responses by global handlers."""


class AppException(Exception):
    """Base application exception with HTTP status metadata."""

    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class BadRequestError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=400)


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(detail=detail, status_code=401)


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, status_code=403)


class NotFoundError(AppException):
    def __init__(self, detail: str = "Resource not found"):
        super().__init__(detail=detail, status_code=404)


class ConflictError(AppException):
    def __init__(self, detail: str):
        super().__init__(detail=detail, status_code=409)
