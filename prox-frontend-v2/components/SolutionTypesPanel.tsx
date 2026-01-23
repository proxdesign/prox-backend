'use client';

import { Loader2 } from 'lucide-react';

interface SolutionType {
  id: string;
  name: string;
  icon?: string;
  image?: string;
  description?: string;
  keywords?: string[];
}

interface SolutionTypesPanelProps {
  solutions: SolutionType[];
  onSolutionClick: (solution: SolutionType) => void;
  contextSummary?: string;
  isLoading?: boolean;
}

export default function SolutionTypesPanel({ 
  solutions, 
  onSolutionClick, 
  contextSummary,
  isLoading = false 
}: SolutionTypesPanelProps) {

  // Map solution types to images (reusing the logic from SolutionGrid)
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
    <div data-testid="solutions-panel" className="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col h-fit max-h-[calc(100vh-280px)]">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Explore Solutions</h3>
        <p className="text-sm text-gray-600">or keep chatting to narrow down</p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-oak-500 animate-spin" />
            <p className="text-sm text-gray-600">Finding solutions...</p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && (!solutions || solutions.length === 0) && (
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl">💡</span>
            </div>
            <p className="text-sm text-gray-600 mb-2">No solutions yet</p>
            <p className="text-xs text-gray-500">Start a conversation to see relevant solutions</p>
          </div>
        </div>
      )}

      {/* Solutions List */}
      {!isLoading && solutions && solutions.length > 0 && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {solutions.map((solution) => (
              <button
                key={solution.id}
                data-testid="solution-card"
                onClick={() => onSolutionClick(solution)}
                className="w-full p-4 bg-gray-50 hover:bg-oak-50 border border-gray-200 hover:border-oak-200 rounded-xl transition-all duration-200 flex items-start gap-4 text-left group"
              >
                {/* Solution Image */}
                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
                  <img
                    src={solution.image || getSolutionImage(solution.name)}
                    alt={solution.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/images/solutions/multi-compartment-organizer.jpg';
                    }}
                  />
                </div>

                {/* Solution Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                    {solution.name}
                  </h4>
                  {solution.description && (
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {solution.description}
                    </p>
                  )}
                </div>

                {/* Chevron */}
                <div className="flex-shrink-0 mt-1">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-oak-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Footer with Context Summary */}
      {contextSummary && (
        <div className="p-4 border-t border-gray-100 flex-shrink-0">
          <p className="text-xs text-gray-500">{contextSummary}</p>
        </div>
      )}
    </div>
  );
}