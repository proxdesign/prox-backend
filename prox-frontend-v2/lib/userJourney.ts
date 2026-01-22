export interface UserJourney {
  sessionId: string;
  startTime: Date;
  mode: 'problem' | 'explore' | null;
  problemText: string | null;
  problemCategory: string | null;
  solutionsShown: string[];
  solutionsTryAgainCount: number;
  solutionSelected: string | null;
  stylesShown: string[];
  stylesTryAgainCount: number;
  styleSelected: string | null;
  productsViewed: string[];
  productClicked: string | null;
}

// Generate unique session ID
export function createSession(): UserJourney {
  return {
    sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: new Date(),
    mode: null,
    problemText: null,
    problemCategory: null,
    solutionsShown: [],
    solutionsTryAgainCount: 0,
    solutionSelected: null,
    stylesShown: [],
    stylesTryAgainCount: 0,
    styleSelected: null,
    productsViewed: [],
    productClicked: null,
  };
}

// Save journey to localStorage
export function saveJourney(journey: UserJourney): void {
  if (typeof window === 'undefined') return;
  
  const journeys = getJourneys();
  const existingIndex = journeys.findIndex(j => j.sessionId === journey.sessionId);
  if (existingIndex >= 0) {
    journeys[existingIndex] = journey;
  } else {
    journeys.push(journey);
  }
  localStorage.setItem('userJourneys', JSON.stringify(journeys));
}

// Get all journeys
export function getJourneys(): UserJourney[] {
  if (typeof window === 'undefined') return [];
  const data = localStorage.getItem('userJourneys');
  return data ? JSON.parse(data) : [];
}

// Export as CSV for analysis
export function exportJourneysAsCSV(): string {
  const journeys = getJourneys();
  if (journeys.length === 0) return '';
  
  const headers = Object.keys(journeys[0]).join(',');
  const rows = journeys.map(j => Object.values(j).map(v => 
    typeof v === 'object' ? JSON.stringify(v) : v
  ).join(','));
  return [headers, ...rows].join('\n');
}