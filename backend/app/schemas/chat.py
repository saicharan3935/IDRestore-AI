from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class ChatMessageItem(BaseModel):
    role: str = Field("user", description="'user' or 'assistant' or 'model'")
    content: Optional[str] = Field("", description="Message text content")
    message: Optional[str] = Field(None, description="Alternative field for message text")

    def get_text(self) -> str:
        return self.content or self.message or ""

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000, description="User prompt text")
    # Accept both conversation_history and history
    conversation_history: Optional[List[Union[ChatMessageItem, Dict[str, Any]]]] = Field(default_factory=list)
    history: Optional[List[Union[ChatMessageItem, Dict[str, Any]]]] = Field(default_factory=list)
    # Accept both current_page and current_tab
    current_page: Optional[str] = Field(None, description="Active page or route")
    current_tab: Optional[str] = Field(None, description="Active workspace tab")

    def get_page(self) -> str:
        raw = self.current_page or self.current_tab or "overview"
        clean = raw.strip("/").split("/")[-1].lower()
        valid = {"overview", "restore", "analysis", "batch", "history", "migration", "analytics", "settings"}
        return clean if clean in valid else "overview"

    def get_history(self) -> List[ChatMessageItem]:
        hist = self.conversation_history or self.history or []
        parsed = []
        for h in hist:
            if isinstance(h, ChatMessageItem):
                parsed.append(h)
            elif isinstance(h, dict):
                role = h.get("role", "user")
                text = h.get("content") or h.get("message") or ""
                parsed.append(ChatMessageItem(role=role, content=text))
        return parsed

class SuggestedAction(BaseModel):
    label: str = Field(..., description="Action button display text")
    route: Optional[str] = Field(None, description="Application route (/dashboard/...) or tab id")
    action: Optional[str] = Field("navigate", description="'navigate' | 'query'")
    target: Optional[str] = Field(None, description="Target tab name for existing navigation")
    text: Optional[str] = Field(None, description="Query prompt text if action is 'query'")

class ChatResponse(BaseModel):
    reply: str = Field(..., description="Markdown response from BYTE")
    mode: str = Field("local", description="'gemini' or 'local'")
    ai_status: str = Field("LOCAL_FALLBACK_ACTIVE", description="'GEMINI_ONLINE' | 'LOCAL_FALLBACK_ACTIVE'")
    intent: Optional[str] = Field("general_help", description="Detected user intent")
    suggested_actions: List[SuggestedAction] = Field(default_factory=list)
    suggested_navigation: Optional[str] = Field(None, description="Direct navigation target tab")
    live_data: Optional[Dict[str, Any]] = Field(None, description="Live telemetry / model data")
    context_hint: Optional[str] = Field(None, description="Contextual guidance for the current view")
