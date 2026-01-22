import fs from 'fs';

// Read the matching results  
const matches = JSON.parse(fs.readFileSync('./solution-image-matches.json', 'utf8')).matches;

// Read mockData.ts
let content = fs.readFileSync('./lib/mockData.ts', 'utf8');

console.log(`Adding image properties to ${matches.length} solutions...\\n`);

let updated = 0;

// For each match, find and replace the solution object
matches.forEach(match => {
  // Find the pattern: { id: "solution-id", name: "Solution Name", keywords: [...] }
  // And replace with: { id: "solution-id", name: "Solution Name", keywords: [...], image: "/path/to/image.jpg" }
  
  const idPattern = `{ id: "${match.solutionId}"`;
  const imageProperty = `, image: "${match.imagePath}"`;
  
  // Find the line containing this solution ID
  const lines = content.split('\\n');
  let foundLine = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(idPattern) && !line.includes('image:')) {
      // This line contains our solution and doesn't already have an image
      
      // Find the closing brace of this object
      if (line.includes(' }')) {
        // Single line object - replace the closing brace
        lines[i] = line.replace(' }', `${imageProperty} }`);
        console.log(`✅ Updated: ${match.solutionId}`);
        updated++;
        break;
      } else if (line.includes('],')) {
        // Multi-line object ending with keywords array
        lines[i] = line.replace('],', `]${imageProperty} }`);
        console.log(`✅ Updated: ${match.solutionId}`);
        updated++;
        break;
      }
    }
  }
  
  if (foundLine === -1) {
    console.log(`⚠️  Could not find: ${match.solutionId}`);
  }
  
  content = lines.join('\\n');
});

console.log(`\\n📊 Updated ${updated} solutions`);

// Write back to file
fs.writeFileSync('./lib/mockData.ts', content);
console.log('✅ File updated successfully!');