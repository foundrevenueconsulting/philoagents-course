"""
Configurable agent for multi-way conversations
"""

import re
from typing import Dict, List, Optional
from groq import AsyncGroq

try:
    import opik

    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False

from philoagents.config import settings
from philoagents.domain.multi_way.conversation_config import AgentConfig, AgentRole
from philoagents.domain.multi_way.dialogue_state import DialogueState


class ConfigurableAgent:
    """
    An AI agent that can participate in multi-way conversations with configurable behavior
    """

    def __init__(self, config: AgentConfig, conversation_context: str = ""):
        self.config = config
        self.conversation_context = conversation_context
        self.groq_client = AsyncGroq(api_key=settings.GROQ_API_KEY)

        # Build system prompt based on role and context
        self.system_prompt = self._build_system_prompt()

    def _build_system_prompt(self) -> str:
        """Build the complete system prompt for this agent"""
        base_prompt = f"""You are {self.config.name}, an AI agent participating in a multi-way conversation.

ROLE & EXPERTISE:
- Your role: {self.config.role.value}
- Your domain expertise: {self.config.domain_expertise}
- Your personality traits: {", ".join(self.config.personality_traits)}

BEHAVIOR GUIDELINES:
{self.config.system_prompt}

CONVERSATION CONTEXT:
{self.conversation_context}

IMPORTANT INSTRUCTIONS:
1. Stay true to your role and expertise
2. Contribute meaningfully based on your domain knowledge
3. Build upon or respond to what other agents have said
4. ONLY ask the user questions if absolutely critical for decision-making (use "@Ask User: [your question]")
5. Keep responses focused and conversational (aim for 2-4 sentences unless elaboration is needed)
6. Show your reasoning and expertise clearly
7. Collaborate respectfully with other agents
8. Continue the discussion by addressing other agents or building on their points
9. This is a multi-agent discussion - speak to your colleagues, not the user unless requesting critical input

ROLE-SPECIFIC BEHAVIOR:
"""

        # Add role-specific instructions
        if self.config.role == AgentRole.LEAD:
            base_prompt += """
- As the LEAD agent, you should guide the conversation and ensure it stays on track
- Introduce topics and help drive the discussion forward
- Summarize key points when appropriate
- Make sure all participants have a chance to contribute
"""
        elif self.config.role == AgentRole.CONTRIBUTOR:
            base_prompt += """
- As a CONTRIBUTOR, provide valuable insights from your domain expertise
- Build on ideas presented by other agents
- Offer practical suggestions and solutions
- Ask clarifying questions when needed
"""
        elif self.config.role == AgentRole.SKEPTIC:
            base_prompt += """
- As the SKEPTIC, critically evaluate ideas and proposals by addressing your colleagues
- Point out potential issues, risks, or overlooked considerations to the team
- Challenge assumptions constructively by sharing specific concerns with other agents
- Ensure thorough evaluation by stating what the team should consider
- Present your skeptical insights as statements, not questions to the user
- Example: "CFO, I'm concerned that..." or "CTO, we should consider that..."
"""
        elif self.config.role == AgentRole.MODERATOR:
            base_prompt += """
- As the MODERATOR, facilitate balanced discussion
- Ensure all voices are heard
- Summarize different viewpoints
- Help resolve conflicts or disagreements
"""

        return base_prompt

    @opik.track if OPIK_AVAILABLE else lambda f: f
    async def generate_response(
        self,
        conversation_history: List[Dict[str, str]],
        current_topic: Optional[str] = None,
        last_speaker: Optional[str] = None,
    ) -> str:
        """
        Generate a response based on conversation history and context
        """
        # Build messages for the LLM
        messages = [{"role": "system", "content": self.system_prompt}]

        # Add conversation context if there's a current topic
        if current_topic:
            messages.append(
                {
                    "role": "system",
                    "content": f"Current discussion topic: {current_topic}",
                }
            )

        # Add conversation history
        messages.extend(conversation_history)

        # Add context about the last speaker
        if last_speaker and last_speaker != self.config.name:
            messages.append(
                {
                    "role": "system",
                    "content": f"The last speaker was {last_speaker}. Please respond appropriately to their contribution.",
                }
            )

        try:
            # Track with Opik if available
            if OPIK_AVAILABLE:
                try:
                    client = opik.Opik()
                    client.log_traces(
                        [
                            {
                                "name": f"agent_response_{self.config.id}",
                                "input": {
                                    "topic": current_topic,
                                    "last_speaker": last_speaker,
                                },
                                "metadata": {
                                    "agent_id": self.config.id,
                                    "agent_name": self.config.name,
                                    "role": self.config.role.value,
                                    "message_count": len(conversation_history),
                                },
                            }
                        ]
                    )
                except Exception:
                    pass  # Silently fail if Opik not configured

            response = await self.groq_client.chat.completions.create(
                model=self.config.model,
                messages=messages,
                max_tokens=1000,
                temperature=0.7,
                stream=False,
            )

            content = response.choices[0].message.content
            result = content.strip()

            # Log the result
            if OPIK_AVAILABLE:
                try:
                    client = opik.Opik()
                    client.log_traces(
                        [
                            {
                                "name": f"agent_response_complete_{self.config.id}",
                                "output": result[:200] + "..."
                                if len(result) > 200
                                else result,
                            }
                        ]
                    )
                except Exception:
                    pass

            return result

        except Exception as e:
            error_msg = f"Error generating response: {str(e)}"
            if OPIK_AVAILABLE:
                try:
                    client = opik.Opik()
                    client.log_traces(
                        [{"name": f"agent_error_{self.config.id}", "output": error_msg}]
                    )
                except Exception:
                    pass
            return error_msg

    def should_speak_next(
        self,
        dialogue_state: DialogueState,
        last_speaker_id: Optional[str] = None,
        conversation_flow_context: Optional[str] = None,
    ) -> tuple[bool, str]:
        """
        Determine if this agent should speak next based on conversation state
        Returns (should_speak, reasoning)
        """
        # Don't speak if we just spoke
        if last_speaker_id == self.config.id:
            return False, "Just spoke in the previous turn"

        # Role-based speaking priority
        recent_messages = dialogue_state.get_recent_messages(5)

        # Lead agent should speak first or when conversation needs direction
        if self.config.role == AgentRole.LEAD:
            if not recent_messages:
                return True, "Lead agent should introduce the topic"

            # Check if conversation needs direction
            if len(recent_messages) > 3 and not any(
                msg.agent_id == self.config.id for msg in recent_messages[-3:]
            ):
                return True, "Lead agent should provide direction"

        # Skeptic should speak after several contributions to evaluate
        if self.config.role == AgentRole.SKEPTIC:
            agent_messages = [
                msg for msg in recent_messages if msg.agent_id != self.config.id
            ]
            if len(agent_messages) >= 2:
                return True, "Skeptic should evaluate recent contributions"

        # Contributors should engage when their expertise is relevant
        if self.config.role == AgentRole.CONTRIBUTOR:
            if conversation_flow_context and any(
                keyword in conversation_flow_context.lower()
                for keyword in self.config.domain_expertise.lower().split()
            ):
                return True, "Contributor's expertise is relevant to current discussion"

        # Default: moderate probability based on participation balance
        my_recent_count = sum(
            1 for msg in recent_messages if msg.agent_id == self.config.id
        )
        if my_recent_count < len(recent_messages) // len(dialogue_state.active_agents):
            return True, "Balancing participation across agents"

        return False, "No strong reason to speak next"

    def extract_user_questions(self, response: str) -> List[str]:
        """
        Extract user questions from agent response using @Ask User pattern
        """
        pattern = r"@Ask User:\s*(.+?)(?=\n|$)"
        questions = re.findall(pattern, response, re.IGNORECASE)
        return [q.strip() for q in questions]

    def get_conversation_summary(self, messages: List[Dict[str, str]]) -> str:
        """
        Generate a summary of the conversation from this agent's perspective
        """
        if not messages:
            return "No conversation to summarize."

        return f"""From {self.config.name}'s perspective ({
            self.config.domain_expertise
        }):
The conversation has covered {len(messages)} exchanges. Key areas of my expertise 
({self.config.domain_expertise}) have been {
            "discussed"
            if any(
                self.config.domain_expertise.lower() in msg.get("content", "").lower()
                for msg in messages
            )
            else "not yet addressed"
        }."""
