#!/usr/bin/env python3
"""
Simple test script for multi-way conversations (without environment dependencies)
"""

import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


def test_imports():
    """Test that all modules can be imported"""
    print("🧪 Testing Module Imports")
    print("=" * 50)

    try:
        # Test domain models
        from philoagents.domain.multi_way.conversation_config import (
            AgentRole,
            ConversationFormat,
            AgentConfig,
            ConversationConfig,
            PREDEFINED_CONFIGURATIONS,
        )

        print("   ✅ Domain models imported successfully")

        from philoagents.domain.multi_way.dialogue_state import (
            MessageRole,
            ConversationStatus,
            Message,
            TurnInfo,
            DialogueState,
        )

        print("   ✅ Dialogue state models imported successfully")

        # Test configuration validation
        print(
            f"\n   📋 Found {len(PREDEFINED_CONFIGURATIONS)} predefined configurations:"
        )
        for config_id, config in PREDEFINED_CONFIGURATIONS.items():
            print(f"      - {config_id}: {config.name}")
            print(f"        Format: {config.format.value}")
            print(
                f"        Agents: {[f'{a.name} ({a.role.value})' for a in config.agents]}"
            )
            print()

        return True

    except ImportError as e:
        print(f"   ❌ Import failed: {e}")
        return False


def test_models():
    """Test model creation and validation"""
    print("🔧 Testing Model Creation")
    print("=" * 50)

    try:
        from philoagents.domain.multi_way.conversation_config import (
            AgentRole,
            ConversationFormat,
            AgentConfig,
            ConversationConfig,
        )
        from philoagents.domain.multi_way.dialogue_state import DialogueState

        # Test AgentConfig creation
        agent = AgentConfig(
            id="test_agent",
            name="Test Agent",
            role=AgentRole.LEAD,
            domain_expertise="Testing frameworks",
            system_prompt="You are a test agent",
            primary_color="#FF0000",
            secondary_color="#00FF00",
            avatar_style="test",
        )
        print("   ✅ AgentConfig created successfully")

        # Test ConversationConfig creation
        config = ConversationConfig(
            id="test_config",
            name="Test Configuration",
            description="A test configuration",
            format=ConversationFormat.COLLABORATIVE,
            agents=[agent],
        )
        print("   ✅ ConversationConfig created successfully")

        # Test DialogueState creation
        dialogue_state = DialogueState(
            session_id="test_session", config_id="test_config"
        )
        print("   ✅ DialogueState created successfully")

        # Test state operations
        from philoagents.domain.multi_way.dialogue_state import Message, MessageRole

        message = Message(id="test_msg", role=MessageRole.USER, content="Test message")
        dialogue_state.add_message(message)
        print("   ✅ Message added to dialogue state")

        print(f"   📊 Dialogue state status: {dialogue_state.status.value}")
        print(f"   📊 Message count: {len(dialogue_state.messages)}")

        return True

    except Exception as e:
        print(f"   ❌ Model test failed: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_predefined_configurations():
    """Test predefined configuration validation"""
    print("📋 Testing Predefined Configurations")
    print("=" * 50)

    try:
        from philoagents.domain.multi_way.conversation_config import (
            PREDEFINED_CONFIGURATIONS,
        )

        for config_id, config in PREDEFINED_CONFIGURATIONS.items():
            print(f"\n   Testing {config_id}...")

            # Basic validation
            assert len(config.agents) >= 2, "Must have at least 2 agents"
            assert len(config.agents) <= 5, "Must have at most 5 agents"

            # Check for lead agent
            lead_agents = [a for a in config.agents if a.role.value == "lead"]
            assert len(lead_agents) >= 1, "Must have at least one lead agent"

            # Check unique agent IDs
            agent_ids = [a.id for a in config.agents]
            assert len(agent_ids) == len(set(agent_ids)), "Agent IDs must be unique"

            # Check required fields
            for agent in config.agents:
                assert agent.name, "Agent must have a name"
                assert agent.domain_expertise, "Agent must have domain expertise"
                assert agent.system_prompt, "Agent must have a system prompt"
                assert agent.primary_color, "Agent must have a primary color"
                assert agent.secondary_color, "Agent must have a secondary color"

            print(f"      ✅ {config.name} passed validation")
            print(f"         Agents: {len(config.agents)}")
            print(f"         Format: {config.format.value}")
            print(f"         Max rounds: {config.max_rounds}")

        print("\n   🎉 All predefined configurations are valid!")
        return True

    except Exception as e:
        print(f"   ❌ Configuration validation failed: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":

    def main():
        success = True

        try:
            # Test imports
            success &= test_imports()
            print()

            # Test model creation
            success &= test_models()
            print()

            # Test predefined configurations
            success &= test_predefined_configurations()

            if success:
                print("\n🎉 All tests passed! Multi-way conversation system is ready.")
            else:
                print("\n❌ Some tests failed.")

        except Exception as e:
            print(f"\n💥 Test suite failed with error: {e}")
            import traceback

            traceback.print_exc()
            success = False

        return success

    # Run the tests
    success = main()
    exit(0 if success else 1)
