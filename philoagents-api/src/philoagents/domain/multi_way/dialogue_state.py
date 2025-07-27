"""
State management for multi-way conversations
"""
from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field


class MessageRole(str, Enum):
    """Roles for messages in conversation"""
    USER = "user"
    AGENT = "agent"
    SYSTEM = "system"


class ConversationStatus(str, Enum):
    """Status of the conversation"""
    WAITING_FOR_TOPIC = "waiting_for_topic"
    IN_PROGRESS = "in_progress"
    WAITING_FOR_USER = "waiting_for_user"
    COMPLETED = "completed"
    ERROR = "error"


class Message(BaseModel):
    """A single message in the conversation"""
    
    id: str = Field(description="Unique message identifier")
    role: MessageRole = Field(description="Role of the message sender")
    content: str = Field(description="Message content")
    agent_id: Optional[str] = Field(default=None, description="ID of agent sender (if applicable)")
    agent_name: Optional[str] = Field(default=None, description="Name of agent sender (if applicable)")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Message timestamp")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Additional message metadata")


class TurnInfo(BaseModel):
    """Information about whose turn it is to speak"""
    
    current_agent_id: Optional[str] = Field(default=None, description="ID of current speaking agent")
    next_agent_id: Optional[str] = Field(default=None, description="ID of next speaking agent")
    turn_number: int = Field(default=0, description="Current turn number")
    reasoning: Optional[str] = Field(default=None, description="Reasoning for agent selection")


class DialogueState(BaseModel):
    """Complete state of a multi-way conversation"""
    
    session_id: str = Field(description="Unique session identifier")
    config_id: str = Field(description="Configuration ID used for this conversation")
    status: ConversationStatus = Field(default=ConversationStatus.WAITING_FOR_TOPIC)
    topic: Optional[str] = Field(default=None, description="Conversation topic")
    
    # Message history
    messages: List[Message] = Field(default_factory=list, description="Complete message history")
    
    # Turn management
    turn_info: TurnInfo = Field(default_factory=TurnInfo, description="Current turn information")
    
    # Agent states
    active_agents: List[str] = Field(default_factory=list, description="List of active agent IDs")
    agent_contexts: Dict[str, List[Dict[str, str]]] = Field(
        default_factory=dict, description="Individual agent conversation contexts"
    )
    
    # Conversation metadata
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    round_count: int = Field(default=0, description="Number of completed rounds")
    waiting_for_user_feedback: bool = Field(default=False, description="Whether waiting for user input")
    user_feedback_prompt: Optional[str] = Field(default=None, description="Prompt for user feedback")
    
    # Topic and conversation flow
    current_subtopic: Optional[str] = Field(default=None, description="Current discussion subtopic")
    key_points: List[str] = Field(default_factory=list, description="Key points discussed")
    decisions_made: List[str] = Field(default_factory=list, description="Decisions or consensus reached")
    
    def add_message(self, message: Message) -> None:
        """Add a message to the conversation history"""
        self.messages.append(message)
        self.updated_at = datetime.utcnow()
        
        # Update agent context if it's an agent message
        if message.role == MessageRole.AGENT and message.agent_id:
            if message.agent_id not in self.agent_contexts:
                self.agent_contexts[message.agent_id] = []
            
            self.agent_contexts[message.agent_id].append({
                "role": "assistant",
                "content": message.content
            })
    
    def add_user_message(self, content: str, message_id: str) -> None:
        """Add a user message to the conversation"""
        message = Message(
            id=message_id,
            role=MessageRole.USER,
            content=content
        )
        self.add_message(message)
        
        # Add to all agent contexts
        for agent_id in self.active_agents:
            if agent_id not in self.agent_contexts:
                self.agent_contexts[agent_id] = []
            
            self.agent_contexts[agent_id].append({
                "role": "user",
                "content": content
            })
    
    def add_agent_message(self, agent_id: str, agent_name: str, content: str, message_id: str) -> None:
        """Add an agent message to the conversation"""
        message = Message(
            id=message_id,
            role=MessageRole.AGENT,
            content=content,
            agent_id=agent_id,
            agent_name=agent_name
        )
        self.add_message(message)
        
        # Add to other agents' contexts (not the sender's)
        for other_agent_id in self.active_agents:
            if other_agent_id != agent_id:
                if other_agent_id not in self.agent_contexts:
                    self.agent_contexts[other_agent_id] = []
                
                self.agent_contexts[other_agent_id].append({
                    "role": "user",
                    "content": f"{agent_name}: {content}"
                })
    
    def add_system_message(self, content: str, message_id: str) -> None:
        """Add a system message to the conversation"""
        message = Message(
            id=message_id,
            role=MessageRole.SYSTEM,
            content=content
        )
        self.add_message(message)
        
        # Add to all agent contexts
        for agent_id in self.active_agents:
            if agent_id not in self.agent_contexts:
                self.agent_contexts[agent_id] = []
            
            self.agent_contexts[agent_id].append({
                "role": "system",
                "content": content
            })
    
    def get_agent_context(self, agent_id: str) -> List[Dict[str, str]]:
        """Get conversation context for a specific agent"""
        return self.agent_contexts.get(agent_id, [])
    
    def get_recent_messages(self, limit: int = 10) -> List[Message]:
        """Get recent messages from the conversation"""
        return self.messages[-limit:] if self.messages else []
    
    def set_topic(self, topic: str) -> None:
        """Set the conversation topic and update status"""
        self.topic = topic
        self.status = ConversationStatus.IN_PROGRESS
        self.updated_at = datetime.utcnow()
    
    def update_turn(self, current_agent_id: Optional[str], next_agent_id: Optional[str], reasoning: Optional[str] = None) -> None:
        """Update turn information"""
        self.turn_info.current_agent_id = current_agent_id
        self.turn_info.next_agent_id = next_agent_id
        self.turn_info.reasoning = reasoning
        if current_agent_id:
            self.turn_info.turn_number += 1
        self.updated_at = datetime.utcnow()
    
    def complete_round(self) -> None:
        """Mark completion of a conversation round"""
        self.round_count += 1
        self.updated_at = datetime.utcnow()
    
    def set_waiting_for_user(self, prompt: Optional[str] = None) -> None:
        """Set state to waiting for user feedback"""
        self.status = ConversationStatus.WAITING_FOR_USER
        self.waiting_for_user_feedback = True
        self.user_feedback_prompt = prompt
        self.updated_at = datetime.utcnow()
    
    def clear_user_wait(self) -> None:
        """Clear waiting for user state"""
        self.waiting_for_user_feedback = False
        self.user_feedback_prompt = None
        self.status = ConversationStatus.IN_PROGRESS
        self.updated_at = datetime.utcnow()
    
    def end_conversation(self) -> None:
        """Mark conversation as completed"""
        self.status = ConversationStatus.COMPLETED
        self.turn_info.current_agent_id = None
        self.turn_info.next_agent_id = None
        self.updated_at = datetime.utcnow()