# Multi-Way Agent Discussion Feature Specification

## Overview
Add a multi-persona conversation system to PhiloAgents, enabling multiple AI agent personas to engage in structured dialogues. This feature allows users to witness and participate in rich discussions where multiple AI personas debate, challenge, and build upon each other's ideas across various domains and topics.

## Core Features

### 1. Multi-Persona Conversations
- **Simultaneous Participants**: 2-5 agent personas in a single conversation
- **Role-Based Interaction**: 
  - **Lead Agent**: Initiates and guides discussion
  - **Contributing Agents**: Respond and build on ideas
  - **Skeptic/Reviewer**: Questions assumptions and identifies logical issues
- **Turn-Taking System**: Structured conversation flow with automatic speaker rotation
- **Human Participation**: Users can interject questions or steer the discussion

### 2. Persona Configuration System
- **Predefined Configurations**: Curated agent groups for specific topics
  - Business Strategy: CEO, CFO, CTO, Marketing Director
  - Scientific Research: Lead Researcher, Data Scientist, Ethicist, Project Manager
  - Creative Team: Director, Writer, Designer, Producer
  - Custom Groups: User-selected agent combinations
- **Dynamic Prompting**: Each agent maintains their domain expertise and communication style
- **Conversation Contexts**: Different discussion formats (debate, collaborative problem-solving, brainstorming, review)

### 3. Integration Architecture

#### Backend Architecture (philoagents-api)
```
src/philoagents/
├── application/
│   ├── multi_way_conversation/
│   │   ├── __init__.py
│   │   ├── conversation_orchestrator.py    # Main multi-way conversation controller
│   │   ├── persona_manager.py             # Manages multiple agent personas
│   │   ├── turn_coordinator.py            # Handles turn-taking logic
│   │   └── dialogue_state.py              # Tracks multi-way conversation state
│   └── conversation_service/              # Existing single-agent service
├── domain/
│   ├── multi_way/
│   │   ├── __init__.py
│   │   ├── conversation_config.py         # Configuration models
│   │   ├── dialogue_roles.py              # Role definitions and behaviors
│   │   └── prompts_multi_way.py           # Multi-persona system prompts
│   └── philosopher.py                     # Existing agent models
└── infrastructure/
    └── api.py                             # Extended with new endpoints
```

#### API Endpoints
```python
# New endpoints for multi-way conversations
POST   /api/multi-way/start               # Initialize multi-way conversation
POST   /api/multi-way/message             # Send user message
GET    /api/multi-way/stream              # SSE stream for real-time updates
POST   /api/multi-way/configurations      # Get available configurations
GET    /api/multi-way/{session_id}/history # Get conversation history
DELETE /api/multi-way/{session_id}        # End conversation
```

### 4. Core Components

#### ConversationOrchestrator
- Manages the overall conversation flow
- Coordinates between multiple agent personas
- Handles user interjections and feedback
- Maintains conversation coherence and topic focus

#### PersonaManager
- Instantiates and manages multiple ConfigurableAgent instances
- Applies role-specific behaviors and prompts
- Ensures domain expertise accuracy in agent perspectives
- Manages agent-specific memory and context

#### TurnCoordinator
- Implements intelligent turn-taking logic
- Determines next speaker based on:
  - Conversation flow and relevance
  - Role responsibilities (lead, contributor, skeptic)
  - User interruptions or questions
- Prevents conversation monopolization

#### DialogueState
- Tracks multi-way conversation state
- Maintains conversation history with speaker attribution
- Manages topic progression and sub-topics
- Handles conversation summaries and key points

### 5. Implementation Details

#### Agent Persona Structure
```python
class ConfigurableAgent:
    def __init__(self, agent_config, role, conversation_context):
        self.name = agent_config.name
        self.domain_expertise = agent_config.domain_expertise
        self.personality_traits = agent_config.traits
        self.role = role  # "lead", "contributor", "skeptic"
        self.conversation_context = conversation_context
        self.groq_client = GroqClient()
        
    def generate_response(self, conversation_history, last_speaker, topic):
        # Generate contextually appropriate response
        pass
        
    def should_speak_next(self, conversation_state):
        # Determine if this agent should speak next
        pass
```

#### Conversation Flow
1. User selects configuration or custom agent group
2. System initializes agents with roles and context
3. Lead agent introduces topic/question
4. Turn coordinator manages speaking order
5. Each agent contributes based on role and context
6. User can interject at any time
7. Conversation continues until natural conclusion or user ends

### 6. User Experience & Visual Design

#### Next.js Integration
- New route: `/discussions` - Multi-way discussion interface
- Components:
  - ConfigurationSelector: Choose predefined or custom groups
  - DiscussionInterface: Real-time conversation display
  - ParticipantList: Shows active agents and roles
  - UserInput: Allows questions and topic steering
  - ConversationControls: Pause, save, export functionality

#### UI Features
- Real-time streaming responses
- Visual indicators for current speaker
- Agent avatars and expertise tooltips
- Conversation threading and topic navigation
- Export conversations as markdown or PDF

#### Persona-Specific Visual Design

**Individual Agent Styling:**
```typescript
interface AgentVisualTheme {
  primaryColor: string;        // Main color for agent's messages
  secondaryColor: string;      // Accent color for highlights
  avatarStyle: AvatarStyle;    // Unique avatar appearance
  messageStyle: {
    backgroundColor: string;
    borderStyle: string;
    fontFamily?: string;
    animationStyle: 'slide' | 'fade' | 'bounce';
  };
  typingIndicator: {
    style: 'dots' | 'pulse' | 'wave';
    color: string;
  };
}
```

**Visual Differentiation Strategies:**

1. **Color-Coded Messages**
   - Each agent has a unique color palette
   - Message bubbles with agent-specific backgrounds
   - Gradient borders for visual distinction
   - Subtle animations matching agent personality

2. **Avatar System**
   - Dynamic avatars reflecting agent expertise
   - Animated states (thinking, speaking, listening)
   - Role badges (Lead, Contributor, Skeptic)
   - Expertise icons (tech, finance, creative, etc.)

3. **Typography & Layout**
   - Font variations for different agent types
   - Message alignment patterns (left/right/center)
   - Unique quote styles for emphasis
   - Agent-specific emoji/icon sets

4. **Interactive Elements**
   ```tsx
   // Example React component structure
   <AgentMessage
     agent={agent}
     theme={agentThemes[agent.id]}
     isCurrentSpeaker={currentSpeaker === agent.id}
   >
     <Avatar 
       src={agent.avatar}
       status={agent.status}
       role={agent.role}
     />
     <MessageBubble
       style={{
         background: `linear-gradient(135deg, ${theme.primaryColor}15, ${theme.secondaryColor}10)`,
         borderLeft: `3px solid ${theme.primaryColor}`,
         animation: theme.messageStyle.animationStyle
       }}
     >
       <AgentName>{agent.name}</AgentName>
       <MessageContent>{message}</MessageContent>
       <Timestamp>{timestamp}</Timestamp>
     </MessageBubble>
   </AgentMessage>
   ```

5. **Conversation Flow Visualization**
   - Thread lines connecting related messages
   - Visual "handoff" animations between speakers
   - Topic transition indicators
   - Consensus/disagreement visual cues

6. **Responsive Design Considerations**
   - Mobile: Stacked message view with swipe gestures
   - Tablet: Split-screen with agent list sidebar
   - Desktop: Full conversation view with rich interactions

**Example Agent Visual Themes:**

```typescript
const agentThemes = {
  ceo: {
    primaryColor: '#1E40AF',      // Professional blue
    secondaryColor: '#3B82F6',
    avatarStyle: 'formal',
    messageStyle: {
      backgroundColor: '#EFF6FF',
      borderStyle: 'solid',
      animationStyle: 'slide'
    }
  },
  creative_director: {
    primaryColor: '#DC2626',      // Creative red
    secondaryColor: '#F59E0B',
    avatarStyle: 'artistic',
    messageStyle: {
      backgroundColor: '#FEF3C7',
      borderStyle: 'dashed',
      fontFamily: 'Georgia, serif',
      animationStyle: 'bounce'
    }
  },
  data_scientist: {
    primaryColor: '#059669',      // Analytical green
    secondaryColor: '#6366F1',
    avatarStyle: 'technical',
    messageStyle: {
      backgroundColor: '#F0FDF4',
      borderStyle: 'dotted',
      fontFamily: 'Consolas, monospace',
      animationStyle: 'fade'
    }
  }
};
```

**Accessibility Features:**
- High contrast mode for readability
- Screen reader optimizations
- Keyboard navigation support
- Colorblind-friendly palettes
- Text size adjustments

### 7. Technical Specifications

#### Groq API Integration
- Model: `mixtral-8x7b-32768` for rich multi-domain discourse
- Streaming responses for real-time experience
- Context window management for long conversations
- Rate limiting and error handling

#### State Management
- MongoDB for conversation persistence
- Session-based conversation tracking
- Checkpoint system for resumable conversations
- Analytics for popular configurations and topics

#### Performance Considerations
- Concurrent request handling for multiple philosophers
- Response caching for common discussion patterns
- Optimized context pruning for long conversations
- Background summarization for context management

### 8. Future Enhancements

#### Phase 2 Features
- **Database-Driven Personas**: Store agent configurations in MongoDB
- **Custom Agent Creation**: Users define new agent perspectives and expertise
- **Game World Integration**: Multi-way discussions with game NPCs
- **Collaborative Document Creation**: Agents co-author documents and reports
- **Debate Tournaments**: Structured topic-based competitions

#### Phase 3 Features
- **Voice Integration**: Audio conversations with distinct agent voices
- **AR/VR Experiences**: Immersive collaborative environments
- **Educational Modules**: Guided learning through multi-way dialogue
- **Community Configurations**: Share and rate agent group configurations

## Implementation Timeline

### Week 1-2: Core Infrastructure
- Set up multi-way conversation architecture
- Implement ConversationOrchestrator and PersonaManager
- Create base ConfigurableAgent class

### Week 3-4: Conversation Logic
- Implement TurnCoordinator with intelligent speaker selection
- Build DialogueState management
- Integrate Groq API for multi-agent completions

### Week 5-6: API and Backend
- Create FastAPI endpoints
- Implement WebSocket/SSE streaming
- Add MongoDB persistence

### Week 7-8: Frontend Integration
- Build Next.js discussion interface
- Implement real-time conversation display
- Add configuration selection and controls

### Week 9-10: Testing and Polish
- End-to-end testing with various configurations
- Performance optimization
- UI/UX refinements
- Documentation

## Success Metrics
- **Conversation Quality**: Coherent, domain-accurate discussions
- **User Engagement**: Average conversation length > 10 exchanges
- **Performance**: < 2s response time per agent
- **Adoption**: 50% of users try multi-way discussions within first week

## Risk Mitigation
- **Conversation Coherence**: Implement strong context management and turn coordination
- **Performance**: Use concurrent processing and response streaming
- **Cost Management**: Implement token limits and conversation caps
- **Content Quality**: Extensive prompt engineering and testing