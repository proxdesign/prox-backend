#!/usr/bin/env python3
"""Test the enhanced chat functionality."""

import json
from ai.enhanced_chat import enhanced_chat_agent

def test_chat_scenarios():
    """Test various chat scenarios."""
    
    test_messages = [
        "I need help organizing my small bedroom - there's clutter everywhere!",
        "Looking for a desk for my home office that doesn't take up too much space",
        "My kitchen is so messy, I need better storage solutions",
        "I live in a studio apartment and need furniture that serves multiple purposes",
        "Need a comfortable office chair under $200 for long work sessions"
    ]
    
    print("=== TESTING ENHANCED CHAT FUNCTIONALITY ===\n")
    
    for i, message in enumerate(test_messages, 1):
        print(f"TEST {i}: {message}")
        print("-" * 60)
        
        try:
            result = enhanced_chat_agent.chat(message)
            
            print(f"Response: {result['response']}")
            print(f"Problems identified: {result['problems_identified']}")
            print(f"Products found: {len(result['recommendations'])}")
            
            if result['recommendations']:
                print("Top recommendations:")
                for j, product in enumerate(result['recommendations'][:3], 1):
                    print(f"  {j}. {product['product_name']} - ${product['price']}")
                    print(f"     {product.get('match_reason', 'Good match')}")
            
            room_types = result['analysis'].get('room_types', []) or []
            style_prefs = result['analysis'].get('style_preferences', []) or []
            print(f"Analysis summary: {len(room_types)} rooms, {len(style_prefs)} styles")
            
        except Exception as e:
            print(f"ERROR: {e}")
        
        print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    test_chat_scenarios()