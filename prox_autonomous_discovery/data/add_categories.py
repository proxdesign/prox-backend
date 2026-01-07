#!/usr/bin/env python3
"""Add comprehensive product categorization system."""

import logging
from database.connection import db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Category hierarchy and product mappings
CATEGORY_SYSTEM = {
    'Storage & Organization': {
        'subcategories': [
            'Closet Organization',
            'Under Bed Storage', 
            'Cube Storage',
            'Shelving Units',
            'Storage Bins & Containers',
            'Over Door Storage'
        ],
        'keywords': ['storage', 'organizer', 'bin', 'container', 'closet', 'under bed', 'cube', 'shelf']
    },
    'Home Office': {
        'subcategories': [
            'Desks & Workstations',
            'Office Chairs',
            'Desk Organization',
            'Standing Desks',
            'Monitor Stands',
            'Filing & Storage'
        ],
        'keywords': ['desk', 'chair', 'office', 'computer', 'workspace', 'ergonomic', 'standing', 'monitor']
    },
    'Bedroom Furniture': {
        'subcategories': [
            'Nightstands',
            'Dressers & Chests',
            'Bedroom Storage',
            'Bed Frames',
            'Vanities',
            'Shoe Storage'
        ],
        'keywords': ['nightstand', 'dresser', 'bedside', 'bedroom', 'vanity', 'shoe', 'bed frame']
    },
    'Living Room': {
        'subcategories': [
            'Coffee Tables',
            'TV Stands & Entertainment',
            'Bookcases & Display',
            'Side Tables',
            'Storage Ottomans',
            'Media Storage'
        ],
        'keywords': ['coffee table', 'tv stand', 'bookcase', 'entertainment', 'ottoman', 'side table', 'media']
    },
    'Kitchen & Dining': {
        'subcategories': [
            'Kitchen Storage Carts',
            'Dining Tables',
            'Bar Tables & Stools',
            'Kitchen Organization',
            'Microwave Stands',
            'Spice Racks'
        ],
        'keywords': ['kitchen', 'dining', 'cart', 'microwave', 'spice', 'bar table', 'stool']
    },
    'Bathroom': {
        'subcategories': [
            'Over Toilet Storage',
            'Bathroom Cabinets',
            'Towel Storage',
            'Medicine Cabinets',
            'Vanity Storage',
            'Shower Organizers'
        ],
        'keywords': ['bathroom', 'toilet', 'towel', 'medicine', 'vanity', 'shower']
    },
    'Outdoor & Patio': {
        'subcategories': [
            'Patio Storage',
            'Garden Furniture',
            'Outdoor Benches',
            'Deck Storage',
            'Pool Storage',
            'Garage Organization'
        ],
        'keywords': ['patio', 'outdoor', 'garden', 'deck', 'pool', 'garage', 'weather resistant']
    }
}

# Style classifications
STYLE_CATEGORIES = {
    'Modern': ['modern', 'contemporary', 'sleek', 'minimalist'],
    'Traditional': ['traditional', 'classic', 'vintage', 'antique'],
    'Rustic': ['rustic', 'farmhouse', 'country', 'barn'],
    'Industrial': ['industrial', 'metal', 'steel', 'iron'],
    'Mid-Century': ['mid-century', 'retro', '50s', '60s'],
    'Scandinavian': ['scandinavian', 'nordic', 'simple', 'clean'],
    'Bohemian': ['bohemian', 'boho', 'eclectic', 'artsy'],
    'Transitional': ['transitional', 'blend', 'mix', 'versatile']
}

# Material classifications
MATERIAL_CATEGORIES = {
    'Wood': ['wood', 'oak', 'pine', 'walnut', 'cherry', 'mahogany', 'bamboo'],
    'Metal': ['metal', 'steel', 'iron', 'aluminum', 'chrome'],
    'Fabric': ['fabric', 'upholstered', 'cushioned', 'padded'],
    'Glass': ['glass', 'tempered', 'crystal'],
    'Plastic': ['plastic', 'resin', 'acrylic'],
    'Composite': ['mdf', 'particle board', 'engineered', 'laminate']
}

def create_category_tables():
    """Create category-related tables."""
    
    # Main categories table
    categories_sql = """
        CREATE TABLE IF NOT EXISTS categories (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL UNIQUE,
            parent_id INT REFERENCES categories(id),
            description TEXT,
            display_order INT DEFAULT 0,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW()
        );
    """
    
    # Product categories junction table
    product_categories_sql = """
        CREATE TABLE IF NOT EXISTS product_categories (
            id SERIAL PRIMARY KEY,
            product_id INT REFERENCES products(id) ON DELETE CASCADE,
            category_id INT REFERENCES categories(id),
            is_primary BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(product_id, category_id)
        );
    """
    
    # Product attributes table for style, material, etc.
    product_attributes_sql = """
        CREATE TABLE IF NOT EXISTS product_attributes (
            id SERIAL PRIMARY KEY,
            product_id INT REFERENCES products(id) ON DELETE CASCADE,
            attribute_type VARCHAR(50) NOT NULL,
            attribute_value VARCHAR(100) NOT NULL,
            confidence_score DECIMAL(3,2) DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(product_id, attribute_type, attribute_value)
        );
    """
    
    # Create indexes
    indexes_sql = """
        CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
        CREATE INDEX IF NOT EXISTS idx_product_categories_product ON product_categories(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_categories_category ON product_categories(category_id);
        CREATE INDEX IF NOT EXISTS idx_product_attributes_product ON product_attributes(product_id);
        CREATE INDEX IF NOT EXISTS idx_product_attributes_type ON product_attributes(attribute_type);
    """
    
    try:
        db.execute(categories_sql)
        db.execute(product_categories_sql)
        db.execute(product_attributes_sql)
        db.execute(indexes_sql)
        logger.info("Category tables created successfully")
        return True
    except Exception as e:
        logger.error(f"Failed to create category tables: {e}")
        return False

def populate_categories():
    """Populate the categories table with our hierarchy."""
    
    # Insert main categories first
    for category_name, category_data in CATEGORY_SYSTEM.items():
        try:
            query = """
                INSERT INTO categories (name, description, display_order) 
                VALUES (%s, %s, %s) 
                ON CONFLICT (name) DO NOTHING
            """
            description = f"Furniture and products for {category_name.lower()}"
            display_order = len(CATEGORY_SYSTEM) - list(CATEGORY_SYSTEM.keys()).index(category_name)
            
            db.execute(query, [category_name, description, display_order])
            logger.info(f"Added main category: {category_name}")
            
        except Exception as e:
            logger.error(f"Failed to add category {category_name}: {e}")
    
    # Insert subcategories
    for main_category, category_data in CATEGORY_SYSTEM.items():
        # Get main category ID
        main_cat_id = db.fetch_one(
            "SELECT id FROM categories WHERE name = %s", 
            [main_category]
        )[0]
        
        for i, subcategory in enumerate(category_data['subcategories']):
            try:
                query = """
                    INSERT INTO categories (name, parent_id, description, display_order) 
                    VALUES (%s, %s, %s, %s) 
                    ON CONFLICT (name) DO NOTHING
                """
                description = f"{subcategory} products and solutions"
                
                db.execute(query, [subcategory, main_cat_id, description, i + 1])
                logger.info(f"Added subcategory: {subcategory}")
                
            except Exception as e:
                logger.error(f"Failed to add subcategory {subcategory}: {e}")

def categorize_products():
    """Automatically categorize products based on keywords."""
    
    # Get all products
    products = db.fetch_all("""
        SELECT id, product_name, brand 
        FROM products 
        WHERE active = TRUE
    """)
    
    logger.info(f"Categorizing {len(products)} products...")
    
    categorized_count = 0
    
    for product in products:
        product_id, product_name, brand = product
        product_text = f"{product_name} {brand}".lower()
        
        # Find matching categories
        matched_categories = []
        
        for main_category, category_data in CATEGORY_SYSTEM.items():
            # Check main category keywords
            if any(keyword in product_text for keyword in category_data['keywords']):
                matched_categories.append(main_category)
                
                # Check subcategory keywords for more specific match
                for subcategory in category_data['subcategories']:
                    subcat_keywords = subcategory.lower().split()
                    if any(keyword in product_text for keyword in subcat_keywords):
                        matched_categories.append(subcategory)
                        break
        
        # Insert category assignments
        for category_name in matched_categories:
            try:
                # Get category ID
                cat_id = db.fetch_one(
                    "SELECT id FROM categories WHERE name = %s", 
                    [category_name]
                )[0]
                
                # Insert product-category relationship
                query = """
                    INSERT INTO product_categories (product_id, category_id, is_primary) 
                    VALUES (%s, %s, %s) 
                    ON CONFLICT (product_id, category_id) DO NOTHING
                """
                is_primary = len(matched_categories) == 1 or matched_categories.index(category_name) == 0
                
                db.execute(query, [product_id, cat_id, is_primary])
                
            except Exception as e:
                logger.error(f"Failed to categorize product {product_id}: {e}")
        
        if matched_categories:
            categorized_count += 1
    
    logger.info(f"Successfully categorized {categorized_count} products")
    return categorized_count

def add_style_and_material_attributes():
    """Add style and material attributes to products."""
    
    products = db.fetch_all("""
        SELECT id, product_name, brand 
        FROM products 
        WHERE active = TRUE
    """)
    
    for product in products:
        product_id, product_name, brand = product
        product_text = f"{product_name} {brand}".lower()
        
        # Detect style
        for style, keywords in STYLE_CATEGORIES.items():
            if any(keyword in product_text for keyword in keywords):
                try:
                    query = """
                        INSERT INTO product_attributes (product_id, attribute_type, attribute_value) 
                        VALUES (%s, %s, %s) 
                        ON CONFLICT (product_id, attribute_type, attribute_value) DO NOTHING
                    """
                    db.execute(query, [product_id, 'style', style])
                except Exception as e:
                    logger.error(f"Failed to add style attribute: {e}")
                break
        
        # Detect material
        for material, keywords in MATERIAL_CATEGORIES.items():
            if any(keyword in product_text for keyword in keywords):
                try:
                    query = """
                        INSERT INTO product_attributes (product_id, attribute_type, attribute_value) 
                        VALUES (%s, %s, %s) 
                        ON CONFLICT (product_id, attribute_type, attribute_value) DO NOTHING
                    """
                    db.execute(query, [product_id, 'material', material])
                except Exception as e:
                    logger.error(f"Failed to add material attribute: {e}")
                break

def update_api_categories_endpoint():
    """Update the API to include category filtering."""
    
    # Show category distribution
    category_stats = db.fetch_all("""
        SELECT c.name, COUNT(pc.product_id) as product_count
        FROM categories c
        LEFT JOIN product_categories pc ON c.id = pc.category_id
        WHERE c.parent_id IS NULL
        GROUP BY c.id, c.name
        ORDER BY product_count DESC
    """)
    
    logger.info("Category distribution:")
    for cat_name, count in category_stats:
        logger.info(f"  {cat_name}: {count} products")
    
    # Show subcategory distribution
    subcat_stats = db.fetch_all("""
        SELECT c.name, COUNT(pc.product_id) as product_count
        FROM categories c
        LEFT JOIN product_categories pc ON c.id = pc.category_id
        WHERE c.parent_id IS NOT NULL
        GROUP BY c.id, c.name
        HAVING COUNT(pc.product_id) > 0
        ORDER BY product_count DESC
        LIMIT 10
    """)
    
    logger.info("Top subcategories:")
    for cat_name, count in subcat_stats:
        logger.info(f"  {cat_name}: {count} products")

def main():
    """Set up comprehensive product categorization."""
    logger.info("=== SETTING UP CATEGORIZATION SYSTEM ===")
    
    # Create tables
    if not create_category_tables():
        return False
    
    # Populate categories
    populate_categories()
    
    # Categorize products
    categorized_count = categorize_products()
    
    # Add attributes
    add_style_and_material_attributes()
    
    # Show results
    update_api_categories_endpoint()
    
    total_products = db.fetch_one("SELECT COUNT(*) FROM products WHERE active = TRUE")[0]
    
    logger.info("=== CATEGORIZATION COMPLETE ===")
    logger.info(f"Total products: {total_products}")
    logger.info(f"Categorized products: {categorized_count}")
    logger.info(f"Coverage: {(categorized_count/total_products*100):.1f}%")
    
    return True

if __name__ == "__main__":
    success = main()
    print(f"{'✓' if success else '✗'} Categorization system {'complete' if success else 'failed'}")