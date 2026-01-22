import fs from 'fs';

// Read the matching results
const { matches } = JSON.parse(fs.readFileSync('./solution-image-matches.json', 'utf8'));

// Read mockData.ts content  
let content = fs.readFileSync('./lib/mockData.ts', 'utf8');

console.log(`Adding local images for ${matches.length} solutions...\\n`);

let updated = 0;

// For each match, update with local image path
matches.forEach(match => {
  const solutionId = match.solutionId;
  const localImagePath = match.imagePath;
  
  // Pattern 1: Replace existing Unsplash image
  const unsplashPattern = new RegExp(
    `(\\{ id: "${solutionId}", name: "[^"]*", keywords: \\[[^\\]]*\\]), image: "https://images\\.unsplash\\.com/[^"]*"`,
    'g'
  );
  
  if (content.match(unsplashPattern)) {
    content = content.replace(unsplashPattern, `$1, image: "${localImagePath}"`);
    console.log(`✅ Replaced Unsplash image: ${solutionId}`);
    updated++;
    return;
  }
  
  // Pattern 2: Add image to solution without one
  const noImagePattern = new RegExp(
    `(\\{ id: "${solutionId}", name: "[^"]*", keywords: \\[[^\\]]*\\]) \\}`,
    'g'
  );
  
  if (content.match(noImagePattern)) {
    content = content.replace(noImagePattern, `$1, image: "${localImagePath}" }`);
    console.log(`✅ Added local image: ${solutionId}`);
    updated++;
    return;
  }
  
  // Pattern 3: Add image to solution with comma
  const commaPattern = new RegExp(
    `(\\{ id: "${solutionId}", name: "[^"]*", keywords: \\[[^\\]]*\\]) \\},`,
    'g'
  );
  
  if (content.match(commaPattern)) {
    content = content.replace(commaPattern, `$1, image: "${localImagePath}" },`);
    console.log(`✅ Added local image (comma): ${solutionId}`);
    updated++;
    return;
  }
  
  console.log(`⚠️  No pattern match: ${solutionId}`);
});

// Write the updated content
fs.writeFileSync('./lib/mockData.ts', content);

console.log(`\\n📊 Updated ${updated} solutions with local images!`);