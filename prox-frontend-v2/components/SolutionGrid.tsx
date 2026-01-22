'use client';

interface Solution {
  id: string;
  name: string;
  description?: string;
  keywords?: string[];
  problemId?: string;
  problemName?: string;
}

interface SolutionGridProps {
  solutions: Solution[];
  onSolutionClick: (solution: Solution) => void;
  title?: string;
}

export default function SolutionGrid({ solutions, onSolutionClick, title }: SolutionGridProps) {
  if (!solutions || solutions.length === 0) return null;

  // Map solution types to images
  const getSolutionImage = (name: string): string => {
    const lower = name.toLowerCase();
    
    // Counter/Kitchen Organization
    if (lower.includes('counter') && lower.includes('organizer')) return '/images/solutions/counter-shelf-organizer.jpg';
    if (lower.includes('tiered') && lower.includes('organizer')) return '/images/solutions/tiered-counter-organizer.jpg';
    if (lower.includes('lazy susan')) return '/images/solutions/lazy-susan.jpg';
    if (lower.includes('spice')) return '/images/solutions/tiered-shelf-riser.jpg';
    
    // Cabinet/Storage
    if (lower.includes('cabinet') && lower.includes('organizer')) return '/images/solutions/cabinet-door-organizer.jpg';
    if (lower.includes('pull') && lower.includes('out')) return '/images/solutions/pull-out-organizer.jpg';
    if (lower.includes('under sink')) return '/images/solutions/expandable-under-sink-shelf.jpg';
    if (lower.includes('cabinet') && lower.includes('door')) return '/images/solutions/over-door-organizers.jpg';
    
    // Shelving
    if (lower.includes('shelf') && lower.includes('organizer')) return '/images/solutions/corner-shelf-organizer.jpg';
    if (lower.includes('floating') && lower.includes('shelf')) return '/images/solutions/bathroom-floating-shelves.jpg';
    if (lower.includes('wall') && lower.includes('shelf')) return '/images/solutions/wall-mounted-organizer.jpg';
    if (lower.includes('shelf') && lower.includes('riser')) return '/images/solutions/tiered-shelf-riser.jpg';
    
    // Hooks/Wall Storage
    if (lower.includes('wall') && lower.includes('hook')) return '/images/solutions/adhesive-wall-hooks.jpg';
    if (lower.includes('over') && lower.includes('door')) return '/images/solutions/over-door-organizers.jpg';
    if (lower.includes('under') && lower.includes('cabinet')) return '/images/solutions/under-cabinet-hooks.jpg';
    if (lower.includes('coat') && lower.includes('hook')) return '/images/solutions/coat-hooks-shelf.jpg';
    
    // Drawer Organization
    if (lower.includes('drawer') && lower.includes('divider')) return '/images/solutions/container-drawer-dividers.jpg';
    if (lower.includes('drawer') && lower.includes('organizer')) return '/images/solutions/multi-compartment-organizer.jpg';
    
    // Bathroom
    if (lower.includes('bathroom') && lower.includes('organizer')) return '/images/solutions/over-door-bathroom-organizer.jpg';
    if (lower.includes('shower') && lower.includes('caddy')) return '/images/solutions/hanging-showerhead-caddy.jpg';
    if (lower.includes('toilet') && lower.includes('storage')) return '/images/solutions/over-toilet-shelf.jpg';
    if (lower.includes('medicine') && lower.includes('cabinet')) return '/images/solutions/wall-medicine-cabinet.jpg';
    
    // Closet/Bedroom
    if (lower.includes('closet') && lower.includes('organizer')) return '/images/solutions/hanging-closet-shelves.jpg';
    if (lower.includes('closet') && lower.includes('divider')) return '/images/solutions/closet-shelf-dividers.jpg';
    if (lower.includes('clothes') && lower.includes('rack')) return '/images/solutions/freestanding-clothes-rack.jpg';
    if (lower.includes('hangers')) return '/images/solutions/velvet-hangers.jpg';
    
    // Desk/Office
    if (lower.includes('desk') && lower.includes('organizer')) return '/images/solutions/desktop-organizer.jpg';
    if (lower.includes('cable') && lower.includes('management')) return '/images/solutions/cable-management-box.jpg';
    if (lower.includes('monitor') && lower.includes('stand')) return '/images/solutions/monitor-stand-storage.jpg';
    if (lower.includes('laptop') && lower.includes('stand')) return '/images/solutions/laptop-stand.jpg';
    
    // Storage Containers/Bins
    if (lower.includes('storage') && lower.includes('bin')) return '/images/solutions/stackable-totes.jpg';
    if (lower.includes('storage') && lower.includes('container')) return '/images/solutions/clear-food-containers.jpg';
    if (lower.includes('fabric') && lower.includes('storage')) return '/images/solutions/fabric-storage-cubes.jpg';
    if (lower.includes('vacuum') && lower.includes('storage')) return '/images/solutions/vacuum-storage-bags.jpg';
    
    // Kitchen Specific
    if (lower.includes('dish') && lower.includes('rack')) return '/images/solutions/two-tier-dish-rack.jpg';
    if (lower.includes('cutting') && lower.includes('board')) return '/images/solutions/over-sink-cutting-board.jpg';
    if (lower.includes('lid') && lower.includes('organizer')) return '/images/solutions/lid-organizer.jpg';
    if (lower.includes('appliance') && lower.includes('garage')) return '/images/solutions/appliance-garage.jpg';
    
    // Pet Organization
    if (lower.includes('pet') && lower.includes('food')) return '/images/solutions/elevated-feeding-station.jpg';
    if (lower.includes('pet') && lower.includes('toy')) return '/images/solutions/toy-storage-bins.jpg';
    if (lower.includes('litter')) return '/images/solutions/litter-disposal-pail.jpg';
    
    // General fallbacks based on type
    if (lower.includes('organizer')) return '/images/solutions/multi-compartment-organizer.jpg';
    if (lower.includes('shelf')) return '/images/solutions/freestanding-shelves.jpg';
    if (lower.includes('storage')) return '/images/solutions/storage-ottoman.jpg';
    if (lower.includes('rack')) return '/images/solutions/freestanding-clothes-rack.jpg';
    if (lower.includes('cabinet')) return '/images/solutions/slim-bathroom-cabinet.jpg';
    if (lower.includes('hook')) return '/images/solutions/adhesive-wall-hooks.jpg';
    if (lower.includes('basket')) return '/images/solutions/stackable-bathroom-bins.jpg';
    if (lower.includes('container')) return '/images/solutions/clear-food-containers.jpg';
    
    // Default fallback
    return '/images/solutions/multi-compartment-organizer.jpg';
  };

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-medium text-gray-800 mb-4">{title}</h3>
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {solutions.map((solution) => (
          <button
            key={solution.id}
            onClick={() => onSolutionClick(solution)}
            className="flex flex-col items-center p-3 bg-white border-2 border-gray-200 rounded-xl hover:border-[#8B7355] hover:shadow-md transition-all duration-200 group overflow-hidden"
          >
            {/* Solution Image */}
            <div className="w-16 h-16 mb-3 rounded-lg overflow-hidden group-hover:scale-110 transition-transform duration-200 flex-shrink-0">
              <img
                src={getSolutionImage(solution.name)}
                alt={solution.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to a default image if the specific image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = '/images/solutions/multi-compartment-organizer.jpg';
                }}
              />
            </div>
            
            {/* Solution Name */}
            <span className="font-medium text-gray-800 text-center text-xs leading-tight line-clamp-2">
              {solution.name}
            </span>
            
            {/* Description (shorter to fit with image) */}
            {solution.description && (
              <span className="text-xs text-gray-500 mt-1 text-center line-clamp-1">
                {solution.description}
              </span>
            )}
          </button>
        ))}
      </div>
      
      <p className="text-sm text-gray-600 mt-4 text-center">
        Click a solution type above to see products, or tell me more about your space in the chat.
      </p>
    </div>
  );
}