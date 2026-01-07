#!/usr/bin/env python3
"""Test the advanced search API functionality."""

from api.search import search_engine, SearchFilters

def test_basic_search():
    """Test basic text search."""
    
    print("=== TESTING BASIC SEARCH ===\n")
    
    # Test simple query
    filters = SearchFilters(query="desk", limit=5)
    result = search_engine.search_products(filters)
    
    print(f"Search for 'desk':")
    print(f"Total products: {result.total_count}")
    print(f"Filtered results: {result.filtered_count}")
    print(f"Current page: {result.current_page}/{result.page_count}")
    
    if result.products:
        print("Sample products:")
        for i, product in enumerate(result.products[:3], 1):
            print(f"  {i}. {product['product_name']} - ${product['price']} ({product['rating']}★)")
    
    print(f"Filters applied: {result.filters_applied}")
    print(f"Suggestions: {result.search_suggestions}")
    print()

def test_category_filter():
    """Test category-based filtering."""
    
    print("=== TESTING CATEGORY FILTERING ===\n")
    
    # Test Home Office category
    filters = SearchFilters(
        categories=["Home Office"],
        sort_by="rating",
        limit=5
    )
    result = search_engine.search_products(filters)
    
    print(f"Home Office products (sorted by rating):")
    print(f"Found: {result.filtered_count} products")
    
    if result.products:
        for i, product in enumerate(result.products[:3], 1):
            print(f"  {i}. {product['product_name']} - {product['brand']} ({product['rating']}★)")
    
    print()

def test_price_and_brand_filters():
    """Test price range and brand filtering."""
    
    print("=== TESTING PRICE & BRAND FILTERING ===\n")
    
    # Test price range filter
    filters = SearchFilters(
        min_price=50.0,
        max_price=150.0,
        brands=["SONGMICS", "VASAGLE"],
        sort_by="price_asc",
        limit=5
    )
    result = search_engine.search_products(filters)
    
    print(f"Products $50-150 from SONGMICS/VASAGLE:")
    print(f"Found: {result.filtered_count} products")
    
    if result.products:
        for i, product in enumerate(result.products[:3], 1):
            print(f"  {i}. {product['product_name']} - {product['brand']} (${product['price']})")
    
    print()

def test_room_type_filter():
    """Test room type filtering."""
    
    print("=== TESTING ROOM TYPE FILTERING ===\n")
    
    # Test bedroom filtering
    filters = SearchFilters(
        room_types=["bedroom"],
        sort_by="trending",
        limit=5
    )
    result = search_engine.search_products(filters)
    
    print(f"Bedroom furniture (trending):")
    print(f"Found: {result.filtered_count} products")
    
    if result.products:
        for i, product in enumerate(result.products[:3], 1):
            trend_score = product['trend_score']
            print(f"  {i}. {product['product_name']} (Trend: {trend_score})")
    
    print()

def test_complex_filtering():
    """Test complex multi-filter combinations."""
    
    print("=== TESTING COMPLEX FILTERING ===\n")
    
    # Complex filter: office furniture under $200 with good ratings
    filters = SearchFilters(
        query="chair",
        room_types=["office"],
        max_price=200.0,
        min_rating=4.0,
        sort_by="rating",
        limit=3
    )
    result = search_engine.search_products(filters)
    
    print(f"Office chairs under $200 with 4+ star rating:")
    print(f"Found: {result.filtered_count} products")
    
    if result.products:
        for i, product in enumerate(result.products, 1):
            rating = product['rating']
            price = product['price']
            print(f"  {i}. {product['product_name']} - ${price} ({rating}★)")
    
    print(f"Applied filters: {result.filters_applied}")
    print()

def test_filter_options():
    """Test getting available filter options."""
    
    print("=== TESTING FILTER OPTIONS ===\n")
    
    options = search_engine.get_filter_options()
    
    print("Available filter options:")
    print(f"- Brands: {len(options['brands'])} available")
    if options['brands']:
        print(f"  Top brands: {', '.join([b['name'] for b in options['brands'][:5]])}")
    
    print(f"- Categories: {len(options['categories'])} available")
    if options['categories']:
        print(f"  Categories: {', '.join([c['name'] for c in options['categories']])}")
    
    print(f"- Price range: ${options['price_range']['min']:.0f} - ${options['price_range']['max']:.0f}")
    print(f"- Average price: ${options['price_range']['avg']:.0f}")
    
    print(f"- Styles: {len(options['styles'])} available")
    if options['styles']:
        print(f"  Styles: {', '.join([s['name'] for s in options['styles'][:5]])}")
    
    print(f"- Room types: {', '.join(options['room_types'])}")
    print(f"- Sort options: {', '.join(options['sort_options'])}")
    print()

def main():
    """Run all search tests."""
    print("🔍 TESTING ADVANCED SEARCH & FILTERING SYSTEM")
    print("=" * 60)
    print()
    
    test_basic_search()
    test_category_filter()
    test_price_and_brand_filters()
    test_room_type_filter()
    test_complex_filtering()
    test_filter_options()
    
    print("=" * 60)
    print("✅ All search tests completed!")

if __name__ == "__main__":
    main()