"""
Main orchestrator for multi-way conversations
"""

import uuid
from typing import Dict, List, Optional, AsyncGenerator, Tuple
import logging

try:
    import opik

    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False

from philoagents.domain.multi_way.conversation_config import (
    ConversationConfig,
    PREDEFINED_CONFIGURATIONS,
)
from philoagents.domain.multi_way.dialogue_state import (
    DialogueState,
    ConversationStatus,
    MessageRole,
    Message,
)
from philoagents.domain.multi_way.conversation_persistence import (
    PersistedConversation,
    ConversationSummary,
    ConversationListFilter,
)
from philoagents.infrastructure.mongo.multi_way_repository import (
    MultiWayConversationRepository,
)
from .persona_manager import PersonaManager

logger = logging.getLogger(__name__)


class ConversationOrchestrator:
    """
    Orchestrates multi-way conversations between AI agents
    """

    def __init__(self):
        self.active_sessions: Dict[str, DialogueState] = {}
        self.persona_managers: Dict[str, PersonaManager] = {}
        self.session_users: Dict[str, str] = {}  # Track which user owns each session
        self.repository = MultiWayConversationRepository()

    def get_available_configurations(self) -> Dict[str, ConversationConfig]:
        """Get all available conversation configurations"""
        return PREDEFINED_CONFIGURATIONS.copy()

    def get_configuration(self, config_id: str) -> Optional[ConversationConfig]:
        """Get a specific conversation configuration"""
        return PREDEFINED_CONFIGURATIONS.get(config_id)

    async def start_conversation(
        self, config_id: str, user_id: str, session_id: Optional[str] = None
    ) -> Tuple[str, DialogueState]:
        """
        Start a new multi-way conversation
        Returns (session_id, initial_dialogue_state)
        """
        if session_id is None:
            session_id = str(uuid.uuid4())

        # Get configuration
        config = self.get_configuration(config_id)
        if not config:
            raise ValueError(f"Configuration {config_id} not found")

        # Validate configuration
        persona_manager = PersonaManager(config)
        validation_issues = persona_manager.validate_configuration()
        if validation_issues:
            raise ValueError(
                f"Configuration validation failed: {'; '.join(validation_issues)}"
            )

        # Initialize dialogue state
        dialogue_state = DialogueState(
            session_id=session_id,
            config_id=config_id,
            status=ConversationStatus.WAITING_FOR_TOPIC,
            active_agents=persona_manager.get_all_agent_ids(),
        )

        # Store session data
        self.active_sessions[session_id] = dialogue_state
        self.persona_managers[session_id] = persona_manager
        self.session_users[session_id] = user_id

        # Persist to database
        try:
            self.repository.save_conversation(
                session_id=session_id,
                user_id=user_id,
                dialogue_state=dialogue_state,
                config=config,
            )
        except Exception as e:
            logger.warning(f"Failed to persist conversation {session_id}: {e}")

        logger.info(
            f"Started conversation session {session_id} with config {config_id} for user {user_id}"
        )
        return session_id, dialogue_state

    async def set_topic(self, session_id: str, topic: str) -> DialogueState:
        """
        Set the conversation topic and generate introduction
        """
        dialogue_state = self.active_sessions.get(session_id)
        if not dialogue_state:
            raise ValueError(f"Session {session_id} not found")

        persona_manager = self.persona_managers.get(session_id)
        if not persona_manager:
            raise ValueError(f"Persona manager for session {session_id} not found")

        # Set topic in dialogue state
        dialogue_state.set_topic(topic)

        # Update in database
        try:
            self._persist_dialogue_state(session_id, dialogue_state)
        except Exception as e:
            logger.warning(f"Failed to persist topic update for {session_id}: {e}")

        # Generate introduction from lead agent
        try:
            introduction = await persona_manager.generate_introduction(topic)

            # Add introduction message
            intro_message_id = str(uuid.uuid4())
            lead_agent = persona_manager.get_lead_agent()
            if lead_agent:
                dialogue_state.add_agent_message(
                    agent_id=lead_agent.config.id,
                    agent_name=lead_agent.config.name,
                    content=introduction,
                    message_id=intro_message_id,
                )

                # Set initial turn state
                next_speaker = await persona_manager.determine_next_speaker(
                    dialogue_state, lead_agent.config.id
                )
                dialogue_state.update_turn(
                    current_agent_id=lead_agent.config.id,
                    next_agent_id=next_speaker,
                    reasoning="Lead agent introduced the topic",
                )

        except Exception as e:
            logger.error(f"Failed to generate introduction: {e}")
            # Add fallback system message
            system_message_id = str(uuid.uuid4())
            dialogue_state.add_system_message(
                content=f"Let's begin our discussion about: {topic}",
                message_id=system_message_id,
            )

        return dialogue_state

    async def process_user_message(
        self, session_id: str, message: str
    ) -> DialogueState:
        """
        Process a user message and update conversation state
        """
        dialogue_state = self.active_sessions.get(session_id)
        if not dialogue_state:
            raise ValueError(f"Session {session_id} not found")

        # Add user message to dialogue state
        user_message_id = str(uuid.uuid4())
        dialogue_state.add_user_message(message, user_message_id)

        # Clear any waiting for user state
        if dialogue_state.waiting_for_user_feedback:
            dialogue_state.clear_user_wait()

        # Persist changes
        try:
            self._persist_dialogue_state(session_id, dialogue_state)
        except Exception as e:
            logger.warning(f"Failed to persist user message for {session_id}: {e}")

        # If this is a topic setting message and we're waiting for topic
        if dialogue_state.status == ConversationStatus.WAITING_FOR_TOPIC:
            return await self.set_topic(session_id, message)

        return dialogue_state

    @opik.track if OPIK_AVAILABLE else lambda f: f
    async def generate_next_response(
        self, session_id: str
    ) -> AsyncGenerator[Dict, None]:
        """
        Generate the next agent response in the conversation
        Yields response chunks for streaming
        """
        dialogue_state = self.active_sessions.get(session_id)
        if not dialogue_state:
            raise ValueError(f"Session {session_id} not found")

        persona_manager = self.persona_managers.get(session_id)
        if not persona_manager:
            raise ValueError(f"Persona manager for session {session_id} not found")

        # Check if conversation should continue
        if dialogue_state.status not in [
            ConversationStatus.IN_PROGRESS,
            ConversationStatus.WAITING_FOR_USER,
        ]:
            yield {
                "type": "error",
                "message": f"Conversation is in {dialogue_state.status.value} state",
            }
            return

        # Check round limit with better logging
        if dialogue_state.round_count >= persona_manager.config.max_rounds:
            dialogue_state.end_conversation()
            if OPIK_AVAILABLE:
                try:
                    client = opik.Opik()
                    client.log_traces(
                        [
                            {
                                "name": "conversation_ended",
                                "output": {
                                    "reason": "max_rounds_reached",
                                    "round_count": dialogue_state.round_count,
                                    "message_count": len(dialogue_state.messages),
                                },
                            }
                        ]
                    )
                except Exception:
                    pass
            yield {
                "type": "system",
                "message": "Conversation has reached maximum rounds limit",
                "dialogue_state": dialogue_state,
            }
            return

        # Determine next speaker if not already set
        current_speaker_id = dialogue_state.turn_info.next_agent_id
        if not current_speaker_id:
            last_agent_message = None
            for msg in reversed(dialogue_state.messages):
                if msg.role == MessageRole.AGENT:
                    last_agent_message = msg
                    break

            current_speaker_id = await persona_manager.determine_next_speaker(
                dialogue_state,
                last_agent_message.agent_id if last_agent_message else None,
            )

        if not current_speaker_id:
            yield {"type": "error", "message": "Unable to determine next speaker"}
            return

        # Get speaker info
        speaker_config = persona_manager.get_agent_config(current_speaker_id)
        if not speaker_config:
            yield {"type": "error", "message": f"Agent {current_speaker_id} not found"}
            return

        # Yield speaker info
        yield {
            "type": "speaker_info",
            "agent_id": current_speaker_id,
            "agent_name": speaker_config.name,
            "agent_role": speaker_config.role.value,
        }

        # Generate response
        try:
            last_agent_message = None
            for msg in reversed(dialogue_state.messages):
                if msg.role == MessageRole.AGENT and msg.agent_id != current_speaker_id:
                    last_agent_message = msg
                    break

            response = await persona_manager.generate_agent_response(
                agent_id=current_speaker_id,
                dialogue_state=dialogue_state,
                last_speaker_name=last_agent_message.agent_name
                if last_agent_message
                else None,
            )

            if not response:
                yield {
                    "type": "error",
                    "message": f"Failed to generate response from {speaker_config.name}",
                }
                return

            # Check for user questions
            user_questions = persona_manager.extract_user_questions(
                current_speaker_id, response
            )

            # Add agent message to dialogue state
            response_message_id = str(uuid.uuid4())
            dialogue_state.add_agent_message(
                agent_id=current_speaker_id,
                agent_name=speaker_config.name,
                content=response,
                message_id=response_message_id,
            )

            # Yield the response
            yield {
                "type": "agent_response",
                "agent_id": current_speaker_id,
                "agent_name": speaker_config.name,
                "content": response,
                "message_id": response_message_id,
            }

            # Handle user questions if any
            if user_questions:
                dialogue_state.set_waiting_for_user(prompt="; ".join(user_questions))
                yield {
                    "type": "user_input_requested",
                    "questions": user_questions,
                    "dialogue_state": dialogue_state,
                }
            else:
                # Determine next speaker
                next_speaker_id = await persona_manager.determine_next_speaker(
                    dialogue_state, current_speaker_id
                )

                dialogue_state.update_turn(
                    current_agent_id=current_speaker_id,
                    next_agent_id=next_speaker_id,
                    reasoning="Regular conversation flow",
                )

                dialogue_state.complete_round()

                # Persist after completing round
                try:
                    self._persist_dialogue_state(session_id, dialogue_state)
                except Exception as e:
                    logger.warning(
                        f"Failed to persist round completion for {session_id}: {e}"
                    )

                yield {
                    "type": "turn_complete",
                    "next_speaker_id": next_speaker_id,
                    "dialogue_state": dialogue_state,
                }

        except Exception as e:
            logger.error(f"Error generating response: {e}")
            yield {"type": "error", "message": f"Error generating response: {str(e)}"}

    def get_conversation_state(self, session_id: str) -> Optional[DialogueState]:
        """Get current conversation state"""
        return self.active_sessions.get(session_id)

    def get_conversation_history(
        self, session_id: str, limit: Optional[int] = None
    ) -> List[Message]:
        """Get conversation history"""
        dialogue_state = self.active_sessions.get(session_id)
        if not dialogue_state:
            return []

        if limit:
            return dialogue_state.get_recent_messages(limit)
        return dialogue_state.messages

    async def end_conversation(self, session_id: str) -> Optional[DialogueState]:
        """End a conversation and clean up resources"""
        dialogue_state = self.active_sessions.get(session_id)
        if dialogue_state:
            dialogue_state.end_conversation()

            # Clean up (but keep for potential retrieval)
            # In production, you might want to persist to database here
            logger.info(f"Ended conversation session {session_id}")

        return dialogue_state

    def cleanup_session(self, session_id: str) -> None:
        """Remove session from memory (use after persisting if needed)"""
        self.active_sessions.pop(session_id, None)
        self.persona_managers.pop(session_id, None)
        logger.info(f"Cleaned up session {session_id}")

    def get_active_sessions(self) -> List[str]:
        """Get list of active session IDs"""
        return list(self.active_sessions.keys())

    async def get_conversation_summary(self, session_id: str) -> Dict[str, str]:
        """Get conversation summary from all agents' perspectives"""
        dialogue_state = self.active_sessions.get(session_id)
        persona_manager = self.persona_managers.get(session_id)

        if not dialogue_state or not persona_manager:
            return {}

        return persona_manager.get_conversation_summary(dialogue_state)

    def _persist_dialogue_state(
        self, session_id: str, dialogue_state: DialogueState
    ) -> None:
        """Helper method to persist dialogue state to database"""
        persona_manager = self.persona_managers.get(session_id)
        user_id = self.session_users.get(session_id)
        if not persona_manager or not user_id:
            return

        self.repository.save_conversation(
            session_id=session_id,
            user_id=user_id,
            dialogue_state=dialogue_state,
            config=persona_manager.config,
        )

    async def load_conversation(
        self, session_id: str, user_id: str
    ) -> Optional[DialogueState]:
        """Load a conversation from the database (user-authenticated)"""
        try:
            persisted = self.repository.get_conversation_by_session_id(
                session_id, user_id
            )
            if not persisted:
                return None

            # Restore to active sessions if not already there
            if session_id not in self.active_sessions:
                config = self.get_configuration(persisted.dialogue_state.config_id)
                if config:
                    persona_manager = PersonaManager(config)
                    self.active_sessions[session_id] = persisted.dialogue_state
                    self.persona_managers[session_id] = persona_manager
                    self.session_users[session_id] = user_id
                    logger.info(
                        f"Loaded conversation {session_id} from database for user {user_id}"
                    )

            return persisted.dialogue_state

        except Exception as e:
            logger.error(f"Failed to load conversation {session_id}: {e}")
            return None

    async def list_conversations(
        self, filter_params: ConversationListFilter
    ) -> List[ConversationSummary]:
        """List conversations with filtering and pagination"""
        return self.repository.list_conversations(filter_params)

    async def get_persisted_conversation(
        self, session_id: str, user_id: str
    ) -> Optional[PersistedConversation]:
        """Get the full persisted conversation (user-authenticated)"""
        return self.repository.get_conversation_by_session_id(session_id, user_id)
