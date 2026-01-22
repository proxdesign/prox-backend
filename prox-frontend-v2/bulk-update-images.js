import fs from 'fs';

// Read the matching results
const { matches } = JSON.parse(fs.readFileSync('./solution-image-matches.json', 'utf8'));

// Read mockData.ts content  
let content = fs.readFileSync('./lib/mockData.ts', 'utf8');

console.log(`Bulk updating images for ${matches.length} solutions...\\n`);

let updated = 0;
const failed = [];

// Create edits for each match that doesn't already have an image
matches.forEach(match => {
  const solutionId = match.solutionId;
  const imagePath = match.imagePath;
  
  // Skip if already has image
  if (content.includes(`id: "${solutionId}"`) && content.includes(`image: "`)) {
    console.log(`⏭️  Skipping ${solutionId} - already has image`);
    return;
  }
  
  // Find pattern: { id: "solution-id", name: "...", keywords: [...] }
  // Replace with: { id: "solution-id", name: "...", keywords: [...], image: "/path" }
  
  const patterns = [
    // Pattern 1: ends with } (no comma)
    {
      find: new RegExp(`(\\{ id: "${solutionId}", name: "[^"]*", keywords: \\[[^\\]]*\\]) \\}`, 'g'),
      replace: `$1, image: "${imagePath}" }`
    },
    // Pattern 2: ends with },
    {
      find: new RegExp(`(\\{ id: "${solutionId}", name: "[^"]*", keywords: \\[[^\\]]*\\]) \\},`, 'g'),
      replace: `$1, image: "${imagePath}" },`
    }
  ];
  
  let patternMatched = false;
  
  for (const pattern of patterns) {
    if (content.match(pattern.find)) {
      content = content.replace(pattern.find, pattern.replace);
      console.log(`✅ Updated: ${solutionId}`);
      updated++;
      patternMatched = true;
      break;
    }
  }
  
  if (!patternMatched) {
    console.log(`⚠️  No pattern match: ${solutionId}`);
    failed.push(solutionId);
  }
});

// Write the updated content
fs.writeFileSync('./lib/mockData.ts', content);

console.log(`\\n📊 Summary:`);
console.log(`✅ Updated: ${updated}`);
console.log(`⚠️  Failed: ${failed.length}`);

if (failed.length > 0) {
  console.log(`\\nFailed to update: ${failed.slice(0, 10).join(', ')}${failed.length > 10 ? ` (and ${failed.length - 10} more)` : ''}`);
}

console.log(`\\n✅ Bulk update completed!`);