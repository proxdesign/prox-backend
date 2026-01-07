#!/usr/bin/env python3
"""Test the multi-step recommendation flow."""

from ai.enhanced_chat import enhanced_chat_agent
from ai.recommendation_flow import FlowStage

def test_guided_discovery():
    """Test the guided discovery conversation flow."""
    
    print("=== TESTING MULTI-STEP RECOMMENDATION FLOW ===\n")
    
    # Scenario: User with vague initial request
    conversation = [
        "I need some furniture for my place",  # Should trigger discovery flow
        "It's for my bedroom",                 # Room clarification
        "It's pretty small",                   # Space constraints
        "I like modern style",                 # Style preferences  
        "Around $300 budget",                  # Budget discussion
        "I need storage mainly"                # Feature clarification
    ]
    
    session_id = None
    
    for i, message in enumerate(conversation, 1):
        print(f"STEP {i}: User: \"{message}\"")
        print("-" * 50)
        
        try:
            result = enhanced_chat_agent.chat(
                message=message,
                session_id=session_id
            )
            
            session_id = result.get('session_id')
            
            print(f"Assistant: {result['response']}")
            print(f"Products found: {len(result.get('recommendations', []))}")
            
            # Show flow progress if available in context
            context = result.get('context', {})
            if context.get('conversation_turn'):
                print(f"Conversation turn: {context.get('conversation_turn')}")
            
            if result.get('recommendations'):
                print("Current recommendations:")
                for j, product in enumerate(result['recommendations'][:2], 1):
                    print(f"  {j}. {product['product_name']} - ${product['price']}")
            
            print()
            
        except Exception as e:
            print(f"ERROR: {e}")
            print()
    
    print("=== FLOW TEST COMPLETE ===")

def test_flow_stages():
    """Test different flow stages and transitions."""
    
    print("\n=== TESTING FLOW STAGE DETECTION ===\n")
    
    test_scenarios = [
        {
            'message': "I need furniture",
            'expected_stage': FlowStage.INITIAL_DISCOVERY,
            'description': "Vague initial request"
        },
        {
            'message': "Looking for a desk for my small home office",
            'context': {'preferences': {'room_types': ['office']}},
            'expected_stage': FlowStage.SPACE_CLARIFICATION,
            'description': "Room mentioned, need space details"
        },
        {
            'message': "I prefer modern style",
            'context': {
                'preferences': {
                    'room_types': ['office'],
                    'furniture_types_needed': ['desk']
                }
            },
            'expected_stage': FlowStage.STYLE_PREFERENCE,
            'description': "Style preference given"
        }
    ]
    
    from ai.recommendation_flow import recommendation_flow
    
    for i, scenario in enumerate(test_scenarios, 1):
        print(f"SCENARIO {i}: {scenario['description']}")
        print(f"Message: \"{scenario['message']}\"")
        
        # Mock session context
        session_context = {
            'preferences': scenario.get('context', {}).get('preferences', {}),
            'conversation_length': 1
        }
        
        # Mock analysis (simplified)
        analysis = {
            'room_types': session_context['preferences'].get('room_types', []),
            'furniture_types_needed': session_context['preferences'].get('furniture_types_needed', [])
        }
        
        detected_stage = recommendation_flow.analyze_conversation_stage(session_context, analysis)
        
        print(f"Detected stage: {detected_stage.value}")
        print(f"Expected stage: {scenario['expected_stage'].value}")
        print(f"Match: {'✓' if detected_stage == scenario['expected_stage'] else '✗'}")
        
        # Get stage guidance
        guidance = recommendation_flow.get_stage_guidance(detected_stage, session_context)
        print(f"Progress: {guidance['progress_percentage']}%")
        
        clarifying_q = recommendation_flow.generate_clarifying_question(
            detected_stage, session_context, analysis
        )
        if clarifying_q:
            print(f"Suggested question: \"{clarifying_q}\"")
        
        print()

if __name__ == "__main__":
    test_guided_discovery()
    test_flow_stages()