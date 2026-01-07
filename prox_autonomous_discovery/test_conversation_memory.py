#!/usr/bin/env python3
"""Test conversation memory and context awareness."""

from ai.enhanced_chat import enhanced_chat_agent

def test_conversation_flow():
    """Test a multi-turn conversation with memory."""
    
    print("=== TESTING CONVERSATION MEMORY ===\n")
    
    # Conversation scenario: User setting up a home office
    conversation = [
        "I'm setting up a home office in my bedroom and need some furniture",
        "I prefer modern style and have a budget around $500 total",
        "Actually, I need a desk that's compact since the space is small",
        "What about storage? I have a lot of paperwork to organize",
        "Show me some chair options that go well with modern desks"
    ]
    
    session_id = None
    
    for i, message in enumerate(conversation, 1):
        print(f"TURN {i}: User says: \"{message}\"")
        print("-" * 60)
        
        try:
            result = enhanced_chat_agent.chat(
                message=message,
                session_id=session_id
            )
            
            # Use the session ID from the response for continuity
            session_id = result.get('session_id')
            
            print(f"Assistant: {result['response']}")
            print(f"Session ID: {session_id}")
            print(f"Products recommended: {len(result['recommendations'])}")
            
            if result['recommendations']:
                print("Top recommendations:")
                for j, product in enumerate(result['recommendations'][:3], 1):
                    match_reason = product.get('match_reason', 'Good match')
                    print(f"  {j}. {product['product_name']} - ${product['price']} ({match_reason})")
            
            # Show conversation context
            context = result.get('context', {})
            turn_number = context.get('conversation_turn', 0)
            print(f"Conversation turn: {turn_number}")
            
            print()
            
        except Exception as e:
            print(f"ERROR: {e}")
            print()
    
    print("=== CONVERSATION COMPLETE ===")
    print(f"Final session ID: {session_id}")

def test_context_persistence():
    """Test that context persists across separate calls."""
    
    print("\n=== TESTING CONTEXT PERSISTENCE ===\n")
    
    # First conversation
    result1 = enhanced_chat_agent.chat("I need storage for my small kitchen")
    session_id = result1.get('session_id')
    print(f"Message 1: Created session {session_id}")
    print(f"Response: {result1['response'][:100]}...")
    
    # Second conversation - should remember kitchen context
    result2 = enhanced_chat_agent.chat(
        "What about something for spices?",
        session_id=session_id
    )
    print(f"\nMessage 2: Using same session")
    print(f"Response: {result2['response'][:100]}...")
    print(f"Should remember kitchen context: {'kitchen' in result2['response'].lower() or 'spice' in result2['response'].lower()}")
    
    # Test new session doesn't have context
    result3 = enhanced_chat_agent.chat("What about something for spices?")
    new_session = result3.get('session_id')
    print(f"\nMessage 3: New session {new_session}")
    print(f"Response: {result3['response'][:100]}...")
    print(f"Should NOT have kitchen context: {new_session != session_id}")

if __name__ == "__main__":
    test_conversation_flow()
    test_context_persistence()