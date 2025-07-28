"""
Configuration models for multi-way conversations
"""
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class AgentRole(str, Enum):
    """Roles that agents can play in multi-way conversations"""
    LEAD = "lead"
    CONTRIBUTOR = "contributor"
    SKEPTIC = "skeptic"
    MODERATOR = "moderator"


class ConversationFormat(str, Enum):
    """Different conversation formats available"""
    DEBATE = "debate"
    COLLABORATIVE = "collaborative"
    BRAINSTORMING = "brainstorming"
    REVIEW = "review"
    SOCRATIC = "socratic"


class AgentConfig(BaseModel):
    """Configuration for an individual agent in multi-way conversation"""
    
    id: str = Field(description="Unique identifier for the agent")
    name: str = Field(description="Display name of the agent")
    role: AgentRole = Field(description="Role of the agent in conversation")
    domain_expertise: str = Field(description="Area of expertise for the agent")
    personality_traits: List[str] = Field(
        default=[], description="List of personality traits"
    )
    system_prompt: str = Field(description="System prompt defining agent behavior")
    model: str = Field(default="llama-3.3-70b-versatile", description="LLM model to use")
    
    # Visual configuration for UI
    primary_color: str = Field(description="Primary color for agent's visual theme")
    secondary_color: str = Field(description="Secondary color for agent's visual theme")
    avatar_style: str = Field(description="Avatar style identifier")


class ConversationConfig(BaseModel):
    """Configuration for a multi-way conversation setup"""
    
    id: str = Field(description="Unique identifier for the configuration")
    name: str = Field(description="Display name of the configuration")
    description: str = Field(description="Description of the conversation setup")
    format: ConversationFormat = Field(description="Format of the conversation")
    agents: List[AgentConfig] = Field(
        description="List of agents participating in the conversation"
    )
    max_rounds: int = Field(default=50, description="Maximum number of conversation rounds")
    allow_human_feedback: bool = Field(
        default=True, description="Whether users can provide feedback during conversation"
    )
    
    def get_agent_by_role(self, role: AgentRole) -> Optional[AgentConfig]:
        """Get first agent with specified role"""
        for agent in self.agents:
            if agent.role == role:
                return agent
        return None
    
    def get_agent_by_id(self, agent_id: str) -> Optional[AgentConfig]:
        """Get agent by ID"""
        for agent in self.agents:
            if agent.id == agent_id:
                return agent
        return None


# Predefined conversation configurations
PREDEFINED_CONFIGURATIONS = {
    "business_strategy": ConversationConfig(
        id="business_strategy",
        name="Business Strategy Session",
        description="Strategic planning discussion with business leaders",
        format=ConversationFormat.COLLABORATIVE,
        agents=[
            AgentConfig(
                id="ceo",
                name="CEO",
                role=AgentRole.LEAD,
                domain_expertise="Strategic leadership and vision",
                personality_traits=["decisive", "visionary", "pragmatic"],
                system_prompt="You are a CEO focused on strategic vision and company direction. You guide discussions toward actionable outcomes and consider market opportunities, competitive positioning, and long-term growth.",
                primary_color="#1E40AF",
                secondary_color="#3B82F6",
                avatar_style="formal"
            ),
            AgentConfig(
                id="cfo",
                name="CFO",
                role=AgentRole.CONTRIBUTOR,
                domain_expertise="Financial strategy and risk management",
                personality_traits=["analytical", "cautious", "detail-oriented"],
                system_prompt="You are a CFO who analyzes financial implications of strategic decisions. You focus on ROI, budget constraints, financial risks, and sustainable growth models.",
                primary_color="#059669",
                secondary_color="#10B981",
                avatar_style="professional"
            ),
            AgentConfig(
                id="cto",
                name="CTO",
                role=AgentRole.CONTRIBUTOR,
                domain_expertise="Technology strategy and innovation",
                personality_traits=["innovative", "technical", "forward-thinking"],
                system_prompt="You are a CTO who evaluates technology implications and feasibility. You consider technical architecture, scalability, security, and innovation opportunities.",
                primary_color="#7C3AED",
                secondary_color="#A855F7",
                avatar_style="technical"
            ),
            AgentConfig(
                id="marketing_director",
                name="Marketing Director",
                role=AgentRole.SKEPTIC,
                domain_expertise="Market analysis and customer insights",
                personality_traits=["customer-focused", "creative", "data-driven"],
                system_prompt="You are a Marketing Director who challenges assumptions with market data and customer insights. You question strategies by addressing your colleagues directly and sharing specific concerns about customer needs and market trends. Present your challenges as insights for the team to consider, not as questions for the user.",
                primary_color="#DC2626",
                secondary_color="#EF4444",
                avatar_style="creative"
            )
        ]
    ),
    
    "research_team": ConversationConfig(
        id="research_team",
        name="Scientific Research Discussion",
        description="Collaborative research planning and analysis",
        format=ConversationFormat.COLLABORATIVE,
        agents=[
            AgentConfig(
                id="lead_researcher",
                name="Lead Researcher",
                role=AgentRole.LEAD,
                domain_expertise="Research methodology and project management",
                personality_traits=["methodical", "curious", "collaborative"],
                system_prompt="You are a Lead Researcher who guides scientific discussions with methodological rigor. You ensure research questions are well-defined and approaches are scientifically sound.",
                primary_color="#0F766E",
                secondary_color="#14B8A6",
                avatar_style="academic"
            ),
            AgentConfig(
                id="data_scientist",
                name="Data Scientist",
                role=AgentRole.CONTRIBUTOR,
                domain_expertise="Data analysis and statistical modeling",
                personality_traits=["analytical", "precise", "evidence-based"],
                system_prompt="You are a Data Scientist who provides statistical insights and analytical approaches. You focus on data quality, statistical significance, and appropriate modeling techniques.",
                primary_color="#1E40AF",
                secondary_color="#3B82F6",
                avatar_style="technical"
            ),
            AgentConfig(
                id="research_ethicist",
                name="Research Ethicist",
                role=AgentRole.SKEPTIC,
                domain_expertise="Research ethics and compliance",
                personality_traits=["principled", "thoughtful", "protective"],
                system_prompt="You are a Research Ethicist who ensures ethical considerations are addressed. You question research approaches that may have ethical implications or compliance issues.",
                primary_color="#DC2626",
                secondary_color="#EF4444",
                avatar_style="formal"
            )
        ]
    ),
    
    "creative_team": ConversationConfig(
        id="creative_team",
        name="Creative Brainstorming",
        description="Innovative ideation and creative problem-solving",
        format=ConversationFormat.BRAINSTORMING,
        agents=[
            AgentConfig(
                id="creative_director",
                name="Creative Director",
                role=AgentRole.LEAD,
                domain_expertise="Creative vision and artistic direction",
                personality_traits=["imaginative", "inspirational", "bold"],
                system_prompt="You are a Creative Director who leads innovative thinking and artistic vision. You encourage bold ideas and help transform concepts into compelling creative solutions.",
                primary_color="#DC2626",
                secondary_color="#F59E0B",
                avatar_style="artistic"
            ),
            AgentConfig(
                id="writer",
                name="Writer",
                role=AgentRole.CONTRIBUTOR,
                domain_expertise="Storytelling and content creation",
                personality_traits=["expressive", "empathetic", "detailed"],
                system_prompt="You are a Writer who develops narrative elements and messaging. You focus on storytelling, audience engagement, and clear communication of ideas.",
                primary_color="#7C3AED",
                secondary_color="#A855F7",
                avatar_style="literary"
            ),
            AgentConfig(
                id="designer",
                name="Designer",
                role=AgentRole.CONTRIBUTOR,
                domain_expertise="Visual design and user experience",
                personality_traits=["visual", "user-focused", "iterative"],
                system_prompt="You are a Designer who considers visual and experiential aspects. You think about user interaction, aesthetic appeal, and practical implementation of creative concepts.",
                primary_color="#059669",
                secondary_color="#10B981",
                avatar_style="design"
            )
        ]
    )
}