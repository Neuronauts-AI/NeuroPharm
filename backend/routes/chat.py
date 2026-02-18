"""Chat routes — /chat and /chat/stream."""

import time

from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from backend.logger import get_logger
from backend.models import ChatRequest
from backend.services.chat import chat_with_analysis, chat_with_analysis_stream

router = APIRouter()


@router.post("/chat")
async def chat_endpoint(request: ChatRequest, req: Request):
    """Non-streaming chat endpoint."""
    logger = get_logger()
    start_time = time.time()

    try:
        response_text = chat_with_analysis(
            message=request.message,
            context=request.context,
            patient_info=request.patient_info,
            history=request.history,
        )
        result = {"reply": response_text}

        if logger.enabled:
            processing_time_ms = (time.time() - start_time) * 1000
            client_ip = req.client.host if req.client else "unknown"
            user_agent = req.headers.get("user-agent", "unknown")
            log_data = request.model_dump()
            log_data["context"] = "..."  # truncate for logging
            logger.log_request(
                endpoint="/chat",
                method="POST",
                client_ip=client_ip,
                user_agent=user_agent,
                request_data=log_data,
                response_data=result,
                status_code=200,
                processing_time_ms=processing_time_ms,
            )

        return result

    except Exception as e:
        print(f"Chat endpoint error: {e}")
        return {"reply": "Hata oluştu, lütfen tekrar deneyin."}


@router.post("/chat/stream")
async def chat_stream_endpoint(request: ChatRequest):
    """Streaming chat endpoint — returns text/plain chunks."""

    def generate():
        try:
            for chunk in chat_with_analysis_stream(
                message=request.message,
                context=request.context,
                patient_info=request.patient_info,
                history=request.history,
            ):
                yield chunk
        except Exception as e:
            print(f"Chat stream endpoint error: {e}")
            yield "Hata oluştu, lütfen tekrar deneyin."

    return StreamingResponse(
        generate(),
        media_type="text/plain; charset=utf-8",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
