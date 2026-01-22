import fs from 'fs';

// Read the matching results
const matches = JSON.parse(fs.readFileSync('./solution-image-matches.json', 'utf8')).matches;

// Read mockData.ts
let mockDataContent = fs.readFileSync('./lib/mockData.ts', 'utf8');

console.log(`Updating ${matches.length} solution images in mockData.ts...\\n`);

let updatedCount = 0;

// Update each solution with its image path
matches.forEach(match => {
  // Escape special characters in the solution name for regex
  const escapedName = match.solutionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Look for the exact solution pattern and add image if not present
  const solutionPattern = new RegExp(
    `\\{ id: "${match.solutionId}", name: "${escapedName}", keywords: (\\[[^\\]]*\\])( \\})?`,
    'g'
  );
  
  const replacement = `{ id: "${match.solutionId}", name: "${match.solutionName}", keywords: $1, image: "${match.imagePath}" }`;
  
  const beforeCount = (mockDataContent.match(solutionPattern) || []).length;
  if (beforeCount > 0) {
    mockDataContent = mockDataContent.replace(solutionPattern, replacement);
    console.log(`✅ Updated: ${match.solutionId}`);
    updatedCount++;
  } else {
    console.log(`⚠️  Pattern not found: ${match.solutionId}`);
    
    // Try a simpler pattern without escaping the name
    const simplePattern = new RegExp(
      `\\{ id: "${match.solutionId}", name: "[^"]+", keywords: \\[[^\\]]*\\] \\}`,
      'g'
    );
    
    if (mockDataContent.match(simplePattern)) {
      const simpleReplacement = mockDataContent.replace(simplePattern, 
        `{ id: "${match.solutionId}", name: "${match.solutionName}", keywords: ${match.solutionId === 'adhesive-wall-hooks' ? '["command hooks heavy duty", "adhesive hooks no damage", "peel and stick wall hooks"]' : '[...]'}, image: "${match.imagePath}" }`
      );
      console.log(`🔧 Found simpler pattern for: ${match.solutionId}`);
    }
  }
});

console.log(`\\n📊 Updated ${updatedCount} out of ${matches.length} solutions`);

// Write the updated content back
fs.writeFileSync('./lib/mockData.ts', mockDataContent);
console.log('✅ mockData.ts updated successfully!');