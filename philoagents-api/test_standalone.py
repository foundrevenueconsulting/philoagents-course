#!/usr/bin/env python3
"""
Standalone test for multi-way conversation models (bypasses main package init)
"""
import sys
import os

# Add the src directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))


def test_domain_models():
    """Test domain models without package initialization"""
    print("🧪 Testing Domain Models (Standalone)")
    print("=" * 50)
    
    try:
        # Import domain models directly
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'philoagents', 'domain', 'multi_way'))
        
        import conversation_config
        import dialogue_state
        
        print("   ✅ Raw modules imported successfully")
        
        # Test enums
        roles = conversation_config.AgentRole
        formats = conversation_config.ConversationFormat
        print(f"   ✅ Agent roles: {[role.value for role in roles]}")
        print(f"   ✅ Conversation formats: {[fmt.value for fmt in formats]}")
        
        # Test predefined configurations
        configs = conversation_config.PREDEFINED_CONFIGURATIONS
        print(f"   ✅ Found {len(configs)} predefined configurations:")
        
        for config_id, config in configs.items():
            print(f"      - {config_id}: {config.name}")
            print(f"        Agents: {[a.name for a in config.agents]}")
            print(f"        Roles: {[a.role.value for a in config.agents]}")
            
            # Basic validation
            assert len(config.agents) >= 2, f"{config_id}: Must have at least 2 agents"
            assert len(config.agents) <= 5, f"{config_id}: Must have at most 5 agents"
            
            # Check for lead agent
            lead_agents = [a for a in config.agents if a.role == conversation_config.AgentRole.LEAD]
            assert len(lead_agents) >= 1, f"{config_id}: Must have at least one lead agent"
            
            # Check unique IDs
            agent_ids = [a.id for a in config.agents]
            assert len(agent_ids) == len(set(agent_ids)), f"{config_id}: Agent IDs must be unique"
            
            print(f"        ✅ Validation passed")
            print()
        
        # Test dialogue state models
        status_values = [status.value for status in dialogue_state.ConversationStatus]
        role_values = [role.value for role in dialogue_state.MessageRole]
        print(f"   ✅ Conversation statuses: {status_values}")
        print(f"   ✅ Message roles: {role_values}")
        
        # Create a test dialogue state
        test_dialogue = dialogue_state.DialogueState(
            session_id="test_session",
            config_id="business_strategy"
        )
        
        # Test message operations
        test_message = dialogue_state.Message(
            id="test_msg_1",
            role=dialogue_state.MessageRole.USER,
            content="This is a test message"
        )
        
        test_dialogue.add_message(test_message)
        print(f"   ✅ Test dialogue state created with {len(test_dialogue.messages)} message(s)")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Domain model test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_configuration_details():
    """Test detailed configuration properties"""
    print("📋 Testing Configuration Details")
    print("=" * 50)
    
    try:
        sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src', 'philoagents', 'domain', 'multi_way'))
        import conversation_config
        
        configs = conversation_config.PREDEFINED_CONFIGURATIONS
        
        for config_id, config in configs.items():
            print(f"\n   Configuration: {config.name}")
            print(f"   ID: {config_id}")
            print(f"   Format: {config.format.value}")
            print(f"   Max Rounds: {config.max_rounds}")
            print(f"   Human Feedback: {config.allow_human_feedback}")
            print(f"   Description: {config.description}")
            
            print(f"   Agents ({len(config.agents)}):")
            for agent in config.agents:
                print(f"      • {agent.name} ({agent.role.value})")
                print(f"        Expertise: {agent.domain_expertise}")
                print(f"        Colors: {agent.primary_color} / {agent.secondary_color}")
                print(f"        Traits: {', '.join(agent.personality_traits)}")
                print(f"        Model: {agent.model}")
                print()
        
        # Test configuration methods
        business_config = configs["business_strategy"]
        lead_agent = business_config.get_agent_by_role(conversation_config.AgentRole.LEAD)
        print(f"   ✅ Found lead agent: {lead_agent.name if lead_agent else 'None'}")
        
        ceo_agent = business_config.get_agent_by_id("ceo")
        print(f"   ✅ Found CEO agent: {ceo_agent.name if ceo_agent else 'None'}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Configuration detail test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


if __name__ == "__main__":
    def main():
        success = True
        
        try:
            # Test domain models
            success &= test_domain_models()
            print()
            
            # Test configuration details
            success &= test_configuration_details()
            
            if success:
                print("\n🎉 All standalone tests passed!")
                print("✨ Multi-way conversation models are working correctly!")
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