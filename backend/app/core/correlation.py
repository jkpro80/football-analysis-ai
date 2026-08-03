import uuid
from contextvars import ContextVar

from fastapi import FastAPI

correlation_id: ContextVar[str] = ContextVar(
    "correlation_id",
    default="-",
)


def get_correlation_id() -> str:
    return correlation_id.get()


def register_correlation_id(app: FastAPI):

    @app.middleware("http")
    async def correlation_middleware(request, call_next):

        cid = request.headers.get("X-Correlation-ID") or str(uuid.uuid4())

        token = correlation_id.set(cid)

        try:
            response = await call_next(request)
        finally:
            correlation_id.reset(token)

        response.headers["X-Correlation-ID"] = cid

        return response
