export interface FilterOption {
  id: string;
  label: string;
  type: 'single' | 'multi';  // single select or multi-select
  values: Array<{
    id: string;
    label: string;
    keywords?: string[];  // for product search
  }>;
}

export interface Solution {
  id: string;
  name: string;
  keywords: string[];
  image?: string;
}

export interface Problem {
  id: string;
  name: string;
  category: string;
  description: string;
  keywords: string[];
  // NEW: Dynamic filter configuration
  filters?: FilterOption[];
  // NEW: Custom step labels for this problem type
  stepLabels?: {
    step2: string;  // Default: "Solution Type"
    step3: string;  // Default: "Refine" - could be Style, Budget, Size, etc.
  };
  // NEW: Skip refine step for products that don't need style/refinement
  skipRefineStep?: boolean;
  solutions: Solution[];
}

export interface TrendReason {
  platform: string;
  count: number;
  text: string;
}

export interface TrendData {
  trendScore: number;
  trendReasons: TrendReason[];
  socialProofSummary: string;
  trendLevel: 'hot' | 'warm' | 'stable' | 'cold';
  platforms: {
    tiktok: number;
    instagram: number;
    reddit: number;
    youtube: number;
  };
}

export const problems: Problem[] = [
  // ==================== HOME ORGANIZATION ====================
  {
    id: "rental-restrictions",
    name: "Rental Restrictions – Can't Drill or Make Permanent Changes",
    category: "Home Organization",
    description: "Renters frustrated they can't drill holes, mount shelves, or install permanent storage solutions without risking their security deposit.",
    keywords: ["can't drill", "renter-friendly", "no holes", "damage-free", "deposit", "landlord", "command strips", "apartment"],
    solutions: [
      { id: "adhesive-wall-hooks", name: "Adhesive Wall Hooks", keywords: ["command hooks heavy duty", "adhesive hooks no damage", "peel and stick wall hooks"], image: "/images/solutions/adhesive-wall-hooks.jpg" },
      { id: "tension-rod-storage", name: "Tension Rod Storage Systems", keywords: ["tension rod shelves", "adjustable tension rod organizer", "no drill closet rod"], image: "/images/solutions/tension-rod-storage.jpg" },
      { id: "freestanding-shelves", name: "Freestanding Shelving Units", keywords: ["freestanding bookshelf no drill", "standing shelf unit", "leaning ladder shelf"], image: "/images/solutions/freestanding-shelves.jpg" },
      { id: "over-door-organizers", name: "Over-Door Organizers", keywords: ["over the door hooks", "behind door storage rack", "over door shoe organizer"], image: "/images/solutions/over-door-organizers.jpg" }
    ]
  },
  {
    id: "kids-toys-everywhere",
    name: "Kids' Toys Taking Over the House",
    category: "Home Organization",
    description: "Parents overwhelmed by toys scattered everywhere, multiplying constantly, with no clear system for storage or cleanup.",
    keywords: ["toys everywhere", "legos", "stepping on toys", "toys multiplying", "can't get kids to clean up", "too many toys", "playroom mess"],
    solutions: [
      { id: "toy-storage-bins", name: "Toy Storage Bins with Labels", keywords: ["stackable toy bins with labels", "toy chest organizer kids", "toy storage cubes"], image: "/images/solutions/toy-storage-bins.jpg" },
      { id: "toy-rotation-storage", name: "Toy Rotation System Storage", keywords: ["toy rotation bins", "hidden toy storage tubs", "under bed toy organizer"], image: "/images/solutions/toy-rotation-storage.jpg" },
      { id: "wall-mounted-toy-storage", name: "Wall-Mounted Toy Storage", keywords: ["wall toy storage bin", "hanging mesh toy organizer", "toy hammock corner"], image: "/images/solutions/wall-mounted-toy-storage.jpg" },
      { id: "multi-compartment-organizer", name: "Multi-Compartment Toy Organizer", keywords: ["kids toy organizer with bins", "cubby toy shelf", "playroom storage cabinet"], image: "/images/solutions/multi-compartment-organizer.jpg" }
    ]
  },
  {
    id: "entryway-chaos",
    name: "Entryway Chaos – Shoes, Coats, Keys, and Mail Piling Up",
    category: "Home Organization",
    description: "Entryways become dumping grounds with shoes scattered, coats piled on chairs, keys getting lost, and mail accumulating.",
    keywords: ["shoes cluttering", "keys always lost", "coats everywhere", "mail piling up", "entryway dump zone", "no coat closet"],
    solutions: [
      { id: "entryway-bench-storage", name: "Entryway Bench with Shoe Storage", keywords: ["entryway bench with shoe rack", "shoe storage bench seat", "hall tree with storage"], image: "/images/solutions/entryway-bench-storage.jpg" },
      { id: "wall-key-mail-organizer", name: "Wall Key/Mail Organizer", keywords: ["wall mount key holder mail organizer", "entryway command center", "mail sorter wall mount"], image: "/images/solutions/wall-key-mail-organizer.jpg" },
      { id: "over-door-shoe-rack", name: "Over-Door Shoe Rack", keywords: ["over the door shoe rack", "vertical shoe organizer door", "door mounted shoe storage"], image: "/images/solutions/over-door-shoe-rack.jpg" },
      { id: "coat-hooks-shelf", name: "Coat Hooks with Shelf", keywords: ["wall coat rack with shelf", "entryway hook shelf combo", "floating shelf with hooks"], image: "/images/solutions/coat-hooks-shelf.jpg" }
    ]
  },
  {
    id: "closet-overflow",
    name: "Closet Overflow – Not Enough Space, Clothes Falling Off",
    category: "Home Organization",
    description: "Closets overflowing with clothes falling off hangers, no room for shoes, and difficulty finding anything.",
    keywords: ["closet too small", "clothes falling off hangers", "can't find anything", "closet overflowing", "no room for shoes", "tangled hangers", "messy closet"],
    solutions: [
      { id: "velvet-hangers", name: "Slim Velvet Hangers", keywords: ["velvet hangers space saving", "thin non slip hangers", "slim flocked hangers"], image: "/images/solutions/velvet-hangers.jpg" },
      { id: "closet-shelf-dividers", name: "Closet Shelf Dividers", keywords: ["closet shelf dividers", "stackable shelf organizers", "sweater storage dividers"], image: "/images/solutions/closet-shelf-dividers.jpg" },
      { id: "double-hang-rod", name: "Double Hang Closet Rod", keywords: ["double closet rod", "closet rod extender", "two tier hanging rod"], image: "/images/solutions/double-hang-rod.jpg" },
      { id: "hanging-closet-shelves", name: "Hanging Closet Organizer Shelves", keywords: ["hanging closet shelves fabric", "collapsible hanging organizer", "sweater hanging storage"], image: "/images/solutions/hanging-closet-shelves.jpg" }
    ]
  },
  {
    id: "seasonal-storage",
    name: "Seasonal Items with Nowhere to Go",
    category: "Home Organization",
    description: "Winter coats, holiday decorations, and seasonal gear have no dedicated storage, creating clutter year-round.",
    keywords: ["store winter stuff", "holiday decorations", "seasonal storage", "no basement", "no attic", "rotating seasonal clothes"],
    solutions: [
      { id: "vacuum-storage-bags", name: "Vacuum Storage Bags", keywords: ["vacuum seal storage bags clothes", "space saver vacuum bags", "compression bags blankets"], image: "/images/solutions/vacuum-storage-bags.jpg" },
      { id: "under-bed-storage", name: "Under-Bed Storage Containers", keywords: ["under bed storage bins with wheels", "underbed storage containers clear", "flat storage boxes under bed"], image: "/images/solutions/under-bed-storage.jpg" },
      { id: "stackable-totes", name: "Stackable Storage Totes", keywords: ["stackable storage bins with lids", "large storage totes heavy duty", "clear storage containers stackable"], image: "/images/solutions/stackable-totes.jpg" }
    ]
  },

  // ==================== KITCHEN ====================
  {
    id: "no-counter-space",
    name: "No Counter Space for Food Prep",
    category: "Kitchen",
    description: "Small apartment kitchens have virtually no counter space, forcing people to prep food on cutting boards balanced over sinks.",
    keywords: ["no counter space", "tiny kitchen", "nowhere to prep food", "appliances take up counter", "galley kitchen", "cramped cooking"],
    skipRefineStep: true,
    solutions: [
      { id: "over-sink-cutting-board", name: "Over-the-Sink Cutting Board", keywords: ["over sink cutting board", "sink cover board", "expandable sink board"], image: "/images/solutions/over-sink-cutting-board.jpg" },
      { id: "rolling-kitchen-cart", name: "Rolling Kitchen Cart", keywords: ["rolling kitchen island", "kitchen cart with wheels", "portable kitchen cart storage"], image: "/images/solutions/rolling-kitchen-cart.jpg" },
      { id: "fold-down-table", name: "Wall-Mounted Fold-Down Table", keywords: ["wall mounted folding table", "drop leaf wall table", "fold down kitchen counter"], image: "/images/solutions/fold-down-table.jpg" },
      { id: "counter-shelf-riser", name: "Counter Shelf Riser", keywords: ["kitchen counter shelf organizer", "countertop storage rack", "kitchen shelf riser"], image: "/images/solutions/counter-shelf-riser.jpg" }
    ]
  },
  {
    id: "kitchen-counter-clutter",
    name: "Kitchen Counter Clutter – Too Many Items on Counter",
    category: "Kitchen",
    description: "Kitchen counters covered with appliances, mail, keys, and random items making it hard to find anything or have clear workspace.",
    keywords: ["counter clutter", "cluttered counter", "messy counter", "too much stuff on counter", "counter covered", "appliances everywhere", "no clear counter", "kitchen mess", "counter organization"],
    filters: [
      {
        id: "style",
        label: "Style",
        type: "single",
        values: [
          { id: "modern", label: "Modern", keywords: ["modern", "contemporary", "sleek"] },
          { id: "rustic", label: "Rustic", keywords: ["rustic", "farmhouse", "wood"] },
          { id: "industrial", label: "Industrial", keywords: ["industrial", "metal", "black"] },
          { id: "minimalist", label: "Minimalist", keywords: ["minimalist", "simple", "white"] }
        ]
      },
      {
        id: "size",
        label: "Size",
        type: "single", 
        values: [
          { id: "compact", label: "Compact", keywords: ["small", "compact", "mini"] },
          { id: "medium", label: "Medium", keywords: ["medium", "standard"] },
          { id: "large", label: "Large", keywords: ["large", "big", "extra large"] }
        ]
      }
    ],
    stepLabels: {
      step2: "Solution Type",
      step3: "Style"
    },
    solutions: [
      { 
        id: "counter-shelf-organizer", 
        name: "Spice Rack Organizer", 
        keywords: ["spice rack organizer", "spice shelf", "kitchen spice storage"],
        image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop&q=80"
      },
      { 
        id: "utensil-holder", 
        name: "Utensil Holder & Crock", 
        keywords: ["utensil holder", "kitchen utensil crock", "cooking tool organizer"],
        image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=400&fit=crop&q=80"
      },
      { 
        id: "under-cabinet-hooks", 
        name: "Under-Cabinet Hooks & Storage", 
        keywords: ["under cabinet storage", "under cabinet hooks", "hanging kitchen organizer"],
        image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=400&h=400&fit=crop&q=80"
      },
      { 
        id: "appliance-garage", 
        name: "Appliance Garage/Cover", 
        keywords: ["appliance garage", "appliance cover", "bread box appliance hider"],
        image: "https://images.unsplash.com/photo-1556909172-54557c7e4fb7?w=400&h=400&fit=crop&q=80"
      },
      { 
        id: "wall-mounted-organizer", 
        name: "Wall-Mounted Kitchen Organizer", 
        keywords: ["wall mounted kitchen organizer", "kitchen wall rack", "magnetic knife strip organizer"],
        image: "https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=400&h=400&fit=crop&q=80"
      },
      { 
        id: "tiered-counter-organizer", 
        name: "Tiered Counter Organizer", 
        keywords: ["tiered kitchen organizer", "3 tier counter shelf", "multi level counter storage"],
        image: "https://images.unsplash.com/photo-1556909190-eccf4a8bf97a?w=400&h=400&fit=crop&q=80"
      }
    ]
  },
  {
    id: "pantry-chaos",
    name: "Pantry Chaos & Forgotten Expired Food",
    category: "Kitchen",
    description: "Items get pushed to the back of pantries, forgotten until they expire; no visibility leads to duplicate purchases.",
    keywords: ["food expired", "can't see what I have", "forgot I bought that", "pantry disaster", "stuff goes bad", "bought duplicates"],
    skipRefineStep: true,
    solutions: [
      { id: "clear-food-containers", name: "Clear Airtight Food Containers", keywords: ["clear pantry containers", "airtight food storage set", "stackable pantry bins clear"], image: "/images/solutions/clear-food-containers.jpg" },
      { id: "lazy-susan", name: "Cabinet Lazy Susan Turntable", keywords: ["lazy susan cabinet organizer", "turntable pantry organizer", "rotating shelf organizer"], image: "/images/solutions/lazy-susan.jpg" },
      { id: "pull-out-organizer", name: "Pull-Out Cabinet Organizer", keywords: ["pull out cabinet shelf", "sliding cabinet organizer", "drawer cabinet organizer"], image: "/images/solutions/pull-out-organizer.jpg" },
      { id: "tiered-shelf-riser", name: "Tiered Shelf Riser", keywords: ["tiered shelf organizer pantry", "cabinet shelf risers", "3 tier pantry organizer"], image: "/images/solutions/tiered-shelf-riser.jpg" }
    ]
  },
  {
    id: "tupperware-avalanche",
    name: "Tupperware/Food Container Lid Avalanche",
    category: "Kitchen",
    description: "Food storage containers and lids become a jumbled mess, causing cabinet doors to jam and lids to go missing.",
    keywords: ["tupperware drawer disaster", "can't find matching lid", "container avalanche", "lids everywhere", "jammed drawer", "mismatched containers"],
    skipRefineStep: true,
    solutions: [
      { id: "lid-organizer", name: "Lid Organizer Rack", keywords: ["food container lid organizer", "tupperware lid holder", "plastic lid storage rack"], image: "/images/solutions/lid-organizer.jpg" },
      { id: "container-drawer-dividers", name: "Container Drawer Dividers", keywords: ["drawer dividers containers", "food storage drawer organizer", "adjustable drawer dividers"], image: "/images/solutions/container-drawer-dividers.jpg" },
      { id: "pull-out-container-bin", name: "Pull-Out Container Bin", keywords: ["pull out storage bin cabinet", "sliding cabinet basket organizer"], image: "/images/solutions/pull-out-container-bin.jpg" }
    ]
  },
  {
    id: "under-sink-mess",
    name: "Under-Sink Cabinet Mess",
    category: "Kitchen",
    description: "The space under the kitchen sink is a black hole where cleaning supplies multiply and items get lost behind pipes.",
    keywords: ["under sink disaster", "can't organize around pipes", "cleaning supplies everywhere", "stuff gets lost under sink", "leaking bottles"],
    solutions: [
      { id: "expandable-under-sink-shelf", name: "Expandable Under-Sink Shelf", keywords: ["under sink organizer expandable", "adjustable under sink shelf", "2 tier under sink storage"], image: "/images/solutions/expandable-under-sink-shelf.jpg" },
      { id: "tension-rod-spray-bottles", name: "Tension Rod for Spray Bottles", keywords: ["tension rod cabinet organizer", "spray bottle holder rod", "under sink tension bar"], image: "/images/solutions/tension-rod-spray-bottles.jpg" },
      { id: "pull-out-under-sink-caddy", name: "Pull-Out Under-Sink Caddy", keywords: ["pull out under sink organizer", "sliding under sink basket", "under sink drawer organizer"], image: "/images/solutions/pull-out-under-sink-caddy.jpg" },
      { id: "cabinet-door-organizer", name: "Cabinet Door Organizer", keywords: ["cabinet door organizer", "over cabinet door storage", "door mounted basket"], image: "/images/solutions/cabinet-door-organizer.jpg" }
    ]
  },
  {
    id: "no-dish-drying-space",
    name: "No Space for Dish Drying",
    category: "Kitchen",
    description: "Small kitchens have no room for a dish rack; traditional racks take up precious counter space.",
    keywords: ["no room for dish rack", "dish rack takes up counter", "water pooling", "drying mat gets moldy", "nowhere to dry dishes"],
    solutions: [
      { id: "over-sink-dish-rack", name: "Over-the-Sink Dish Rack", keywords: ["over sink dish drying rack", "sink dish rack expandable", "over sink drainer"], image: "/images/solutions/over-sink-dish-rack.jpg" },
      { id: "collapsible-dish-rack", name: "Collapsible Dish Rack", keywords: ["collapsible dish rack", "foldable dish drainer", "compact dish rack"], image: "/images/solutions/collapsible-dish-rack.jpg" },
      { id: "roll-up-drying-mat", name: "Roll-Up Sink Drying Mat", keywords: ["roll up dish drying rack", "silicone sink drying mat", "rollable dish drainer"], image: "/images/solutions/roll-up-drying-mat.jpg" },
      { id: "two-tier-dish-rack", name: "Two-Tier Dish Rack", keywords: ["2 tier dish rack", "vertical dish drying rack", "double layer dish drainer"], image: "/images/solutions/two-tier-dish-rack.jpg" }
    ]
  },

  // ==================== HOME OFFICE ====================
  {
    id: "cable-mess",
    name: "Tangled Cable Mess Under/Behind Desk",
    category: "Home Office",
    description: "Remote workers complain about rats nest of cables creating visual clutter and tangling when unplugging devices.",
    keywords: ["cables everywhere", "tangled wires", "messy desk setup", "cable chaos", "cord jungle", "spaghetti cables", "ugly cables"],
    solutions: [
      { id: "under-desk-cable-tray", name: "Under-Desk Cable Tray", keywords: ["under desk cable management tray", "cable tray desk mount", "desk cable organizer basket"], image: "/images/solutions/under-desk-cable-tray.jpg" },
      { id: "cable-management-sleeve", name: "Cable Management Sleeve", keywords: ["cable management sleeve", "cord cover sleeve zipper", "neoprene cable organizer"], image: "/images/solutions/cable-management-sleeve.jpg" },
      { id: "cable-clips-velcro", name: "Cable Clips & Velcro Straps", keywords: ["adhesive cable clips", "reusable velcro cable ties", "desk cable clips adhesive"], image: "/images/solutions/cable-clips-velcro.jpg" },
      { id: "cable-management-box", name: "Cable Management Box", keywords: ["cable management box large", "cord hider box", "power strip cover box"], image: "/images/solutions/cable-management-box.jpg" }
    ]
  },
  {
    id: "wfh-back-pain",
    name: "Back/Neck Pain from Poor WFH Setup",
    category: "Home Office",
    description: "81% of WFH workers report back, neck, or shoulder pain from makeshift home offices using kitchen tables or dining chairs.",
    keywords: ["back pain working from home", "neck hurts from computer", "WFH posture problems", "uncomfortable working", "shoulder pain desk", "tech neck"],
    filters: [
      {
        id: "budget",
        label: "Budget",
        type: "single",
        values: [
          { id: "budget-low", label: "Under $50", keywords: ["cheap", "affordable", "budget"] },
          { id: "budget-mid", label: "$50-150", keywords: [] },
          { id: "budget-high", label: "$150-300", keywords: ["premium"] },
          { id: "budget-premium", label: "$300+", keywords: ["luxury", "high-end", "professional"] }
        ]
      },
      {
        id: "solution-type",
        label: "Focus Area",
        type: "single",
        values: [
          { id: "seating", label: "Seating", keywords: ["chair", "seat", "cushion"] },
          { id: "desk-setup", label: "Desk Setup", keywords: ["desk", "standing", "monitor"] },
          { id: "accessories", label: "Accessories", keywords: ["wrist rest", "footrest", "support"] }
        ]
      }
    ],
    stepLabels: {
      step2: "Focus Area",
      step3: "Budget"
    },
    solutions: [
      { id: "ergonomic-chair", name: "Ergonomic Office Chair", keywords: ["ergonomic office chair lumbar support", "home office chair adjustable arms", "desk chair back support"], image: "/images/solutions/ergonomic-chair.jpg" },
      { id: "laptop-stand", name: "Laptop Stand/Riser", keywords: ["laptop stand adjustable height", "laptop riser for desk", "computer stand eye level"], image: "/images/solutions/laptop-stand.jpg" },
      { id: "monitor-arm", name: "Monitor Arm Mount", keywords: ["monitor arm desk mount", "adjustable monitor stand", "monitor riser height adjustment"], image: "/images/solutions/monitor-arm.jpg" },
      { id: "wrist-rest", name: "Keyboard/Mouse Wrist Rest", keywords: ["ergonomic wrist rest keyboard", "mouse pad wrist support", "memory foam wrist rest"], image: "/images/solutions/wrist-rest.jpg" }
    ]
  },
  {
    id: "cluttered-desk",
    name: "Cluttered Desk / No Space for Everything",
    category: "Home Office",
    description: "Remote workers struggle with desks covered in papers, devices, and supplies with no room to actually work.",
    keywords: ["cluttered desk", "messy workspace", "no desk space", "small desk cluttered", "desk covered in stuff", "can't find anything on desk"],
    solutions: [
      { id: "desktop-organizer", name: "Desktop Organizer with Drawers", keywords: ["desk organizer with drawers", "desktop storage organizer", "office desk organizer set"], image: "/images/solutions/desktop-organizer.jpg" },
      { id: "monitor-stand-storage", name: "Monitor Stand with Storage", keywords: ["monitor stand with drawer", "computer riser with storage", "desk shelf with USB"], image: "/images/solutions/monitor-stand-storage.jpg" },
      { id: "desk-shelf-riser", name: "Desk Shelf Riser", keywords: ["desk shelf organizer", "desktop shelf for monitor", "computer desk organizer shelf"], image: "/images/solutions/desk-shelf-riser.jpg" }
    ]
  },
  {
    id: "messy-video-background",
    name: "Messy Video Call Background",
    category: "Home Office",
    description: "WFH workers are embarrassed by cluttered bedrooms or messy kitchens visible during Zoom calls.",
    keywords: ["messy room Zoom", "embarrassing video call background", "hide bedroom on video call", "unprofessional home background", "video call look professional"],
    solutions: [
      { id: "room-divider", name: "Room Divider Screen", keywords: ["room divider screen folding", "privacy screen home office", "portable room partition"], image: "/images/solutions/room-divider.jpg" },
      { id: "video-backdrop", name: "Video Call Backdrop Panel", keywords: ["webcam background screen", "video call backdrop portable", "zoom background panel"], image: "/images/solutions/video-backdrop.jpg" },
      { id: "green-screen", name: "Collapsible Green Screen", keywords: ["collapsible green screen", "portable green screen chair mount", "webcam green screen"], image: "/images/solutions/green-screen.jpg" }
    ]
  },
  {
    id: "no-dedicated-office",
    name: "No Dedicated Office Space / Small Apartment",
    category: "Home Office",
    description: "Renters and apartment dwellers have no spare room for an office and must work from kitchen tables or bedroom corners.",
    keywords: ["no room for desk", "work from home small apartment", "no dedicated office space", "bedroom desk setup", "living room work area"],
    solutions: [
      { id: "wall-mounted-desk", name: "Folding Wall-Mounted Desk", keywords: ["wall mounted folding desk", "fold down desk small space", "murphy desk fold out"], image: "/images/solutions/wall-mounted-desk.jpg" },
      { id: "corner-desk", name: "Corner Desk Compact", keywords: ["small corner desk", "corner desk small spaces", "compact corner computer desk"], image: "/images/solutions/corner-desk.jpg" },
      { id: "desk-with-storage", name: "Desk with Built-in Storage", keywords: ["desk with drawers and shelves", "computer desk with storage", "small desk with hutch"], image: "/images/solutions/desk-with-storage.jpg" }
    ]
  },

  // ==================== LIVING ROOM/FURNITURE ====================
  {
    id: "tv-cables-visible",
    name: "TV Cables Visible/Messy",
    category: "Living Room",
    description: "Wall-mounted or stand-mounted TVs have ugly dangling cables running down the wall.",
    keywords: ["TV wires showing", "hide TV cables", "messy cables behind TV", "cords hanging from TV", "TV cord eyesore", "cables ruining living room"],
    solutions: [
      { id: "cable-raceway", name: "Cable Raceway/Cover Kit", keywords: ["TV cord cover wall", "cable raceway paintable", "wall cable concealer kit"], image: "/images/solutions/cable-raceway.jpg" },
      { id: "in-wall-cable-kit", name: "In-Wall Cable Management Kit", keywords: ["in wall TV cable kit", "TV wire hider through wall", "in wall power kit TV"], image: "/images/solutions/in-wall-cable-kit.jpg" },
      { id: "tv-stand-cable-management", name: "TV Stand with Cable Management", keywords: ["TV stand cable management", "entertainment center cord organizer", "TV console hide wires"], image: "/images/solutions/tv-stand-cable-management.jpg" }
    ]
  },
  {
    id: "small-living-room",
    name: "Small Living Room / Oversized Furniture",
    category: "Living Room",
    description: "Renters and homeowners complain their living room feels cramped because furniture is too big.",
    keywords: ["living room too cramped", "couch too big for room", "furniture doesn't fit small apartment", "crowded living room", "oversized sectional", "no room to walk"],
    solutions: [
      { id: "apartment-size-sofa", name: "Apartment-Size Sofa", keywords: ["apartment size sofa", "small space couch", "loveseat small living room"], image: "/images/solutions/apartment-size-sofa.jpg" },
      { id: "nesting-tables", name: "Nesting Coffee Tables", keywords: ["nesting coffee tables", "stackable side tables", "space saving coffee table"], image: "/images/solutions/nesting-tables.jpg" },
      { id: "storage-ottoman", name: "Storage Ottoman", keywords: ["storage ottoman living room", "ottoman with storage inside", "footstool hidden storage"], image: "/images/solutions/storage-ottoman.jpg" }
    ]
  },
  {
    id: "no-living-room-storage",
    name: "No Living Room Storage / Clutter Everywhere",
    category: "Living Room",
    description: "Small apartments lack closets and built-in storage, leaving blankets, remotes, and items piled on sofas.",
    keywords: ["no storage small apartment", "living room clutter", "where to put blankets", "no place for stuff", "things piling up living room"],
    solutions: [
      { id: "storage-coffee-table", name: "Storage Coffee Table", keywords: ["coffee table with storage", "lift top coffee table storage", "coffee table with drawers"], image: "/images/solutions/storage-coffee-table.jpg" },
      { id: "fabric-storage-cubes", name: "Fabric Storage Cubes/Bins", keywords: ["storage cubes fabric bins", "collapsible storage bins", "living room storage baskets"], image: "/images/solutions/fabric-storage-cubes.jpg" },
      { id: "console-table-shelves", name: "Console Table with Shelves", keywords: ["console table with storage", "narrow console table shelves", "entryway table with baskets"], image: "/images/solutions/console-table-shelves.jpg" },
      { id: "storage-ottoman-cube", name: "Ottoman with Storage", keywords: ["storage ottoman cube", "tufted storage ottoman", "foldable storage ottoman"], image: "/images/solutions/storage-ottoman-cube.jpg" }
    ]
  },
  {
    id: "pet-damaged-furniture",
    name: "Pet-Damaged/Stained Furniture",
    category: "Living Room",
    description: "Pet owners struggle with fur, scratches, accidents, and general wear from dogs and cats on couches.",
    keywords: ["dog ruined couch", "cat scratched sofa", "pet stains on couch", "protect furniture from pets", "dog hair on sofa", "pet accidents furniture"],
    solutions: [
      { id: "pet-proof-slipcover", name: "Pet-Proof Couch Slipcover", keywords: ["waterproof couch cover pets", "pet proof sofa cover", "dog proof couch slipcover"], image: "/images/solutions/pet-proof-slipcover.jpg" },
      { id: "scratch-protector", name: "Scratch-Resistant Furniture Protector", keywords: ["cat scratch furniture protector", "scratch guard couch cover", "furniture protector dogs cats"], image: "/images/solutions/scratch-protector.jpg" },
      { id: "waterproof-pet-blanket", name: "Waterproof Pet Blanket/Throw", keywords: ["waterproof pet blanket couch", "dog couch blanket washable", "pet furniture throw waterproof"], image: "/images/solutions/waterproof-pet-blanket.jpg" }
    ]
  },
  {
    id: "saggy-couch",
    name: "Saggy/Flat Couch Cushions",
    category: "Living Room",
    description: "After 2-5 years of use, couch cushions lose firmness, develop butt imprints, and sink in the middle.",
    keywords: ["saggy couch cushions", "flat sofa cushions", "couch sinking", "cushions lost firmness", "cushion deflated", "sofa cushions worn out", "couch is old"],
    solutions: [
      { id: "fiberfill-stuffing", name: "Polyester Fiberfill Stuffing", keywords: ["couch cushion stuffing", "polyester fiberfill cushions", "cushion refill stuffing"], image: "/images/solutions/fiberfill-stuffing.jpg" },
      { id: "foam-insert", name: "High-Density Foam Insert", keywords: ["couch cushion foam replacement", "high density foam couch", "sofa cushion foam insert"], image: "/images/solutions/foam-insert.jpg" },
      { id: "cushion-support-board", name: "Cushion Support Insert/Board", keywords: ["couch cushion support insert", "sagging sofa cushion support", "furniture cushion support board"], image: "/images/solutions/cushion-support-board.jpg" },
      { id: "cushion-wrap", name: "Cushion Wrap/Batting", keywords: ["cushion wrap foam", "dacron cushion wrap", "sofa cushion batting"], image: "/images/solutions/cushion-wrap.jpg" }
    ]
  },

  // ==================== BEDROOM ====================
  {
    id: "light-disrupting-sleep",
    name: "Light Disrupting Sleep – Can't Block Outside Light",
    category: "Bedroom",
    description: "Street lights, early sunrise, or ambient light seeping through curtain gaps disrupts sleep.",
    keywords: ["room too bright to sleep", "light coming through curtains", "streetlight keeps me awake", "waking up too early", "can't get room dark enough"],
    solutions: [
      { id: "blackout-curtains", name: "Blackout Curtains", keywords: ["blackout curtains 100% room darkening", "thermal blackout curtains bedroom", "complete blackout drapes"], image: "/images/solutions/blackout-curtains.jpg" },
      { id: "sleep-mask", name: "Sleep Eye Mask", keywords: ["blackout sleep mask contoured", "silk sleep mask light blocking", "comfortable eye mask sleeping"], image: "/images/solutions/sleep-mask.jpg" },
      { id: "blackout-window-film", name: "Blackout Window Film", keywords: ["blackout window film removable", "static cling blackout film", "privacy window darkening film"], image: "/images/solutions/blackout-window-film.jpg" },
      { id: "curtain-light-blockers", name: "Curtain Gap Light Blockers", keywords: ["curtain light blocker sides", "curtain wrap around rod", "magnetic curtain closure"], image: "/images/solutions/curtain-light-blockers.jpg" }
    ]
  },
  {
    id: "noise-keeping-awake",
    name: "Noise Keeping You Awake",
    category: "Bedroom",
    description: "Traffic noise, neighbors, snoring partners, or city sounds prevent falling asleep.",
    keywords: ["can't sleep because of noise", "neighbors too loud", "traffic wakes me up", "partner snoring", "light sleeper", "city noise at night"],
    solutions: [
      { id: "white-noise-machine", name: "White Noise Machine", keywords: ["white noise machine sleeping", "sound machine sleep adults", "white noise maker bedroom"], image: "/images/solutions/white-noise-machine.jpg" },
      { id: "sleep-earplugs", name: "Noise Reducing Earplugs", keywords: ["sleep earplugs noise cancelling", "earplugs sleeping soft", "noise blocking ear plugs comfortable"], image: "/images/solutions/sleep-earplugs.jpg" },
      { id: "soundproof-curtains", name: "Sound Dampening Curtains", keywords: ["soundproof curtains bedroom", "noise reducing curtains heavy", "acoustic curtains windows"], image: "/images/solutions/soundproof-curtains.jpg" }
    ]
  },
  {
    id: "small-bedroom",
    name: "Small Bedroom – No Room for Furniture or Storage",
    category: "Bedroom",
    description: "Tiny bedrooms with barely room for a bed, no space for dressers or nightstands.",
    keywords: ["bedroom too small", "no room for nightstand", "tiny bedroom", "can't fit dresser", "bed takes up whole room", "cramped bedroom"],
    solutions: [
      { id: "storage-bed-frame", name: "Bed Frame with Built-In Storage", keywords: ["platform bed with drawers", "storage bed frame queen", "bed with built in storage underneath"], image: "/images/solutions/storage-bed-frame.jpg" },
      { id: "bed-risers", name: "Bed Risers for Under-Bed Storage", keywords: ["bed risers heavy duty", "bed lifters for storage", "adjustable bed risers tall"], image: "/images/solutions/bed-risers.jpg" },
      { id: "floating-nightstand", name: "Floating Nightstand", keywords: ["floating nightstand wall mount", "bedside shelf small", "wall mounted bedside table"], image: "/images/solutions/floating-nightstand.jpg" },
      { id: "over-bed-storage", name: "Over-Bed Storage Shelf", keywords: ["over bed shelf storage", "headboard shelf attachment", "bed surround storage unit"], image: "/images/solutions/over-bed-storage.jpg" }
    ]
  },
  {
    id: "worn-once-clothes",
    name: "Clothes Everywhere – No System for Worn-Once Items",
    category: "Bedroom",
    description: "Clothes worn once but not dirty enough for laundry pile up on chairs, beds, and floors.",
    keywords: ["clothes on the chair", "worn once clothes everywhere", "clothes piling up", "not dirty enough for laundry", "floor-drobe", "clothes dumped everywhere"],
    solutions: [
      { id: "clothes-valet", name: "Clothes Valet Stand", keywords: ["clothes valet stand bedroom", "suit valet organizer", "standing clothes butler"], image: "/images/solutions/clothes-valet.jpg" },
      { id: "over-door-clothes-hooks", name: "Over-Door Clothes Hooks", keywords: ["over door hooks clothes", "door mounted coat rack", "back of door hanger"], image: "/images/solutions/over-door-clothes-hooks.jpg" },
      { id: "decorative-ladder", name: "Decorative Ladder Rack", keywords: ["blanket ladder clothes", "decorative leaning ladder", "clothes ladder rack bedroom"], image: "/images/solutions/decorative-ladder.jpg" },
      { id: "freestanding-clothes-rack", name: "Freestanding Clothes Rack", keywords: ["rolling garment rack bedroom", "small clothes rack freestanding", "portable wardrobe rack"], image: "/images/solutions/freestanding-clothes-rack.jpg" }
    ]
  },
  {
    id: "no-nightstand-space",
    name: "No Nightstand Space for Essentials",
    category: "Bedroom",
    description: "Small or nonexistent nightstands can't hold phone, glasses, water, books, and other bedside essentials.",
    keywords: ["no room for nightstand", "nightstand too small", "nowhere to put phone at night", "glasses keep falling", "can't reach water at night", "bedside clutter"],
    solutions: [
      { id: "bedside-caddy", name: "Bedside Caddy/Pocket Organizer", keywords: ["bedside caddy organizer", "bed pocket storage organizer", "hanging bedside storage"], image: "/images/solutions/bedside-caddy.jpg" },
      { id: "clip-on-bed-shelf", name: "Clip-On Bed Shelf", keywords: ["bed shelf attachment", "bunk bed shelf clip on", "bedside tray clip"], image: "/images/solutions/clip-on-bed-shelf.jpg" },
      { id: "adhesive-wall-pocket", name: "Adhesive Wall Pocket", keywords: ["adhesive phone holder wall", "stick on bedside organizer", "wall mount phone caddy"], image: "/images/solutions/adhesive-wall-pocket.jpg" },
      { id: "c-table", name: "C-Table/Slide Under Sofa Table", keywords: ["C table side table bed", "slide under table", "laptop table for bed"], image: "/images/solutions/c-table.jpg" }
    ]
  },

  // ==================== BATHROOM ====================
  {
    id: "shower-caddy-falling",
    name: "Shower Caddy Keeps Falling",
    category: "Bathroom",
    description: "Suction cup shower caddies constantly crash to the floor, often in the middle of the night.",
    keywords: ["shower caddy fell again", "suction cups won't stick", "caddy keeps crashing", "slipping down showerhead", "tired of things falling"],
    solutions: [
      { id: "adhesive-shower-shelf", name: "Adhesive Mount Shower Shelf", keywords: ["adhesive shower shelf", "no drill shower caddy", "stick on shower organizer"], image: "/images/solutions/adhesive-shower-shelf.jpg" },
      { id: "tension-pole-caddy", name: "Tension Pole Shower Caddy", keywords: ["tension pole shower caddy", "corner tension shower organizer", "floor to ceiling shower shelf"], image: "/images/solutions/tension-pole-caddy.jpg" },
      { id: "hanging-showerhead-caddy", name: "Hanging Over-Showerhead Caddy with Grip", keywords: ["over showerhead caddy anti-slip", "shower caddy hangs from showerhead"], image: "/images/solutions/hanging-showerhead-caddy.jpg" },
      { id: "corner-shower-shelf", name: "Shower Corner Shelf (Permanent)", keywords: ["corner shower shelf tile", "built-in shower caddy", "shower niche insert"], image: "/images/solutions/corner-shower-shelf.jpg" }
    ]
  },
  {
    id: "no-medicine-cabinet",
    name: "No Medicine Cabinet/Vanity Storage",
    category: "Bathroom",
    description: "Many bathrooms lack a medicine cabinet or have pedestal sinks with no storage underneath.",
    keywords: ["no medicine cabinet", "pedestal sink no storage", "toiletries everywhere", "bathroom counter cluttered", "rental bathroom no storage"],
    solutions: [
      { id: "wall-medicine-cabinet", name: "Wall-Mounted Medicine Cabinet", keywords: ["wall mount medicine cabinet", "bathroom wall cabinet", "surface mount medicine cabinet"], image: "/images/solutions/wall-medicine-cabinet.jpg" },
      { id: "slim-bathroom-cabinet", name: "Slim Freestanding Cabinet", keywords: ["slim bathroom cabinet", "narrow bathroom storage", "tall thin bathroom cabinet"], image: "/images/solutions/slim-bathroom-cabinet.jpg" },
      { id: "over-door-bathroom-organizer", name: "Over-Door Hanging Organizer", keywords: ["over door bathroom organizer", "bathroom door storage", "hanging bathroom caddy"], image: "/images/solutions/over-door-bathroom-organizer.jpg" },
      { id: "countertop-toiletry-organizer", name: "Countertop Makeup/Toiletry Organizer", keywords: ["bathroom counter organizer", "makeup organizer bathroom", "toiletry storage tray"], image: "/images/solutions/countertop-toiletry-organizer.jpg" }
    ]
  },
  {
    id: "wasted-space-above-toilet",
    name: "Wasted Space Above Toilet",
    category: "Bathroom",
    description: "The area above the toilet is prime unused real estate in small bathrooms.",
    keywords: ["bathroom has no storage", "toilet area empty", "need more bathroom shelves", "over toilet space wasted", "small bathroom organization"],
    solutions: [
      { id: "over-toilet-shelf", name: "Over-the-Toilet Shelving Unit", keywords: ["over toilet storage shelf", "bathroom space saver", "over toilet organizer"], image: "/images/solutions/over-toilet-shelf.jpg" },
      { id: "bathroom-floating-shelves", name: "Floating Shelves", keywords: ["bathroom floating shelves", "wall shelves above toilet", "wood floating shelf bathroom"], image: "/images/solutions/bathroom-floating-shelves.jpg" },
      { id: "over-toilet-cabinet", name: "Over-the-Toilet Cabinet", keywords: ["over toilet cabinet", "bathroom cabinet over toilet", "toilet storage cabinet doors"], image: "/images/solutions/over-toilet-cabinet.jpg" },
      { id: "bathroom-ladder-shelf", name: "Ladder Shelf Unit", keywords: ["bathroom ladder shelf", "leaning bathroom shelf", "ladder storage bathroom"], image: "/images/solutions/bathroom-ladder-shelf.jpg" }
    ]
  },
  {
    id: "under-sink-bathroom-chaos",
    name: "Under-Sink Bathroom Cabinet Chaos",
    category: "Bathroom",
    description: "The space under bathroom sinks accumulates sample bottles, half-used products, and forgotten items.",
    keywords: ["under sink mess", "products all over", "forgot I had that", "sticky bottles", "samples piling up", "can't find anything"],
    solutions: [
      { id: "stackable-bathroom-bins", name: "Stackable Storage Bins", keywords: ["stackable bathroom bins", "clear bathroom storage bins", "under sink stackable organizer"], image: "/images/solutions/stackable-bathroom-bins.jpg" },
      { id: "two-tier-under-sink", name: "Two-Tier Under-Sink Organizer", keywords: ["2 tier under sink shelf", "bathroom under sink organizer", "adjustable under sink rack"], image: "/images/solutions/two-tier-under-sink.jpg" },
      { id: "pull-out-bathroom-drawers", name: "Pull-Out Bathroom Drawers", keywords: ["pull out bathroom organizer", "sliding bathroom storage", "under sink drawer organizer"], image: "/images/solutions/pull-out-bathroom-drawers.jpg" }
    ]
  },
  {
    id: "hair-tools-clutter",
    name: "Hair Tools Clutter & Heat Hazards",
    category: "Bathroom",
    description: "Hair dryers, straighteners, and curling irons have nowhere to go; hot tools are a burn/fire hazard when left out.",
    keywords: ["hair dryer keeps falling", "straightener burns counter", "cords tangled mess", "no place for hair tools", "hot tools hazard"],
    solutions: [
      { id: "hair-tool-organizer", name: "Hair Tool Organizer/Holder", keywords: ["hair dryer holder wall mount", "hair tool organizer", "curling iron holder"], image: "/images/solutions/hair-tool-organizer.jpg" },
      { id: "over-cabinet-hair-station", name: "Over-Cabinet Hair Tool Station", keywords: ["over cabinet door hair tool holder", "cabinet door hair dryer holder"], image: "/images/solutions/over-cabinet-hair-station.jpg" },
      { id: "heat-resistant-caddy", name: "Heat-Resistant Hair Tool Caddy", keywords: ["heat resistant hair tool holder", "hot tool organizer bathroom", "styling tool organizer"], image: "/images/solutions/heat-resistant-caddy.jpg" }
    ]
  },

  // ==================== PET OWNERS ====================
  {
    id: "pet-hair-everywhere",
    name: "Pet Hair on Furniture, Clothes & Car Seats",
    category: "Pet Owners",
    description: "Pet hair embeds deeply into fabric furniture, car upholstery, and clothing.",
    keywords: ["dog hair everywhere", "fur on couch", "cat hair won't come off", "covered in pet hair", "hair on black clothes", "fur on car seats"],
    solutions: [
      { id: "lint-brush-roller", name: "Reusable Lint Brush Roller", keywords: ["reusable pet hair remover roller", "ChomChom roller pet hair", "lint-free pet brush"], image: "/images/solutions/lint-brush-roller.jpg" },
      { id: "pet-hair-rake", name: "Rubber Pet Hair Rake Tool", keywords: ["carpet pet hair rake", "rubber pet fur remover carpet", "FurDozer pet hair tool"], image: "/images/solutions/pet-hair-rake.jpg" },
      { id: "pet-hair-laundry", name: "Pet Hair Laundry Remover", keywords: ["FurZapper laundry pet hair", "dryer pet hair remover balls", "laundry fur catcher"], image: "/images/solutions/pet-hair-laundry.jpg" },
      { id: "deshedding-brush", name: "Deshedding Brush", keywords: ["FURminator deshedding tool", "slicker brush self-cleaning", "undercoat rake double coat dog"], image: "/images/solutions/deshedding-brush.jpg" }
    ]
  },
  {
    id: "litter-box-odor",
    name: "Litter Box Odor Permeating the House",
    category: "Pet Owners",
    description: "Cat litter box smell spreads throughout the home, with regular scooping insufficient to control ammonia odors.",
    keywords: ["litter box stinks", "cat pee smell house", "can't get rid of litter smell", "ammonia smell cat urine", "house smells like litter"],
    solutions: [
      { id: "odor-control-litter", name: "Odor-Control Clumping Litter", keywords: ["Arm and Hammer Clump Seal litter", "odor control cat litter", "activated charcoal cat litter"], image: "/images/solutions/odor-control-litter.jpg" },
      { id: "litter-disposal-pail", name: "Litter Disposal Pail", keywords: ["Litter Genie pail", "litter disposal system odor lock", "cat litter trash can sealed"], image: "/images/solutions/litter-disposal-pail.jpg" },
      { id: "air-purifier-pets", name: "Air Purifier with Carbon Filter", keywords: ["air purifier pets carbon filter", "HEPA air purifier pet odor", "room air cleaner pets"], image: "/images/solutions/air-purifier-pets.jpg" },
      { id: "enzymatic-litter-deodorizer", name: "Enzymatic Litter Deodorizer", keywords: ["litter box deodorizer powder", "baking soda cat litter additive", "activated charcoal litter box"], image: "/images/solutions/enzymatic-litter-deodorizer.jpg" }
    ]
  },
  {
    id: "muddy-paws",
    name: "Muddy Paws Tracking Dirt Through the House",
    category: "Pet Owners",
    description: "Dogs bring mud, dirt and debris inside after walks or backyard play.",
    keywords: ["muddy paw prints everywhere", "dog tracks dirt inside", "wet paws on carpet", "muddy floors after walks", "can't keep floors clean dog"],
    solutions: [
      { id: "paw-washer", name: "Paw Washer/Plunger Cup", keywords: ["portable paw cleaner cup", "Dexas MudBuster paw washer", "dog paw cleaning cup"], image: "/images/solutions/paw-washer.jpg" },
      { id: "absorbent-door-mat", name: "High-Absorbent Door Mat", keywords: ["dirty dog doormat microfiber", "chenille dog door mat absorbent", "mud mat dogs high pile"], image: "/images/solutions/absorbent-door-mat.jpg" },
      { id: "paw-cleaning-wipes", name: "Dog Paw Cleaning Wipes", keywords: ["pet paw wipes large dogs", "dog grooming wipes paws", "thick dog wipes feet"], image: "/images/solutions/paw-cleaning-wipes.jpg" },
      { id: "dog-booties", name: "Dog Booties/Paw Protectors", keywords: ["waterproof dog booties outdoor", "dog rain boots muddy", "paw protector shoes dogs"], image: "/images/solutions/dog-booties.jpg" }
    ]
  },
  {
    id: "messy-feeding-area",
    name: "Messy Feeding Area & Water Spills",
    category: "Pet Owners",
    description: "Dogs splash water across floors while drinking, knock over bowls, and scatter food.",
    keywords: ["dog splashes water everywhere", "sloppy drinker dog", "water all over floor dog bowl", "dog tips water bowl", "mess around dog food"],
    solutions: [
      { id: "no-spill-bowl", name: "No-Spill Water Bowl", keywords: ["no spill dog water bowl", "Slopper Stopper water bowl", "anti-splash dog bowl"], image: "/images/solutions/no-spill-bowl.jpg" },
      { id: "elevated-feeding-station", name: "Elevated Feeding Station with Catch Basin", keywords: ["Neater Feeder elevated bowl", "raised dog bowl drip tray", "elevated dog feeder spill-proof"], image: "/images/solutions/elevated-feeding-station.jpg" },
      { id: "waterproof-feeding-mat", name: "Waterproof Feeding Mat", keywords: ["silicone pet feeding mat large", "waterproof dog food mat", "dog bowl mat raised edges"], image: "/images/solutions/waterproof-feeding-mat.jpg" },
      { id: "slow-feed-water-bowl", name: "Slow-Feed Water Bowl", keywords: ["slow drinking dog bowl", "floating disk water bowl dogs", "water dispenser bowl dogs"], image: "/images/solutions/slow-feed-water-bowl.jpg" }
    ]
  },
  {
    id: "pet-urine-stains",
    name: "Pet Urine Stains & Odors That Won't Go Away",
    category: "Pet Owners",
    description: "Pet urine soaks deep into carpet fibers, padding, and subfloor; standard cleaning only addresses surface.",
    keywords: ["can't get rid of dog pee smell", "pet urine smell keeps coming back", "carpet still smells like urine", "old pet stain odor", "cat pee smell won't go away"],
    solutions: [
      { id: "enzymatic-cleaner", name: "Enzymatic Pet Stain Cleaner", keywords: ["Nature's Miracle enzymatic cleaner", "enzyme pet urine cleaner carpet", "bio enzyme pet stain remover"], image: "/images/solutions/enzymatic-cleaner.jpg" },
      { id: "uv-blacklight", name: "UV Blacklight Urine Detector", keywords: ["pet urine blacklight detector", "UV flashlight pet stains", "urine stain finder blacklight"], image: "/images/solutions/uv-blacklight.jpg" },
      { id: "carpet-cleaner-machine", name: "Carpet Cleaner Machine (Pet Formula)", keywords: ["Bissell pet carpet cleaner machine", "portable carpet cleaner pet stains", "pet stain carpet shampooer"], image: "/images/solutions/carpet-cleaner-machine.jpg" },
      { id: "odor-eliminating-spray", name: "Odor-Eliminating Spray", keywords: ["pet odor neutralizer spray", "Zero Odor pet eliminator", "anti-icky poo odor remover"], image: "/images/solutions/odor-eliminating-spray.jpg" }
    ]
  },

  // ==================== CLEANING ====================
  {
    id: "dirty-grout",
    name: "Grout Gets Dirty & Is Impossible to Clean",
    category: "Cleaning",
    description: "Tile grout absorbs dirt, mold, and soap scum deep into its porous surface.",
    keywords: ["grout won't come clean", "dirty grout lines tile", "bathroom grout mold", "kitchen floor grout stained", "grout turns brown"],
    skipRefineStep: true,
    solutions: [
      { id: "grout-cleaning-gel", name: "Grout Cleaning Gel/Spray", keywords: ["Zep grout cleaner brightener", "grout cleaning gel pen", "tile grout whitener spray"], image: "/images/solutions/grout-cleaning-gel.jpg" },
      { id: "electric-grout-brush", name: "Electric Grout Cleaning Brush", keywords: ["electric grout scrubber brush", "power grout cleaner drill attachment", "oscillating grout cleaning tool"], image: "/images/solutions/electric-grout-brush.jpg" },
      { id: "steam-cleaner-grout", name: "Steam Cleaner with Grout Attachment", keywords: ["handheld steam cleaner grout", "steam mop grout brush head", "steam cleaner tile floors"], image: "/images/solutions/steam-cleaner-grout.jpg" },
      { id: "grout-sealer", name: "Grout Sealer (Prevention)", keywords: ["grout sealer applicator", "tile grout waterproof sealer", "grout sealant pen"], image: "/images/solutions/grout-sealer.jpg" }
    ]
  },
  {
    id: "streaky-windows",
    name: "Streaky Windows & Glass Surfaces",
    category: "Cleaning",
    description: "Windows and mirrors end up with visible streaks and haze despite effort.",
    keywords: ["windows still streaky", "can't get streak-free windows", "glass cleaner leaves film", "mirror has streaks", "smudgy windows"],
    skipRefineStep: true,
    solutions: [
      { id: "ammonia-free-cleaner", name: "Ammonia-Free Glass Cleaner", keywords: ["Invisible Glass streak-free spray", "ammonia free glass cleaner", "professional glass cleaner no residue"], image: "/images/solutions/ammonia-free-cleaner.jpg" },
      { id: "glass-microfiber", name: "Glass-Specific Microfiber Cloths", keywords: ["waffle weave glass microfiber towel", "lint-free glass cleaning cloth", "microfiber glass polishing towel"], image: "/images/solutions/glass-microfiber.jpg" },
      { id: "window-squeegee", name: "Window Squeegee", keywords: ["professional window squeegee rubber", "streak-free window squeegee", "shower glass squeegee"], image: "/images/solutions/window-squeegee.jpg" },
      { id: "rubbing-alcohol", name: "Rubbing Alcohol (Film Removal)", keywords: ["isopropyl alcohol glass cleaning", "rubbing alcohol spray bottle", "glass prep cleaner automotive"], image: "/images/solutions/rubbing-alcohol.jpg" }
    ]
  },
  {
    id: "dust-allergies",
    name: "Dust Allergies Triggered by Cleaning",
    category: "Cleaning",
    description: "Dusting and vacuuming actually stir up allergens into the air, making allergy sufferers feel worse.",
    keywords: ["allergies worse after cleaning", "dust mite allergy home", "sneezing while vacuuming", "cleaning triggers allergies", "dust everywhere air quality"],
    skipRefineStep: true,
    solutions: [
      { id: "hepa-vacuum", name: "HEPA Filter Vacuum", keywords: ["HEPA vacuum pet allergies", "sealed HEPA vacuum dust mites", "allergy vacuum cleaner certified"], image: "/images/solutions/hepa-vacuum.jpg" },
      { id: "air-purifier-hepa", name: "Air Purifier with True HEPA", keywords: ["HEPA air purifier dust allergies", "air purifier dust mites bedroom", "allergen air cleaner room"], image: "/images/solutions/air-purifier-hepa.jpg" },
      { id: "dust-trapping-cloths", name: "Microfiber Dust-Trapping Cloths", keywords: ["microfiber duster electrostatic", "damp duster microfiber", "dust-trapping cleaning cloth"], image: "/images/solutions/dust-trapping-cloths.jpg" },
      { id: "allergen-covers", name: "Mattress/Pillow Allergen Covers", keywords: ["dust mite proof mattress cover", "allergen pillow encasement zippered", "hypoallergenic bedding protector"], image: "/images/solutions/allergen-covers.jpg" }
    ]
  },
  {
    id: "soap-scum-hard-water",
    name: "Shower Soap Scum & Hard Water Buildup",
    category: "Cleaning",
    description: "Soap scum and hard water deposits accumulate quickly on shower doors, tiles, and fixtures.",
    keywords: ["soap scum won't come off", "hard water stains shower door", "white buildup shower glass", "calcium deposits bathroom", "shower tile scum"],
    skipRefineStep: true,
    solutions: [
      { id: "soap-scum-spray", name: "Soap Scum Dissolving Spray", keywords: ["Kaboom soap scum remover", "bathroom soap scum spray", "shower scum dissolver cleaner"], image: "/images/solutions/soap-scum-spray.jpg" },
      { id: "daily-shower-spray", name: "Daily Shower Spray (Prevention)", keywords: ["daily shower spray no scrub", "Method daily shower cleaner", "shower spray after every use"], image: "/images/solutions/daily-shower-spray.jpg" },
      { id: "hard-water-remover", name: "Hard Water Stain Remover", keywords: ["CLR calcium lime rust remover", "hard water stain remover glass", "lime scale remover spray"], image: "/images/solutions/hard-water-remover.jpg" },
      { id: "shower-door-squeegee", name: "Shower Door Squeegee", keywords: ["shower door squeegee with hook", "daily squeegee bathroom", "glass squeegee suction cup holder"], image: "/images/solutions/shower-door-squeegee.jpg" }
    ]
  },
  {
    id: "cleaning-takes-too-long",
    name: "Cleaning Takes Too Long / Overwhelming Clutter",
    category: "Cleaning",
    description: "Cleaning feels never-ending; tasks pile up until they require entire weekends.",
    keywords: ["cleaning takes all day", "house never stays clean", "overwhelmed by mess", "don't have time to clean", "cleaning routine exhausted"],
    skipRefineStep: true,
    solutions: [
      { id: "robot-vacuum", name: "Robot Vacuum", keywords: ["robot vacuum automatic scheduling", "Roomba pet hair robot", "self-emptying robot vacuum"], image: "/images/solutions/robot-vacuum.jpg" },
      { id: "multi-surface-cleaner", name: "Multi-Surface Cleaning System", keywords: ["all-in-one floor cleaner mop vacuum", "Bissell CrossWave multi-surface", "wet dry vacuum floor cleaner"], image: "/images/solutions/multi-surface-cleaner.jpg" },
      { id: "microfiber-cleaning-kit", name: "Microfiber Cleaning Tool Kit", keywords: ["microfiber mop system starter kit", "cleaning caddy supplies organizer", "multi-purpose cleaning cloth set"], image: "/images/solutions/microfiber-cleaning-kit.jpg" },
      { id: "scrub-free-cleaner", name: "Scrub-Free Bathroom Cleaner", keywords: ["no scrub bathroom cleaner spray", "toilet bowl cleaner automatic", "hands-free shower cleaner"], image: "/images/solutions/scrub-free-cleaner.jpg" }
    ]
  },
  {
    id: "clothing-stains",
    name: "Clothing & Fabric Stains",
    category: "Cleaning",
    description: "Stains on clothes, upholstery, carpet, or fabric that won't come out with regular washing.",
    keywords: ["stain", "stains", "shirt stain", "clothing stain", "fabric stain", "wine stain", "coffee stain", "grease stain", "oil stain", "grass stain", "blood stain", "ink stain", "laundry stain", "carpet stain", "upholstery stain"],
    skipRefineStep: true,
    solutions: [
      { id: "stain-remover-spray", name: "Stain Remover Spray", keywords: ["stain remover spray", "OxiClean spray", "Shout stain remover"] },
      { id: "stain-stick", name: "Stain Remover Stick", keywords: ["stain stick", "Tide to Go", "portable stain remover"] },
      { id: "enzyme-cleaner", name: "Enzyme-Based Stain Cleaner", keywords: ["enzyme stain remover", "bio enzyme cleaner", "protein stain remover"] },
      { id: "oxygen-bleach", name: "Oxygen Bleach Powder", keywords: ["OxiClean powder", "oxygen bleach", "color safe bleach"] },
      { id: "carpet-stain-remover", name: "Carpet & Upholstery Stain Remover", keywords: ["carpet stain remover", "upholstery cleaner", "fabric stain remover"] },
      { id: "laundry-booster", name: "Laundry Stain Booster", keywords: ["laundry booster", "stain booster pods", "pre-wash stain treatment"] }
    ]
  }
];

// Helper function to find problems matching a user query
export function findProblemsForQuery(query: string): Problem[] {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(w => w.length > 2);
  
  // Category keywords for better matching
  const categoryKeywords: Record<string, string[]> = {
    'Kitchen': ['kitchen', 'counter', 'pantry', 'sink', 'dish', 'food', 'cooking', 'tupperware', 'clutter', 'messy', 'appliance'],
    'Home Office': ['desk', 'office', 'cable', 'work from home', 'wfh', 'computer', 'monitor', 'chair', 'seating', 'ergonomic'],
    'Bedroom': ['bed', 'sleep', 'closet', 'clothes', 'nightstand', 'bedroom'],
    'Bathroom': ['bathroom', 'shower', 'toilet', 'sink', 'hair', 'towel'],
    'Living Room': ['couch', 'sofa', 'tv', 'living room', 'furniture', 'chair', 'armchair', 'seating'],
    'Home Organization': ['storage', 'organize', 'clutter', 'mess', 'rental', 'apartment'],
    'Pet Owners': ['pet', 'dog', 'cat', 'litter', 'fur', 'hair'],
    'Cleaning': ['clean', 'dust', 'grout', 'window', 'mop', 'stain', 'stains', 'dirty', 'remove', 'remover', 'shirt', 'clothes', 'laundry', 'fabric', 'carpet'],
  };
  
  // Score each problem
  const scored = problems.map(problem => {
    let score = 0;
    
    // Check if query matches category keywords (word boundary matching)
    const catKeywords = categoryKeywords[problem.category] || [];
    if (catKeywords.some(kw => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(queryLower);
    })) {
      score += 10; // Strong category match
    }
    
    // Check problem name
    if (problem.name.toLowerCase().includes(queryLower)) {
      score += 8;
    }
    
    // Check problem keywords (word boundary matching)
    problem.keywords.forEach(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'i');
      if (regex.test(queryLower)) {
        score += 5;
      }
      if (words.some(word => {
        const wordRegex = new RegExp(`\\b${word}\\b`, 'i');
        return wordRegex.test(keywordLower);
      })) {
        score += 2;
      }
    });
    
    // Check description
    if (words.some(word => problem.description.toLowerCase().includes(word))) {
      score += 1;
    }
    
    return { problem, score };
  });
  
  // Sort by score and return top matches with score > 0
  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.problem);
}

// Generate mock trend data for a product (fallback when real APIs unavailable)
export function generateMockTrendData(product: { rating?: number; title?: string }): TrendData {
  // Create a seed from the product title for consistent results
  const seed = product.title ? product.title.length : Math.random() * 100;
  const pseudoRandom = (offset: number) => {
    const x = Math.sin(seed + offset) * 10000;
    return x - Math.floor(x);
  };

  // Base score from rating, with some variance
  const baseRating = product.rating || 4;
  const ratingComponent = (baseRating / 5) * 6;
  const randomComponent = pseudoRandom(1) * 4;
  const trendScore = Math.min(9.9, Math.max(6.0, ratingComponent + randomComponent));

  // Generate platform-specific metrics (using old platform names for backward compatibility)
  const platforms = {
    tiktok: Math.floor(pseudoRandom(2) * 150) + 50,
    instagram: Math.floor(pseudoRandom(3) * 200) + 75,
    reddit: Math.floor(pseudoRandom(4) * 400) + 100,
    youtube: Math.floor(pseudoRandom(5) * 80) + 20
  };

  // Possible trend reasons
  const trendReasonOptions = [
    { platform: "TikTok", text: "videos this week" },
    { platform: "YouTube", text: "reviews this month" },
    { platform: "Reddit", text: "recommendations in home subs" },
    { platform: "Pinterest", text: "saves this week" },
    { platform: "Instagram", text: "posts featuring this product" }
  ];

  // Select 2 random reasons
  const reasons: TrendReason[] = [];
  const shuffled = [...trendReasonOptions].sort(() => pseudoRandom(6) - 0.5);
  for (let i = 0; i < 2; i++) {
    reasons.push({
      platform: shuffled[i].platform,
      count: Math.floor(pseudoRandom(7 + i) * 100) + 20,
      text: shuffled[i].text
    });
  }

  // Social proof summaries
  const summaries = [
    "Users love the easy assembly and space-saving design.",
    "Frequently recommended for small apartments and rentals.",
    "Top pick for maximizing vertical storage space.",
    "Popular for its durability and modern aesthetic.",
    "Highly rated for quality-to-price ratio.",
    "A favorite among organization enthusiasts.",
    "Praised for solving common household frustrations.",
    "Trending among home improvement communities."
  ];

  const summaryIndex = Math.floor(pseudoRandom(9) * summaries.length);

  return {
    trendScore: parseFloat(trendScore.toFixed(1)),
    trendReasons: reasons,
    socialProofSummary: summaries[summaryIndex],
    trendLevel: trendScore >= 8.5 ? "hot" : trendScore >= 7.0 ? "warm" : "stable",
    platforms
  };
}

// New function to get real trend data using social APIs
export async function getRealTrendData(product: { rating?: number; title?: string }): Promise<TrendData> {
  if (!product.title) {
    return generateMockTrendData(product);
  }

  // Import the trend aggregator (dynamic import to avoid SSR issues)
  try {
    const { getQuickTrendScore, getCachedTrendData, setCachedTrendData } = 
      await import('./api/trendAggregator');

    // Check cache first
    const cached = getCachedTrendData(product.title);
    if (cached) {
      // Convert aggregated data to legacy format
      return {
        trendScore: cached.overallTrendScore,
        trendReasons: cached.trendReasons.map(reason => ({
          platform: reason.platform,
          count: reason.data?.totalViews || reason.data?.totalSaves || reason.data?.totalPosts || 0,
          text: reason.reason
        })),
        socialProofSummary: cached.socialProofSummary,
        trendLevel: cached.trendLevel,
        platforms: {
          tiktok: 0, // Legacy field, no longer used
          instagram: Math.round(cached.platforms.pinterest * 1.2), // Map Pinterest to Instagram for UI
          reddit: cached.platforms.reddit,
          youtube: cached.platforms.youtube
        }
      };
    }

    // Get quick trend score for faster response
    const trendScore = await getQuickTrendScore(product.title);
    
    // Create simplified trend data based on quick score
    const trendLevel: 'hot' | 'warm' | 'stable' = 
      trendScore >= 7.5 ? 'hot' : 
      trendScore >= 5.5 ? 'warm' : 'stable';

    const platforms = {
      tiktok: 0,
      instagram: Math.round(trendScore * 15),
      reddit: Math.round(trendScore * 20),
      youtube: Math.round(trendScore * 10)
    };

    const trendData: TrendData = {
      trendScore,
      trendReasons: [
        {
          platform: 'Social Media',
          count: platforms.reddit + platforms.youtube,
          text: 'discussions and reviews across platforms'
        }
      ],
      socialProofSummary: trendLevel === 'hot' 
        ? `${product.title.split(' ').slice(0, 3).join(' ')} is trending with strong social engagement.`
        : trendLevel === 'warm'
        ? `${product.title.split(' ').slice(0, 3).join(' ')} shows consistent interest across social platforms.`
        : `${product.title.split(' ').slice(0, 3).join(' ')} has stable social presence.`,
      trendLevel,
      platforms
    };

    return trendData;

  } catch (error) {
    console.warn('Failed to get real trend data, using mock data:', error);
    return generateMockTrendData(product);
  }
}

// Get all unique categories
export function getCategories(): string[] {
  return [...new Set(problems.map(p => p.category))];
}

// Get problems by category
export function getProblemsByCategory(category: string): Problem[] {
  return problems.filter(p => p.category === category);
}

// Get default filters for a category when problem doesn't have specific filters
export function getDefaultFiltersForCategory(category: string): FilterOption[] {
  const defaultFilters: Record<string, FilterOption[]> = {
    'Kitchen': [
      {
        id: "style",
        label: "Style",
        type: "single",
        values: [
          { id: "modern", label: "Modern", keywords: ["modern", "contemporary"] },
          { id: "rustic", label: "Rustic", keywords: ["rustic", "farmhouse"] },
          { id: "industrial", label: "Industrial", keywords: ["industrial", "metal"] },
          { id: "minimalist", label: "Minimalist", keywords: ["minimalist", "simple"] }
        ]
      }
    ],
    'Home Office': [
      {
        id: "budget",
        label: "Budget",
        type: "single",
        values: [
          { id: "under-50", label: "Under $50", keywords: ["budget", "affordable"] },
          { id: "50-150", label: "$50-150", keywords: [] },
          { id: "150-plus", label: "$150+", keywords: ["premium"] }
        ]
      }
    ],
    'Bedroom': [
      {
        id: "style",
        label: "Style",
        type: "single",
        values: [
          { id: "modern", label: "Modern", keywords: ["modern"] },
          { id: "cozy", label: "Cozy", keywords: ["cozy", "soft", "comfortable"] },
          { id: "minimalist", label: "Minimalist", keywords: ["minimalist", "simple"] }
        ]
      }
    ],
    'Bathroom': [
      {
        id: "material",
        label: "Material",
        type: "single",
        values: [
          { id: "plastic", label: "Plastic", keywords: ["plastic", "acrylic"] },
          { id: "metal", label: "Metal", keywords: ["metal", "stainless", "chrome"] },
          { id: "bamboo", label: "Bamboo/Wood", keywords: ["bamboo", "wood", "natural"] }
        ]
      }
    ],
    'Pet Owners': [
      {
        id: "pet-size",
        label: "Pet Size",
        type: "single",
        values: [
          { id: "small", label: "Small Pet", keywords: ["small", "cat", "small dog"] },
          { id: "medium", label: "Medium Pet", keywords: ["medium"] },
          { id: "large", label: "Large Pet", keywords: ["large", "big dog"] }
        ]
      }
    ],
    'Cleaning': [
      {
        id: "effort",
        label: "Cleaning Style",
        type: "single",
        values: [
          { id: "quick", label: "Quick & Easy", keywords: ["quick", "easy", "spray"] },
          { id: "deep", label: "Deep Clean", keywords: ["deep", "thorough", "professional"] },
          { id: "automatic", label: "Automatic", keywords: ["robot", "automatic", "self"] }
        ]
      }
    ],
    'Living Room': [
      {
        id: "style",
        label: "Style",
        type: "single",
        values: [
          { id: "modern", label: "Modern", keywords: ["modern", "contemporary"] },
          { id: "comfortable", label: "Comfortable", keywords: ["cozy", "soft", "plush"] },
          { id: "space-saving", label: "Space-Saving", keywords: ["compact", "small", "space saving"] }
        ]
      }
    ],
    'Home Organization': [
      {
        id: "installation",
        label: "Installation",
        type: "single",
        values: [
          { id: "no-drill", label: "No Drilling", keywords: ["no drill", "damage free", "rental friendly"] },
          { id: "wall-mount", label: "Wall Mount", keywords: ["wall mount", "permanent"] },
          { id: "freestanding", label: "Freestanding", keywords: ["freestanding", "portable"] }
        ]
      }
    ]
  };
  
  return defaultFilters[category] || defaultFilters['Kitchen'];
}