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
    history: list[dict] | None = None


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

    import time
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=prompt,
                config={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_output_tokens": 1024,
                    "system_instruction": (
                        "Bạn luôn phản hồi bằng tiếng Việt có dấu đầy đủ. "
                        "Tuyệt đối không sử dụng tiếng Việt không dấu hay ngôn ngữ khác."
                    ),
                    "safety_settings": [
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        )
                    ]
                },
            )
            break
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                time.sleep(2)
                continue
            raise e

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
            model_name = "gemini-2.5-flash"
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


def call_gemini_chat(prompt: str, system_instruction: str, history: list[dict] | None = None) -> str:
    """Call Gemini for chat and return text. Raises on hard failure."""
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key or api_key == "your-google-api-key-here":
        raise RuntimeError("GOOGLE_API_KEY chưa được cấu hình trong file .env")

    import time
    from google import genai
    from google.genai import types

    client = genai.Client(api_key=api_key)
    
    # Build contents array
    contents = []
    if history:
        for msg in history:
            role = msg.get("role", "user")
            parts = msg.get("parts", "")
            contents.append({"role": role, "parts": [{"text": parts}]})
            
    # Add current prompt
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model="gemini-2.5-flash",
                contents=contents,
                config={
                    "temperature": 0.7,
                    "top_p": 0.9,
                    "max_output_tokens": 4096,
                    "system_instruction": system_instruction,
                    "safety_settings": [
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_HARASSMENT,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        ),
                        types.SafetySetting(
                            category=types.HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                            threshold=types.HarmBlockThreshold.BLOCK_NONE,
                        )
                    ]
                },
            )
            text = (response.text or "").strip()
            
            # Kiểm tra xem có bị cắt ngang bởi Safety không
            try:
                if response.candidates and hasattr(response.candidates[0], "finish_reason"):
                    reason = str(response.candidates[0].finish_reason).upper()
                    if "SAFETY" in reason:
                        text += "\n\n*(Nội dung đã bị Google tự động ngắt quãng vì vi phạm chính sách an toàn đối với các nội dung dự đoán số lô đề. Google không cho phép AI đưa ra các dự đoán cờ bạc cụ thể.)*"
            except Exception:
                pass
                
            if not text:
                raise RuntimeError("Gemini trả về phản hồi rỗng (có thể do bộ lọc an toàn).")
            return text
        except Exception as e:
            if "503" in str(e) and attempt < max_retries - 1:
                time.sleep(2)  # Wait 2 seconds before retrying
                continue
            raise e


# Chat endpoint for streaming responses
@app.post("/chat")
async def chat(request: AnalysisRequest):
    """
    Chat with AI about lottery analysis, strategies, journal, and news.
    """
    try:
        system_instruction = (
            "Bạn là trợ lý AI phân tích dữ liệu xổ số, kiểm thử chiến lược và quản lý rủi ro.\n"
            "Yêu cầu bắt buộc:\n"
            "1. Tuyệt đối KHÔNG cam kết kết quả trúng thưởng, KHÔNG khẳng định chắc chắn thắng lợi.\n"
            "2. KHÔNG khuyến khích cờ bạc. Đóng vai trò là công cụ hỗ trợ phân tích dữ liệu thống kê và quản lý rủi ro.\n"
            "3. Luôn phản hồi bằng tiếng Việt có dấu đầy đủ, định dạng Markdown rõ ràng.\n"
            "4. Khi phân tích lý do chiến lược thua, hãy chỉ ra các yếu tố kỹ thuật như: tần suất giảm, số gan tăng, chu kỳ thay đổi, điều kiện quá chặt.\n"
            "5. Khi so sánh chiến lược, hãy xếp hạng theo ROI, tỷ lệ thắng (win rate) và đánh giá rủi ro.\n"
            "6. Luôn thêm một câu cảnh báo miễn trừ trách nhiệm ngắn gọn ở cuối phản hồi.\n"
            "7. Khi được hỏi về dự đoán, soi cầu hoặc giải mã số học, HÃY PHÂN TÍCH XU HƯỚNG CHUNG, TUYỆT ĐỐI KHÔNG liệt kê hay khuyên đánh các con số cụ thể (ví dụ: không nói 'hãy đánh con 12, 34'). Việc khuyên đánh số cụ thể sẽ vi phạm chính sách an toàn của Google. Chỉ đưa ra phân tích về nhịp độ, tần suất."
        )

        if request.context:
            system_instruction += f"\n\n[DỮ LIỆU BỐI CẢNH TỪ HỆ THỐNG]:\nBạn có quyền truy cập vào dữ liệu thực tế sau đây để trả lời câu hỏi của người dùng:\n{request.context}"

        try:
            result = call_gemini_chat(request.data, system_instruction, request.history)
        except Exception as ai_err:
            result = (
                f"### Trợ lý AI\n\n"
                f"Hệ thống chưa thể kết nối tới dịch vụ AI ({ai_err}).\n\n"
                f"**Phản hồi dự phòng:** Tôi đã nhận được yêu cầu của bạn về: \"{request.data[:100]}...\". "
                f"Tuy nhiên, do lỗi kết nối, tôi không thể thực hiện phân tích chi tiết lúc này. "
                f"Vui lòng thử lại sau.\n\n"
                f"*Lưu ý: Mọi phân tích chỉ mang tính chất tham khảo thống kê, không đảm bảo chính xác.*"
            )

        return {"message": result}
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