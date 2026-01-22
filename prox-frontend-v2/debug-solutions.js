import { problems } from './lib/mockData.js';

console.log('=== DEBUGGING SOLUTION IMAGES ===\\n');

// Check first few problems and their solutions
problems.slice(0, 3).forEach(problem => {
  console.log(`Problem: ${problem.name}`);
  console.log(`Solutions with images:`);
  problem.solutions.forEach(solution => {
    console.log(`  - ${solution.name}: ${solution.image || 'NO IMAGE'}`);
  });
  console.log('');
});

// Count solutions with vs without images
let withImages = 0;
let withoutImages = 0;
let totalSolutions = 0;

problems.forEach(problem => {
  problem.solutions.forEach(solution => {
    totalSolutions++;
    if (solution.image) {
      withImages++;
    } else {
      withoutImages++;
    }
  });
});

console.log('=== SUMMARY ===');
console.log(`Total solutions: ${totalSolutions}`);
console.log(`With images: ${withImages}`);
console.log(`Without images: ${withoutImages}`);
console.log(`Percentage with images: ${Math.round((withImages/totalSolutions) * 100)}%`);