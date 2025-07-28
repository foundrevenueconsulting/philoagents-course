"""
Domain models for persisting multi-way conversations
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

from .dialogue_state import DialogueState, ConversationStatus


class ConversationMetadata(BaseModel):
    """Metadata about a conversation"""
    title: str = Field(description="Human-readable title for the conversation")
    description: Optional[str] = Field(default=None, description="Optional description of the conversation")
    participant_count: int = Field(description="Number of AI agents participating")
    participant_names: List[str] = Field(description="Names of participating agents")
    config_id: str = Field(description="ID of the conversation configuration used")
    config_name: str = Field(description="Name of the conversation configuration")


class PersistedConversation(BaseModel):
    """
    Complete persisted conversation with metadata and state
    """
    id: Optional[str] = Field(default=None, description="MongoDB document ID")
    session_id: str = Field(description="Unique session identifier")
    
    # Metadata
    metadata: ConversationMetadata = Field(description="Conversation metadata")
    
    # Current state
    dialogue_state: DialogueState = Field(description="Current dialogue state")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.now, description="When conversation was created")
    updated_at: datetime = Field(default_factory=datetime.now, description="Last update time")
    ended_at: Optional[datetime] = Field(default=None, description="When conversation ended")
    
    # Conversation stats
    total_rounds: int = Field(default=0, description="Total rounds completed")
    total_messages: int = Field(default=0, description="Total messages exchanged")
    user_messages: int = Field(default=0, description="Number of user messages")
    agent_messages: int = Field(default=0, description="Number of agent messages")
    
    def update_stats(self) -> None:
        """Update conversation statistics based on current dialogue state"""
        self.total_rounds = self.dialogue_state.round_count
        self.total_messages = len(self.dialogue_state.messages)
        self.user_messages = len([m for m in self.dialogue_state.messages if m.role == 'user'])
        self.agent_messages = len([m for m in self.dialogue_state.messages if m.role == 'agent'])
        self.updated_at = datetime.now()
        
        if self.dialogue_state.status == ConversationStatus.COMPLETED:
            self.ended_at = datetime.now()
    
    def generate_title(self) -> str:
        """Generate a title from the conversation topic"""
        if not self.dialogue_state.topic:
            return f"{self.metadata.config_name} Discussion"
        
        # Take first 80 characters of topic and clean it up
        topic = self.dialogue_state.topic.strip()
        if len(topic) > 80:
            topic = topic[:77] + "..."
        
        return topic
    
    def to_summary(self) -> "ConversationSummary":
        """Convert to a lightweight summary for listing"""
        return ConversationSummary(
            id=self.id,
            session_id=self.session_id,
            title=self.generate_title(),
            config_name=self.metadata.config_name,
            participant_names=self.metadata.participant_names,
            status=self.dialogue_state.status,
            total_rounds=self.total_rounds,
            total_messages=self.total_messages,
            created_at=self.created_at,
            updated_at=self.updated_at,
            ended_at=self.ended_at
        )


class ConversationSummary(BaseModel):
    """
    Lightweight conversation summary for listing conversations
    """
    id: Optional[str] = Field(default=None, description="MongoDB document ID")
    session_id: str = Field(description="Unique session identifier")
    title: str = Field(description="Conversation title")
    config_name: str = Field(description="Configuration name used")
    participant_names: List[str] = Field(description="Names of participating agents")
    status: ConversationStatus = Field(description="Current conversation status")
    total_rounds: int = Field(description="Total rounds completed")
    total_messages: int = Field(description="Total messages exchanged")
    created_at: datetime = Field(description="When conversation was created")
    updated_at: datetime = Field(description="Last update time")
    ended_at: Optional[datetime] = Field(default=None, description="When conversation ended")


class ConversationListFilter(BaseModel):
    """
    Filter options for listing conversations
    """
    config_id: Optional[str] = Field(default=None, description="Filter by configuration ID")
    status: Optional[ConversationStatus] = Field(default=None, description="Filter by status")
    limit: int = Field(default=20, ge=1, le=100, description="Maximum number of results")
    offset: int = Field(default=0, ge=0, description="Number of results to skip")
    sort_by: str = Field(default="updated_at", description="Field to sort by")
    sort_order: str = Field(default="desc", pattern="^(asc|desc)$", description="Sort order")