#!/usr/bin/env python3
"""
Simple test script for multi-way conversations
"""

import asyncio
import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))

from philoagents.application.multi_way_conversation.conversation_orchestrator import (
    ConversationOrchestrator,
)
from philoagents.domain.multi_way.conversation_config import PREDEFINED_CONFIGURATIONS


async def test_basic_functionality():
    """Test basic multi-way conversation functionality"""
    print("🧪 Testing Multi-Way Conversation System")
    print("=" * 50)

    # Initialize orchestrator
    orchestrator = ConversationOrchestrator()

    # Test 1: Get available configurations
    print("\n1. Testing configuration retrieval...")
    configs = orchestrator.get_available_configurations()
    print(f"   ✅ Found {len(configs)} configurations:")
    for config_id, config in configs.items():
        print(f"      - {config_id}: {config.name} ({len(config.agents)} agents)")

    # Test 2: Start a conversation
    print("\n2. Testing conversation startup...")
    session_id, dialogue_state = await orchestrator.start_conversation(
        "business_strategy"
    )
    print(f"   ✅ Started session: {session_id}")
    print(f"   ✅ Status: {dialogue_state.status.value}")
    print(f"   ✅ Active agents: {len(dialogue_state.active_agents)}")

    # Test 3: Set topic
    print("\n3. Testing topic setting...")
    dialogue_state = await orchestrator.set_topic(
        session_id, "Should we launch a new AI product line?"
    )
    print(f"   ✅ Topic set: {dialogue_state.topic}")
    print(f"   ✅ Status: {dialogue_state.status.value}")
    if dialogue_state.messages:
        print(
            f"   ✅ Introduction message: {dialogue_state.messages[-1].content[:100]}..."
        )

    # Test 4: Process user message
    print("\n4. Testing user message processing...")
    dialogue_state = await orchestrator.process_user_message(
        session_id,
        "I think we need to consider market demand and technical feasibility.",
    )
    print("   ✅ User message processed")
    print(f"   ✅ Total messages: {len(dialogue_state.messages)}")

    # Test 5: Generate response
    print("\n5. Testing agent response generation...")
    print("   Generating responses...")
    response_count = 0
    async for event in orchestrator.generate_next_response(session_id):
        if event["type"] == "speaker_info":
            print(f"   🗣️  Next speaker: {event['agent_name']} ({event['agent_role']})")
        elif event["type"] == "agent_response":
            print(f"   💬 Response: {event['content'][:100]}...")
            response_count += 1
            break  # Just test one response

    if response_count > 0:
        print("   ✅ Agent response generated successfully")
    else:
        print("   ⚠️  No agent response generated")

    # Test 6: Get conversation state
    print("\n6. Testing conversation state retrieval...")
    final_state = orchestrator.get_conversation_state(session_id)
    if final_state:
        print("   ✅ Retrieved conversation state")
        print(f"   ✅ Total messages: {len(final_state.messages)}")
        print(f"   ✅ Round count: {final_state.round_count}")

    # Test 7: End conversation
    print("\n7. Testing conversation cleanup...")
    end_state = await orchestrator.end_conversation(session_id)
    if end_state:
        print(f"   ✅ Conversation ended: {end_state.status.value}")

    print("\n🎉 All tests completed successfully!")
    return True


async def test_configuration_validation():
    """Test configuration validation"""
    print("\n🔍 Testing Configuration Validation")
    print("=" * 50)

    orchestrator = ConversationOrchestrator()

    # Test each predefined configuration
    for config_id, config in PREDEFINED_CONFIGURATIONS.items():
        print(f"\nValidating {config_id}...")

        from philoagents.application.multi_way_conversation.persona_manager import (
            PersonaManager,
        )

        persona_manager = PersonaManager(config)
        issues = persona_manager.validate_configuration()

        if issues:
            print(f"   ⚠️  Issues found: {issues}")
        else:
            print("   ✅ Configuration valid")
            print(f"      - Agents: {[agent.name for agent in config.agents]}")
            print(f"      - Roles: {[agent.role.value for agent in config.agents]}")


if __name__ == "__main__":

    async def main():
        try:
            # Test basic functionality
            await test_basic_functionality()

            # Test configuration validation
            await test_configuration_validation()

        except Exception as e:
            print(f"\n❌ Test failed with error: {e}")
            import traceback

            traceback.print_exc()
            return False

        return True

    # Run the tests
    success = asyncio.run(main())
    exit(0 if success else 1)
