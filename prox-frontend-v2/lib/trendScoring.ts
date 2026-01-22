// Category-specific trend weights (redistributed without Houzz)
export const categoryTrendWeights: Record<string, Record<string, number>> = {
  'Living Room': {
    pinterest: 0.55,
    google: 0.25,
    reddit: 0.15,
    amazon: 0.05,
  },
  'Bedroom': {
    pinterest: 0.50,
    reddit: 0.25,
    google: 0.20,
    amazon: 0.05,
  },
  'Bathroom': {
    pinterest: 0.55,
    reddit: 0.20,
    google: 0.20,
    amazon: 0.05,
  },
  'Home Organization': {
    pinterest: 0.55,
    reddit: 0.25,
    google: 0.15,
    amazon: 0.05,
  },
  'Home Office': {
    pinterest: 0.25,
    reddit: 0.35,
    youtube: 0.25,
    google: 0.10,
    amazon: 0.05,
  },
  'Kitchen': {
    pinterest: 0.35,
    reddit: 0.25,
    amazon: 0.25,
    google: 0.15,
  },
  'Cleaning': {
    reddit: 0.40,
    amazon: 0.35,
    google: 0.20,
    pinterest: 0.05,
  },
  'Pet Owners': {
    reddit: 0.45,
    youtube: 0.25,
    amazon: 0.20,
    pinterest: 0.10,
  },
};

// Default weights when category not specified
export const defaultTrendWeights = {
  google: 0.35,
  youtube: 0.25,
  pinterest: 0.25,
  reddit: 0.15,
};

// Get trend weights for a specific category
export function getTrendWeights(category?: string): Record<string, number> {
  if (category && categoryTrendWeights[category]) {
    return categoryTrendWeights[category];
  }
  return defaultTrendWeights;
}

// Calculate weighted trend score
export function calculateWeightedTrendScore(
  platformScores: Record<string, number>,
  category?: string
): number {
  const weights = getTrendWeights(category);
  let weightedScore = 0;
  let totalWeight = 0;

  for (const [platform, weight] of Object.entries(weights)) {
    if (platformScores[platform] !== undefined) {
      weightedScore += platformScores[platform] * weight;
      totalWeight += weight;
    }
  }

  // Normalize if not all platforms are available
  return totalWeight > 0 ? (weightedScore / totalWeight) * 10 : 0;
}