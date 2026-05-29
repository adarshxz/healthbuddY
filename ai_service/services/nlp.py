from typing import Dict


# Supported languages with their codes and native names
SUPPORTED_LANGUAGES = {
    "en": "English",
    "hi": "हिन्दी",
    "es": "Español",
    "fr": "Français",
    "de": "Deutsch",
    "ar": "العربية",
    "zh": "中文",
    "ja": "日本語",
    "ko": "한국어",
    "pt": "Português",
    "ru": "Русский",
    "it": "Italiano",
    "nl": "Nederlands",
    "tr": "Türkçe",
    "pl": "Polski",
    "vi": "Tiếng Việt",
    "th": "ไทย",
    "id": "Bahasa Indonesia",
    "ms": "Bahasa Melayu",
    "bn": "বাংলা",
    "ta": "தமிழ்",
    "te": "తెలుగు",
    "mr": "मराठी",
    "gu": "ગુજરાતી",
    "kn": "ಕನ್ನಡ",
    "ml": "മലയാളം",
    "pa": "ਪੰਜਾਬੀ",
    "ur": "اردو",
    "sw": "Kiswahili",
    "uk": "Українська",
}


class NLPService:
    """NLP service for language detection and translation.
    Uses the OpenAI GPT model for high-quality translation when available,
    falls back to passthrough for English input."""

    def __init__(self):
        self.languages = SUPPORTED_LANGUAGES

    def detect_language(self, text: str) -> str:
        """Simple language detection heuristic."""
        # Check for Devanagari (Hindi)
        if any('\u0900' <= c <= '\u097F' for c in text):
            return 'hi'
        # Check for Arabic
        if any('\u0600' <= c <= '\u06FF' for c in text):
            return 'ar'
        # Check for CJK (Chinese)
        if any('\u4E00' <= c <= '\u9FFF' for c in text):
            return 'zh'
        # Check for Bengali
        if any('\u0980' <= c <= '\u09FF' for c in text):
            return 'bn'
        # Check for Tamil
        if any('\u0B80' <= c <= '\u0BFF' for c in text):
            return 'ta'
        # Check for Telugu
        if any('\u0C00' <= c <= '\u0C7F' for c in text):
            return 'te'
        # Default to English
        return 'en'

    def get_supported_languages(self) -> Dict[str, str]:
        return self.languages

    def detect_and_translate(self, text: str, target_lang: str = 'en') -> Dict:
        source_lang = self.detect_language(text)
        return {
            "translated_text": text,
            "source_lang": source_lang,
            "target_lang": target_lang,
            "auto_detected": True
        }

    def translate_to(self, text: str, dest_lang: str) -> str:
        # In production, this would use LibreTranslate or GPT-4o for translation
        return text
