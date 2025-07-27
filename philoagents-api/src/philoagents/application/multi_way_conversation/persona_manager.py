"""
Manager for handling multiple agent personas in conversations
"""
from typing import Dict, List, Optional
import logging

from philoagents.domain.multi_way.conversation_config import ConversationConfig, AgentConfig, AgentRole
from philoagents.domain.multi_way.dialogue_state import DialogueState
from .configurable_agent import ConfigurableAgent

logger = logging.getLogger(__name__)


class PersonaManager:
    """
    Manages multiple AI agent personas and their interactions
    """
    
    def __init__(self, config: ConversationConfig):
        self.config = config
        self.agents: Dict[str, ConfigurableAgent] = {}
        self.conversation_context = self._build_conversation_context()
        
        # Initialize all agents
        self._initialize_agents()
    
    def _build_conversation_context(self) -> str:
        """Build context about the conversation setup"""
        agent_descriptions = []
        for agent in self.config.agents:
            agent_descriptions.append(
                f"- {agent.name} ({agent.role.value}): {agent.domain_expertise}"
            )
        
        context = f"""CONVERSATION SETUP:
Format: {self.config.format.value}
Description: {self.config.description}

PARTICIPANTS:
{chr(10).join(agent_descriptions)}

This is a {self.config.format.value} discussion where each agent contributes based on their role and expertise.
Human feedback is {"enabled" if self.config.allow_human_feedback else "disabled"}.
Maximum rounds: {self.config.max_rounds}
"""
        return context
    
    def _initialize_agents(self) -> None:
        """Initialize all agent instances"""
        for agent_config in self.config.agents:
            try:
                agent = ConfigurableAgent(agent_config, self.conversation_context)
                self.agents[agent_config.id] = agent
                logger.info(f"Initialized agent: {agent_config.name} ({agent_config.id})")
            except Exception as e:
                logger.error(f"Failed to initialize agent {agent_config.id}: {e}")
                raise
    
    def get_agent(self, agent_id: str) -> Optional[ConfigurableAgent]:
        """Get agent by ID"""
        return self.agents.get(agent_id)
    
    def get_agent_config(self, agent_id: str) -> Optional[AgentConfig]:
        """Get agent configuration by ID"""
        return self.config.get_agent_by_id(agent_id)
    
    def get_agents_by_role(self, role: AgentRole) -> List[ConfigurableAgent]:
        """Get all agents with specified role"""
        matching_agents = []
        for agent_config in self.config.agents:
            if agent_config.role == role and agent_config.id in self.agents:
                matching_agents.append(self.agents[agent_config.id])
        return matching_agents
    
    def get_all_agent_ids(self) -> List[str]:
        """Get list of all agent IDs"""
        return list(self.agents.keys())
    
    def get_lead_agent(self) -> Optional[ConfigurableAgent]:
        """Get the lead agent for the conversation"""
        lead_agents = self.get_agents_by_role(AgentRole.LEAD)
        return lead_agents[0] if lead_agents else None
    
    async def generate_introduction(self, topic: str) -> str:
        """Generate an introduction to the conversation topic"""
        lead_agent = self.get_lead_agent()
        if not lead_agent:
            return f"Let's begin our {self.config.format.value} discussion about: {topic}"
        
        # Have the lead agent introduce the topic
        intro_context = [
            {
                "role": "user",
                "content": f"Please introduce the topic '{topic}' for our {self.config.format.value} discussion. "
                          f"Briefly explain what we'll be discussing and how you'd like to approach it."
            }
        ]
        
        try:
            introduction = await lead_agent.generate_response(
                conversation_history=intro_context,
                current_topic=topic
            )
            return introduction
        except Exception as e:
            logger.error(f"Failed to generate introduction: {e}")
            return f"Welcome! Let's discuss: {topic}"
    
    async def determine_next_speaker(
        self,
        dialogue_state: DialogueState,
        last_speaker_id: Optional[str] = None
    ) -> Optional[str]:
        """
        Determine which agent should speak next based on conversation flow
        """
        if not dialogue_state.active_agents:
            return None
        
        # Get conversation context for decision making
        recent_messages = dialogue_state.get_recent_messages(3)
        conversation_flow_context = " ".join([msg.content for msg in recent_messages])
        
        # Collect speaking preferences from all agents
        speaking_candidates = []
        
        for agent_id in dialogue_state.active_agents:
            if agent_id == last_speaker_id:
                continue  # Skip the agent who just spoke
            
            agent = self.get_agent(agent_id)
            if not agent:
                continue
            
            should_speak, reasoning = agent.should_speak_next(
                dialogue_state, last_speaker_id, conversation_flow_context
            )
            
            if should_speak:
                speaking_candidates.append({
                    'agent_id': agent_id,
                    'agent': agent,
                    'reasoning': reasoning,
                    'priority': self._get_role_priority(agent.config.role)
                })
        
        if not speaking_candidates:
            # Fallback: round-robin selection
            return self._round_robin_selection(dialogue_state.active_agents, last_speaker_id)
        
        # Select the highest priority candidate
        speaking_candidates.sort(key=lambda x: x['priority'], reverse=True)
        selected = speaking_candidates[0]
        
        logger.info(
            f"Selected {selected['agent'].config.name} to speak next. "
            f"Reasoning: {selected['reasoning']}"
        )
        
        return selected['agent_id']
    
    def _get_role_priority(self, role: AgentRole) -> int:
        """Get priority score for agent roles"""
        priority_map = {
            AgentRole.LEAD: 4,
            AgentRole.MODERATOR: 3,
            AgentRole.SKEPTIC: 2,
            AgentRole.CONTRIBUTOR: 1
        }
        return priority_map.get(role, 1)
    
    def _round_robin_selection(self, active_agents: List[str], last_speaker_id: Optional[str]) -> Optional[str]:
        """Fallback round-robin agent selection"""
        if not active_agents:
            return None
        
        if not last_speaker_id:
            return active_agents[0]
        
        try:
            current_index = active_agents.index(last_speaker_id)
            next_index = (current_index + 1) % len(active_agents)
            return active_agents[next_index]
        except ValueError:
            return active_agents[0]
    
    async def generate_agent_response(
        self,
        agent_id: str,
        dialogue_state: DialogueState,
        last_speaker_name: Optional[str] = None
    ) -> Optional[str]:
        """
        Generate a response from the specified agent
        """
        agent = self.get_agent(agent_id)
        if not agent:
            logger.error(f"Agent {agent_id} not found")
            return None
        
        try:
            # Get conversation context for this agent
            conversation_history = dialogue_state.get_agent_context(agent_id)
            
            # Generate response
            response = await agent.generate_response(
                conversation_history=conversation_history,
                current_topic=dialogue_state.topic,
                last_speaker=last_speaker_name
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Failed to generate response for agent {agent_id}: {e}")
            return "I apologize, but I'm having trouble generating a response right now."
    
    def extract_user_questions(self, agent_id: str, response: str) -> List[str]:
        """
        Extract user questions from an agent's response
        """
        agent = self.get_agent(agent_id)
        if not agent:
            return []
        
        return agent.extract_user_questions(response)
    
    def get_conversation_summary(self, dialogue_state: DialogueState) -> Dict[str, str]:
        """
        Get conversation summary from each agent's perspective
        """
        summaries = {}
        
        for agent_id in dialogue_state.active_agents:
            agent = self.get_agent(agent_id)
            if agent:
                agent_context = dialogue_state.get_agent_context(agent_id)
                summary = agent.get_conversation_summary(agent_context)
                summaries[agent_id] = summary
        
        return summaries
    
    def validate_configuration(self) -> List[str]:
        """
        Validate the conversation configuration and return any issues
        """
        issues = []
        
        if len(self.config.agents) < 2:
            issues.append("At least 2 agents are required for a multi-way conversation")
        
        if len(self.config.agents) > 5:
            issues.append("Maximum of 5 agents supported for optimal conversation flow")
        
        # Check for required roles
        roles = [agent.role for agent in self.config.agents]
        if AgentRole.LEAD not in roles:
            issues.append("At least one LEAD agent is required")
        
        # Check for duplicate agent IDs
        agent_ids = [agent.id for agent in self.config.agents]
        if len(agent_ids) != len(set(agent_ids)):
            issues.append("Agent IDs must be unique")
        
        return issues