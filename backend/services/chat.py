"""
Chat service — streaming and non-streaming follow-up Q&A over analysis results.
"""

import json
from typing import Any, Dict, List

from backend.config import llm_client, LLM_MODEL

CHAT_SYSTEM_PROMPT = """Sen uzman bir klinik eczacısın. Görevin doktorun sorularına KISA, ÖZ ve NET cevaplar vermek.

KURALLAR:
1. Cevapların çok kısa olmalı (maksimum 2-3 cümle).
2. Sadece sorulan soruya odaklan, gereksiz bilgi verme.
3. Markdown formatı kullanabilirsin (bold, list vb.).
4. Eğer sorunun cevabı analiz sonucunda yoksa, genel tıbbi bilgini kullan ama bunu belirt.
5. Her zaman TÜRKÇE cevap ver.
6. Üslubun profesyonel ama direkt olsun. "Merhaba", "Tabii ki" gibi giriş kelimelerini kullanma.
"""


def _build_messages(
    message: str,
    context: Dict[str, Any],
    patient_info: Dict[str, Any],
    history: List[Dict[str, str]],
) -> list:
    """Build the message list shared by streaming and non-streaming paths."""
    context_str = json.dumps(context, indent=2, ensure_ascii=False)
    patient_str = json.dumps(patient_info, indent=2, ensure_ascii=False)

    messages = [{"role": "system", "content": CHAT_SYSTEM_PROMPT}]

    messages.append({
        "role": "user",
        "content": (
            f"BAĞLAM BİLGİLERİ:\n\n"
            f"HASTA BİLGİSİ:\n{patient_str}\n\n"
            f"MEVCUT ANALİZ SONUCU:\n{context_str}\n\n"
            f"Bu bağlamı kullanarak soruları cevapla."
        ),
    })

    for msg in history:
        messages.append({"role": msg["role"], "content": msg["content"]})

    messages.append({"role": "user", "content": message})
    return messages


def chat_with_analysis(
    message: str,
    context: Dict[str, Any],
    patient_info: Dict[str, Any],
    history: List[Dict[str, str]],
) -> str:
    """Non-streaming chat (returns full response at once)."""
    try:
        messages = _build_messages(message, context, patient_info, history)
        response = llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=300,
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"Chat error: {e}")
        return "Üzgünüm, şu anda cevap veremiyorum."


def chat_with_analysis_stream(
    message: str,
    context: Dict[str, Any],
    patient_info: Dict[str, Any],
    history: List[Dict[str, str]],
):
    """Streaming chat — yields text chunks as they arrive from the LLM."""
    try:
        messages = _build_messages(message, context, patient_info, history)
        stream = llm_client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=300,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices and chunk.choices[0].delta and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        print(f"Chat stream error: {e}")
        yield "Üzgünüm, şu anda cevap veremiyorum."
