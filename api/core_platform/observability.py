from __future__ import annotations

import json
import logging
import time
import uuid

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.responses import Response


logger = logging.getLogger("fusion.platform")


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
        request.state.request_id = request_id
        started = time.perf_counter()
        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                json.dumps(
                    {
                        "event": "request_failed",
                        "request_id": request_id,
                        "method": request.method,
                        "path": request.url.path,
                        "tenant": getattr(request.state, "tenant", None),
                        "user": getattr(getattr(request.state, "auth", None), "subject", None),
                    }
                )
            )
            raise
        elapsed_ms = round((time.perf_counter() - started) * 1000, 3)
        if (
            request.url.path not in {"/docs", "/openapi.json", "/redoc"}
            and response.status_code != 204
            and "application/json" in response.headers.get("content-type", "")
        ):
            body = b""
            async for chunk in response.body_iterator:
                body += chunk
            try:
                payload = json.loads(body.decode("utf-8")) if body else None
            except (UnicodeDecodeError, json.JSONDecodeError):
                payload = None
            if payload is not None and not (
                isinstance(payload, dict)
                and {"success", "data", "meta", "errors"}.issubset(payload)
            ):
                if response.status_code >= 400:
                    errors = payload.get("error", payload) if isinstance(payload, dict) else payload
                    envelope = {
                        "success": False,
                        "data": None,
                        "meta": {"request_id": request_id},
                        "errors": errors if isinstance(errors, list) else [errors],
                    }
                    if isinstance(payload, dict):
                        envelope.update(payload)
                else:
                    envelope = {
                        "success": True,
                        "data": payload,
                        "meta": {"request_id": request_id},
                        "errors": [],
                    }
                    # Preserve the existing response shape for deployed clients.
                    if isinstance(payload, dict):
                        envelope.update(payload)
                response_headers = {
                    key: value
                    for key, value in response.headers.items()
                    if key.lower() != "content-length"
                }
                response = Response(
                    content=json.dumps(envelope, default=str),
                    status_code=response.status_code,
                    headers=response_headers,
                    media_type="application/json",
                )
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(elapsed_ms)
        logger.info(
            json.dumps(
                {
                    "event": "request_completed",
                    "request_id": request_id,
                    "method": request.method,
                        "path": request.url.path,
                        "status": response.status_code,
                        "latency_ms": elapsed_ms,
                        "tenant": getattr(request.state, "tenant", None),
                        "user": getattr(getattr(request.state, "auth", None), "subject", None),
                    }
                )
        )
        return response
