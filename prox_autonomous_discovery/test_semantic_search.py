#!/usr/bin/env python3
"""Test semantic search functionality."""

from ai.semantic_search import semantic_search_engine

def test_semantic_understanding():
    """Test AI's understanding of natural language queries."""
    
    print("=== TESTING SEMANTIC SEARCH UNDERSTANDING ===\n")
    
    test_queries = [
        "I need something to make my messy bedroom more organized",
        "Looking for a comfortable chair for long work sessions at home", 
        "Help me find storage for my tiny kitchen",
        "I want modern furniture that doesn't break the bank",
        "Need a desk that fits in a small space but looks professional"
    ]
    
    for i, query in enumerate(test_queries, 1):
        print(f"TEST {i}: \"{query}\"")
        print("-" * 60)
        
        try:
            result = semantic_search_engine.semantic_search(query, limit=5)
            
            print(f"Intent Analysis:")
            intent = result.get('intent_analysis', {})
            print(f"  Primary intent: {intent.get('primary_intent', 'Unknown')}")
            
            problems = intent.get('problem_solving', {}).get('problems_mentioned', [])
            if problems:
                print(f"  Problems identified: {', '.join(problems)}")
            
            context = intent.get('context_clues', {})
            if context.get('room_hints'):
                print(f"  Room context: {', '.join(context['room_hints'])}")
            
            confidence = intent.get('confidence_score', 0)
            print(f"  AI confidence: {confidence:.1f}/1.0")
            
            print(f"\nSearch Results: {result['total_found']} products found")
            
            if result.get('products'):
                print("Top recommendations:")
                for j, product in enumerate(result['products'][:3], 1):
                    relevance = product.get('semantic_relevance', 0)
                    print(f"  {j}. {product['product_name']} - ${product['price']} (Relevance: {relevance:.2f})")
            
            strategies = result.get('search_strategies_used', [])
            if strategies:
                print(f"Search strategies: {', '.join(strategies)}")
            
            insights = result.get('semantic_insights', [])
            if insights:
                print(f"AI insights: {'; '.join(insights)}")
            
            print()
            
        except Exception as e:
            print(f"ERROR: {e}")
            print()

def test_intent_analysis():
    """Test detailed intent analysis capabilities."""
    
    print("=== TESTING INTENT ANALYSIS DEPTH ===\n")
    
    complex_query = "I'm frustrated with my cluttered home office - need affordable storage solutions that look professional and fit in a small corner space"
    
    print(f"Complex Query: \"{complex_query}\"")
    print("-" * 60)
    
    try:
        # Just analyze intent without full search
        intent_analysis = semantic_search_engine._analyze_search_intent(complex_query)
        
        print("Detailed Intent Analysis:")
        print(f"  Primary Intent: {intent_analysis.get('primary_intent', 'Unknown')}")
        
        problem_solving = intent_analysis.get('problem_solving', {})
        print(f"  Problems: {problem_solving.get('problems_mentioned', [])}")
        print(f"  Pain Points: {problem_solving.get('pain_points', [])}")
        
        context = intent_analysis.get('context_clues', {})
        print(f"  Room Hints: {context.get('room_hints', [])}")
        print(f"  Size Constraints: {context.get('size_constraints', [])}")
        print(f"  Budget Indicators: {context.get('budget_indicators', [])}")
        
        functional = intent_analysis.get('functional_requirements', {})
        print(f"  Must-Have Features: {functional.get('must_have_features', [])}")
        print(f"  Use Case: {functional.get('use_case', 'Unknown')}")
        
        emotional = intent_analysis.get('emotional_context', {})
        print(f"  Sentiment: {emotional.get('sentiment', 'neutral')}")
        print(f"  Motivation: {emotional.get('motivation', 'Unknown')}")
        
        keywords = intent_analysis.get('semantic_keywords', {})
        print(f"  Explicit Keywords: {keywords.get('explicit', [])}")
        print(f"  Implied Keywords: {keywords.get('implied', [])}")
        print(f"  Synonyms: {keywords.get('synonyms', [])}")
        
        print(f"  Complexity: {intent_analysis.get('search_complexity', 'unknown')}")
        print(f"  Confidence: {intent_analysis.get('confidence_score', 0):.2f}")
        
        print()
        
    except Exception as e:
        print(f"ERROR: {e}")
        print()

def test_search_strategies():
    """Test different search strategy generation."""
    
    print("=== TESTING SEARCH STRATEGY GENERATION ===\n")
    
    # Mock intent analysis for testing
    mock_intent = {
        'primary_intent': 'organize home office storage',
        'semantic_keywords': {
            'explicit': ['storage', 'office'],
            'implied': ['organization', 'workspace'],
            'synonyms': ['desk organizer', 'filing system']
        },
        'problem_solving': {
            'problems_mentioned': ['cluttered office', 'lack of storage']
        },
        'context_clues': {
            'room_hints': ['office'],
            'style_hints': ['professional'],
            'size_constraints': ['small corner']
        },
        'functional_requirements': {
            'must_have_features': ['compact', 'professional appearance']
        }
    }
    
    print("Mock Intent Analysis:")
    print(f"  Primary: {mock_intent['primary_intent']}")
    print(f"  Keywords: {mock_intent['semantic_keywords']}")
    print()
    
    try:
        strategies = semantic_search_engine._generate_search_strategies(mock_intent)
        
        print(f"Generated {len(strategies)} search strategies:")
        for i, strategy in enumerate(strategies, 1):
            print(f"  {i}. {strategy['name']} ({strategy['type']}) - Weight: {strategy['weight']}")
            
            if strategy['type'] == 'keyword_search':
                print(f"     Keywords: {strategy.get('keywords', [])}")
            elif strategy['type'] == 'problem_search':
                print(f"     Problems: {strategy.get('problems', [])}")
            elif strategy['type'] == 'context_search':
                print(f"     Context: {strategy.get('context', {})}")
            elif strategy['type'] == 'feature_search':
                print(f"     Features: {strategy.get('features', [])}")
        
        print()
        
    except Exception as e:
        print(f"ERROR: {e}")
        print()

def main():
    """Run all semantic search tests."""
    print("🧠 TESTING SEMANTIC SEARCH & AI UNDERSTANDING")
    print("=" * 60)
    print()
    
    test_semantic_understanding()
    test_intent_analysis()
    test_search_strategies()
    
    print("=" * 60)
    print("✅ Semantic search tests completed!")

if __name__ == "__main__":
    main()