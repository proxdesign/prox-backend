import fs from 'fs';
import path from 'path';

// Read mockData.ts to extract solution IDs
const mockDataPath = './lib/mockData.ts';
const solutionImagesDir = './public/images/solutions/';

function extractSolutionIds() {
  const content = fs.readFileSync(mockDataPath, 'utf8');
  const solutions = [];
  
  // Find all solution objects within solutions arrays
  const solutionRegex = /{ id: "([^"]+)", name: "([^"]+)"/g;
  let match;
  
  // Skip filter values by looking only in solutions arrays context
  const lines = content.split('\n');
  let inSolutions = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('solutions: [')) {
      inSolutions = true;
      continue;
    }
    
    if (inSolutions && line.trim() === ']') {
      inSolutions = false;
      continue;
    }
    
    if (inSolutions && line.includes('{ id: "')) {
      const match = line.match(/{ id: "([^"]+)", name: "([^"]+)"/);
      if (match) {
        solutions.push({
          id: match[1],
          name: match[2]
        });
      }
    }
  }
  
  return solutions;
}

function getAvailableImages() {
  const images = [];
  const files = fs.readdirSync(solutionImagesDir);
  
  files.forEach(file => {
    if (file.endsWith('.jpg') || file.endsWith('.png')) {
      const imageName = file.replace(/\.(jpg|png)$/, '');
      images.push({
        filename: file,
        id: imageName
      });
    }
  });
  
  return images;
}

function matchSolutionsToImages() {
  const solutions = extractSolutionIds();
  const images = getAvailableImages();
  const matches = [];
  const unmatched = [];
  
  console.log(`Found ${solutions.length} solutions in mockData.ts`);
  console.log(`Found ${images.length} images in solutions directory`);
  console.log('\\n=== MATCHING SOLUTIONS TO IMAGES ===\\n');
  
  solutions.forEach(solution => {
    const matchingImage = images.find(img => img.id === solution.id);
    
    if (matchingImage) {
      matches.push({
        solutionId: solution.id,
        solutionName: solution.name,
        imageFile: matchingImage.filename,
        imagePath: `/images/solutions/${matchingImage.filename}`
      });
      console.log(`✅ ${solution.id} -> ${matchingImage.filename}`);
    } else {
      unmatched.push({
        solutionId: solution.id,
        solutionName: solution.name
      });
      console.log(`❌ ${solution.id} (${solution.name}) - NO IMAGE`);
    }
  });
  
  console.log(`\\n=== SUMMARY ===`);
  console.log(`✅ Matched: ${matches.length}`);
  console.log(`❌ Unmatched: ${unmatched.length}`);
  
  // Check for unused images
  const usedImageIds = matches.map(m => m.solutionId);
  const unusedImages = images.filter(img => !usedImageIds.includes(img.id));
  
  if (unusedImages.length > 0) {
    console.log(`\\n=== UNUSED IMAGES (${unusedImages.length}) ===`);
    unusedImages.forEach(img => {
      console.log(`🗂️  ${img.filename} (${img.id})`);
    });
  }
  
  return { matches, unmatched, unusedImages };
}

// Run the matching
const result = matchSolutionsToImages();

// Save results to JSON for use in update script
fs.writeFileSync('./solution-image-matches.json', JSON.stringify(result, null, 2));
console.log('\\n📄 Results saved to solution-image-matches.json');