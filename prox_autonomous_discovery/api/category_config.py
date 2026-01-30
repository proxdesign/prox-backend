"""Category configuration with precise search terms and exclusions.

This module defines CategoryConfig objects for each product category,
providing fine-grained control over product matching through:
- primary_terms: At least one MUST match (required for inclusion)
- secondary_terms: Boost relevance score if matched
- exclusion_terms: Filter out products containing these terms
"""

from dataclasses import dataclass
from typing import List


@dataclass
class CategoryConfig:
    """Configuration for a product category with search terms and exclusions."""
    slug: str
    display_name: str
    primary_terms: List[str]      # At least one MUST match
    secondary_terms: List[str]    # Boost score if matched
    exclusion_terms: List[str]    # Filter out products containing these


# =============================================================================
# Kitchen & Pantry Categories
# =============================================================================

LAZY_SUSAN = CategoryConfig(
    slug="lazy-susan",
    display_name="Lazy Susans",
    primary_terms=["lazy susan", "turntable organizer", "rotating tray", "spinning organizer"],
    secondary_terms=["cabinet", "pantry", "spice", "kitchen", "bamboo"],
    exclusion_terms=["tv stand", "monitor", "cake", "record player", "turntable speaker"]
)

SPICE_RACK = CategoryConfig(
    slug="spice-rack",
    display_name="Spice Racks",
    primary_terms=["spice rack", "spice organizer", "spice shelf", "seasoning rack", "spice drawer"],
    secondary_terms=["tiered", "expandable", "drawer", "cabinet", "wall mount"],
    exclusion_terms=["shoe", "book", "wine", "magazine", "coat"]
)

DRAWER_ORGANIZER_KITCHEN = CategoryConfig(
    slug="drawer-organizer-kitchen",
    display_name="Drawer Organizers",
    primary_terms=["drawer organizer", "utensil tray", "silverware organizer", "cutlery tray", "kitchen drawer"],
    secondary_terms=["bamboo", "expandable", "adjustable", "divider"],
    exclusion_terms=["desk", "office", "makeup", "jewelry", "dresser", "bedroom"]
)

SHELF_RISER = CategoryConfig(
    slug="shelf-riser",
    display_name="Shelf Risers",
    primary_terms=["shelf riser", "cabinet shelf", "shelf organizer", "stackable shelf", "kitchen shelf"],
    secondary_terms=["kitchen", "pantry", "cabinet", "expandable", "wire"],
    exclusion_terms=["monitor", "desk", "laptop", "shoe", "computer", "tv"]
)

UNDER_SINK_KITCHEN = CategoryConfig(
    slug="under-sink-kitchen",
    display_name="Under-Sink Storage",
    primary_terms=["under sink", "under-sink", "undersink", "sink cabinet"],
    secondary_terms=["pull out", "sliding", "expandable", "cabinet", "organizer", "shelf"],
    exclusion_terms=["spice", "over sink", "sponge holder", "soap dispenser", "faucet",
                     "dish rack", "drying rack", "above sink"]
)

CONTAINER = CategoryConfig(
    slug="container",
    display_name="Can Organizers",
    primary_terms=["can organizer", "can rack", "can dispenser", "canned food", "can storage",
                   "pantry organizer bin", "food storage bin"],
    secondary_terms=["pantry", "stackable", "storage", "soda", "beverage", "refrigerator"],
    exclusion_terms=["trash", "garbage", "recycling", "compost", "outdoor"]
)

# =============================================================================
# Closet & Storage Categories
# =============================================================================

HANGER = CategoryConfig(
    slug="hanger",
    display_name="Hangers",
    primary_terms=["hanger", "hangers", "clothes hanger", "coat hanger", "pant hanger"],
    secondary_terms=["velvet", "slim", "non-slip", "wooden", "space saving"],
    exclusion_terms=["plant", "pot", "macrame", "shower", "towel bar", "curtain"]
)

HANGING_SHELVES = CategoryConfig(
    slug="hanging-shelves",
    display_name="Hanging Shelves",
    primary_terms=["hanging shelf", "hanging organizer", "hanging closet", "sweater organizer", "closet hanging"],
    secondary_terms=["fabric", "closet rod", "foldable", "canvas"],
    exclusion_terms=["plant", "macrame", "wall shelf", "floating shelf", "bathroom"]
)

STORAGE_BIN = CategoryConfig(
    slug="storage-bin",
    display_name="Storage Bins",
    primary_terms=["storage bin", "storage box", "fabric bin", "storage basket", "cube bin"],
    secondary_terms=["stackable", "foldable", "cube", "closet", "shelf"],
    exclusion_terms=["trash", "garbage", "compost", "outdoor", "recycling", "litter"]
)

DRAWER_DIVIDER = CategoryConfig(
    slug="drawer-divider",
    display_name="Drawer Dividers",
    primary_terms=["drawer divider", "drawer separator", "closet drawer", "dresser drawer"],
    secondary_terms=["adjustable", "expandable", "bamboo", "spring"],
    exclusion_terms=["desk", "office", "kitchen", "utensil", "silverware"]
)

OVER_DOOR = CategoryConfig(
    slug="over-door",
    display_name="Over-Door Organizers",
    primary_terms=["over door", "over-door", "door organizer", "back of door", "door hanging"],
    secondary_terms=["hanging", "hooks", "storage", "pantry", "closet"],
    exclusion_terms=["shoe rack", "mirror", "wreath", "towel bar", "door stop"]
)

SHELF_DIVIDER = CategoryConfig(
    slug="shelf-divider",
    display_name="Shelf Dividers",
    primary_terms=["shelf divider", "shelf separator", "closet divider", "vertical divider"],
    secondary_terms=["acrylic", "clear", "vertical", "wood"],
    exclusion_terms=["drawer", "room divider", "bookend", "desk"]
)

# =============================================================================
# Bathroom Categories
# =============================================================================

UNDER_SINK_BATHROOM = CategoryConfig(
    slug="under-sink-bathroom",
    display_name="Under-Sink Organizers",
    primary_terms=["under sink", "under-sink", "undersink", "bathroom cabinet", "vanity organizer"],
    secondary_terms=["bathroom", "vanity", "cabinet", "pull out", "expandable"],
    exclusion_terms=["spice", "kitchen", "over sink", "faucet", "soap dispenser",
                     "dish", "above sink"]
)

SHOWER_CADDY = CategoryConfig(
    slug="shower-caddy",
    display_name="Shower Caddies",
    primary_terms=["shower caddy", "shower organizer", "shower shelf", "bath caddy", "shower storage",
                   "bathroom caddy", "shower basket"],
    secondary_terms=["tension", "corner", "hanging", "suction", "pole", "adhesive"],
    exclusion_terms=["curtain rod", "shower mat", "shower door", "liner"]
)

TOOTHBRUSH_HOLDER = CategoryConfig(
    slug="toothbrush-holder",
    display_name="Toothbrush Holders",
    primary_terms=["toothbrush holder", "toothbrush stand", "dental organizer", "toothbrush organizer"],
    secondary_terms=["bathroom", "countertop", "wall mount", "electric"],
    exclusion_terms=["replacement head", "brush head", "oral-b", "philips sonicare"]
)

HAIR_TOOL = CategoryConfig(
    slug="hair-tool",
    display_name="Hair Tool Organizers",
    primary_terms=["hair tool organizer", "hair dryer holder", "curling iron holder", "flat iron holder",
                   "styling tool organizer", "blow dryer holder", "hair tool"],
    secondary_terms=["organizer", "caddy", "wall mount", "cabinet door", "holder"],
    exclusion_terms=["dyson airwrap", "chi flat iron", "conair dryer", "revlon dryer"]
)

# =============================================================================
# Desk & Office Categories
# =============================================================================

DESK_ORGANIZER = CategoryConfig(
    slug="desk-organizer",
    display_name="Desk Organizers",
    primary_terms=["desk organizer", "desktop organizer", "office organizer", "pen holder", "desk caddy"],
    secondary_terms=["wooden", "mesh", "file", "supplies", "pencil"],
    exclusion_terms=["kitchen", "bathroom", "garage", "drawer", "closet"]
)

CABLE_MANAGEMENT = CategoryConfig(
    slug="cable-management",
    display_name="Cable Management",
    primary_terms=["cable management", "cable organizer", "cord organizer", "cable box", "wire organizer",
                   "cable sleeve", "cord management"],
    secondary_terms=["desk", "wire", "sleeve", "clip", "tray"],
    exclusion_terms=["extension cord", "power strip", "charger", "ethernet", "hdmi"]
)

MONITOR_RISER = CategoryConfig(
    slug="monitor-riser",
    display_name="Monitor Risers",
    primary_terms=["monitor stand", "monitor riser", "laptop stand", "desk riser", "computer stand"],
    secondary_terms=["wooden", "adjustable", "ergonomic", "storage", "drawer"],
    exclusion_terms=["tv mount", "wall mount", "arm", "bracket", "vesa"]
)

DRAWER_ORGANIZER_OFFICE = CategoryConfig(
    slug="drawer-organizer-office",
    display_name="Drawer Organizers",
    primary_terms=["desk drawer organizer", "office drawer", "drawer tray", "desk tray"],
    secondary_terms=["pen", "supplies", "mesh", "compartment"],
    exclusion_terms=["kitchen", "bathroom", "utensil", "silverware", "closet"]
)

# =============================================================================
# Entryway & Hooks Categories
# =============================================================================

KEY_HOOK = CategoryConfig(
    slug="key-hook",
    display_name="Key Hooks",
    primary_terms=["key holder", "key hook", "key rack", "mail organizer", "key organizer",
                   "entryway organizer"],
    secondary_terms=["entryway", "wall mount", "decorative", "mail"],
    exclusion_terms=["car key", "key chain", "key ring", "lockbox", "safe", "key finder"]
)

WALL_HOOK = CategoryConfig(
    slug="wall-hook",
    display_name="Wall Hooks",
    primary_terms=["wall hook", "adhesive hook", "coat hook", "towel hook", "robe hook"],
    secondary_terms=["heavy duty", "decorative", "removable", "stainless"],
    exclusion_terms=["curtain", "picture", "shelf", "mirror", "plant"]
)

SHOE_RACK = CategoryConfig(
    slug="shoe-rack",
    display_name="Shoe Racks",
    primary_terms=["shoe rack", "shoe organizer", "shoe storage", "shoe shelf", "shoe cabinet"],
    secondary_terms=["entryway", "closet", "stackable", "tier"],
    exclusion_terms=["shoe box", "shoe bag", "shoe cleaner", "insole", "shoe tree", "cedar"]
)

COAT_RACK = CategoryConfig(
    slug="coat-rack",
    display_name="Coat Racks",
    primary_terms=["coat rack", "coat stand", "coat tree", "hall tree", "freestanding coat"],
    secondary_terms=["entryway", "freestanding", "hooks", "wood"],
    exclusion_terms=["closet organizer", "wall hook only", "door hook"]
)

# =============================================================================
# Hanging & Mounting Categories
# =============================================================================

PICTURE_HANGER = CategoryConfig(
    slug="picture-hanger",
    display_name="Picture Hanging Accessories",
    primary_terms=["picture hanging", "picture hanger", "frame hanger", "art hanging",
                   "picture hanging kit", "frame hanging", "picture hook"],
    secondary_terms=["hardware", "kit", "wire", "hook", "nail"],
    exclusion_terms=["picture frame", "photo frame", "wall art", "canvas", "poster", "print",
                     "coat rack", "coat stand", "desk", "monitor", "shelf", "display frame",
                     "gallery frame", "collage frame"]
)

COMMAND_STRIP = CategoryConfig(
    slug="command-strip",
    display_name="Command Strips",
    primary_terms=["command strip", "adhesive strip", "removable strip", "damage free",
                   "command hook", "adhesive mounting"],
    secondary_terms=["hook", "hanger", "mounting", "wall"],
    exclusion_terms=["led strip", "light strip", "power strip", "weather strip", "strip light"]
)

WALL_HOOK_MOUNTING = CategoryConfig(
    slug="wall-hook-mounting",
    display_name="Wall Hooks",
    primary_terms=["wall hook", "mounting hook", "heavy duty hook", "utility hook", "garage hook"],
    secondary_terms=["garage", "tool", "bike", "ladder", "heavy"],
    exclusion_terms=["curtain", "picture", "decorative", "bathroom"]
)

PICTURE_FRAME = CategoryConfig(
    slug="picture-frame",
    display_name="Picture Frames",
    primary_terms=["picture frame", "photo frame", "wall frame", "gallery frame", "display frame"],
    secondary_terms=["display", "collage", "set", "wood", "black", "white"],
    exclusion_terms=["hanger", "hanging hardware", "wire", "hook", "nail", "kit"]
)


# =============================================================================
# Master Registry
# =============================================================================

CATEGORY_CONFIGS = {
    # Kitchen & Pantry
    LAZY_SUSAN.slug: LAZY_SUSAN,
    SPICE_RACK.slug: SPICE_RACK,
    DRAWER_ORGANIZER_KITCHEN.slug: DRAWER_ORGANIZER_KITCHEN,
    SHELF_RISER.slug: SHELF_RISER,
    UNDER_SINK_KITCHEN.slug: UNDER_SINK_KITCHEN,
    CONTAINER.slug: CONTAINER,

    # Closet & Storage
    HANGER.slug: HANGER,
    HANGING_SHELVES.slug: HANGING_SHELVES,
    STORAGE_BIN.slug: STORAGE_BIN,
    DRAWER_DIVIDER.slug: DRAWER_DIVIDER,
    OVER_DOOR.slug: OVER_DOOR,
    SHELF_DIVIDER.slug: SHELF_DIVIDER,

    # Bathroom
    UNDER_SINK_BATHROOM.slug: UNDER_SINK_BATHROOM,
    SHOWER_CADDY.slug: SHOWER_CADDY,
    TOOTHBRUSH_HOLDER.slug: TOOTHBRUSH_HOLDER,
    HAIR_TOOL.slug: HAIR_TOOL,

    # Desk & Office
    DESK_ORGANIZER.slug: DESK_ORGANIZER,
    CABLE_MANAGEMENT.slug: CABLE_MANAGEMENT,
    MONITOR_RISER.slug: MONITOR_RISER,
    DRAWER_ORGANIZER_OFFICE.slug: DRAWER_ORGANIZER_OFFICE,

    # Entryway & Hooks
    KEY_HOOK.slug: KEY_HOOK,
    WALL_HOOK.slug: WALL_HOOK,
    SHOE_RACK.slug: SHOE_RACK,
    COAT_RACK.slug: COAT_RACK,

    # Hanging & Mounting
    PICTURE_HANGER.slug: PICTURE_HANGER,
    COMMAND_STRIP.slug: COMMAND_STRIP,
    WALL_HOOK_MOUNTING.slug: WALL_HOOK_MOUNTING,
    PICTURE_FRAME.slug: PICTURE_FRAME,
}


def get_category_config(slug: str) -> CategoryConfig:
    """Get CategoryConfig for a slug, or None if not found."""
    return CATEGORY_CONFIGS.get(slug)


def list_all_categories() -> List[CategoryConfig]:
    """Return all category configurations."""
    return list(CATEGORY_CONFIGS.values())
