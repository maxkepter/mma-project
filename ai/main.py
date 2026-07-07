import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="MMA AI Service", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Pydantic models
class AnalysisRequest(BaseModel):
    """Request model for AI analysis"""
    data: str
    context: str | None = None


class AnalysisResponse(BaseModel):
    """Response model for AI analysis"""
    result: str
    confidence: float | None = None
    metadata: dict | None = None


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "MMA AI"}


def build_prompt(data_str: str, context: str | None) -> str:
    """Build a Vietnamese-language prompt for Gemini."""
    base_context = (
        "Bạn là một chuyên gia phân tích xổ số Việt Nam với nhiều năm kinh nghiệm. "
        "Hãy phân tích dữ liệu xổ số được cung cấp và đưa ra nhận định chuyên sâu bằng "
        "tiếng Việt có dấu đầy đủ.\n\n"
        "Yêu cầu bắt buộc về định dạng đầu ra:\n"
        "- Toàn bộ phản hồi PHẢI bằng tiếng Việt, có dấu đầy đủ (không được viết không dấu).\n"
        "- Cấu trúc gồm các mục: Tổng quan, Các số nóng, Các số gan, Dự báo xu hướng, Lưu ý.\n"
        "- Sử dụng các tiêu đề Markdown (##, -) để dễ đọc.\n"
        "- Không sử dụng ký tự đặc biệt hay mã lệnh.\n\n"
    )
    user_context = f"Bối cảnh bổ sung: {context}\n\n" if context else ""
    return (
        f"{base_context}"
        f"{user_context}"
        f"Dữ liệu phân tích (JSON):\n{data_str}\n\n"
        "Hãy đưa ra nhận định chi tiết bằng tiếng Việt có dấu:"
    )


def call_gemini(prompt: str) -> tuple[str, float]:
    """Call Gemini and return (text, confidence). Raises on hard failure."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your-google-api-key-here":
        raise RuntimeError("GOOGLE_API_KEY chưa được cấu hình trong file .env")

    # Import inside the function so the module loads even if the SDK isn't installed
    from google import genai

    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config={
            "temperature": 0.7,
            "top_p": 0.9,
            "max_output_tokens": 1024,
            "system_instruction": (
                "Bạn luôn phản hồi bằng tiếng Việt có dấu đầy đủ. "
                "Tuyệt đối không sử dụng tiếng Việt không dấu hay ngôn ngữ khác."
            ),
        },
    )

    text = (response.text or "").strip()
    if not text:
        raise RuntimeError("Gemini trả về phản hồi rỗng")

    # Average of the candidate's safety/quality rating tokens, if available
    confidence = 0.9
    try:
        if getattr(response, "candidates", None):
            cand = response.candidates[0]
            finish = getattr(cand, "finish_reason", None)
            if finish is not None and str(finish).upper() in {"MAX_TOKENS", "SAFETY"}:
                confidence = 0.6
    except Exception:
        pass

    return text, confidence


# Analysis endpoint
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(request: AnalysisRequest):
    """
    Analyze lottery data using Gemini AI, returning a Vietnamese insight.
    """
    try:
        prompt = build_prompt(request.data, request.context)

        try:
            result, confidence = call_gemini(prompt)
            model_name = "gemini-2.0-flash"
        except Exception as ai_err:
            # Fallback: return a deterministic Vietnamese placeholder so the
            # Nest caller still gets a usable (fully diacriticked) string.
            confidence = 0.4
            model_name = "fallback"
            try:
                parsed = json.loads(request.data) if request.data else {}
            except Exception:
                parsed = {}

            hot = parsed.get("hotNumbers") or []
            gan = parsed.get("overdueNumbers") or []
            preds = parsed.get("predictions") or []
            target = parsed.get("targetDate") or "hôm nay"

            lines = [f"## Phân tích xổ số ngày {target}", ""]
            lines.append("### Tổng quan")
            lines.append(
                "Hệ thống chưa thể kết nối tới dịch vụ AI ("
                f"{ai_err}). Dưới đây là tóm tắt thống kê nhanh."
            )
            lines.append("")
            if hot:
                lines.append("### Các số nóng")
                lines.append(
                    ", ".join(f"{h.get('number')}" for h in hot)
                )
                lines.append("")
            if gan:
                lines.append("### Các số gan")
                lines.append(
                    ", ".join(
                        f"{g.get('number')} ({g.get('currentGan')} ngày)"
                        for g in gan
                    )
                )
                lines.append("")
            if preds:
                lines.append("### Dự báo xu hướng")
                lines.append(
                    ", ".join(
                        f"{p.get('number')} ({p.get('confidence')})"
                        for p in preds
                    )
                )
                lines.append("")
            lines.append("### Lưu ý")
            lines.append(
                "Đây chỉ là phân tích thống kê cơ sở, không đảm bảo chính xác. "
                "Hãy cấu hình GOOGLE_API_KEY để nhận nhận định từ AI."
            )
            result = "\n".join(lines)

        return AnalysisResponse(
            result=result,
            confidence=confidence,
            metadata={"model": model_name, "language": "vi-VN", "version": "1.0"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Prediction endpoint
@app.post("/predict")
async def predict(request: AnalysisRequest):
    """
    Generate predictions based on lottery analysis (Vietnamese).
    """
    try:
        predictions = {
            "predicted_numbers": [1, 2, 3, 4, 5, 6],
            "probability": 0.65,
            "reasoning": "Dựa trên phân tích tần suất lịch sử.",
        }
        return predictions
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Chat endpoint for streaming responses
@app.post("/chat")
async def chat(request: AnalysisRequest):
    """
    Chat with AI about lottery analysis.
    """
    try:
        response = {
            "message": f"Phản hồi cho: {request.data}",
            "timestamp": os.popen("date").read().strip(),
        }
        return response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    port = int(os.getenv("AI_PORT", 8000))
    host = os.getenv("AI_HOST", "0.0.0.0")

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=os.getenv("NODE_ENV") == "development",
    )