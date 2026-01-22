import { writeFile, mkdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import Replicate from 'replicate';
import path from 'path';

const replicate = new Replicate();

// Output directories
const OUTPUT_DIR = './public/images/solutions';
const RESULTS_FILE = './scripts/generated-images.json';

// Read solutions from the CSV
async function readSolutions() {
  const csvPath = './solution-images-complete.csv';
  const content = await readFile(csvPath, 'utf-8');
  const lines = content.trim().split('\n');
  
  const solutions = [];
  for (let i = 1; i < lines.length; i++) {
    // Handle CSV parsing with potential commas in fields
    const line = lines[i];
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 4) {
      solutions.push({
        category: values[0],
        problemName: values[1],
        solutionId: values[2],
        solutionName: values[3],
        keywords: values[4] || ''
      });
    }
  }
  return solutions;
}

// Generate appropriate prompt based on category
function generatePrompt(solutionName, category) {
  const categoryContext = {
    'Home Organization': 'home storage product',
    'Kitchen': 'kitchen product',
    'Home Office': 'office product',
    'Living Room': 'home furniture product',
    'Bedroom': 'bedroom product',
    'Bathroom': 'bathroom product',
    'Pet Owners': 'pet product',
    'Cleaning': 'cleaning product'
  };
  
  const context = categoryContext[category] || 'home product';
  
  return `${solutionName}, ${context}, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality`;
}

// Generate image using Replicate
async function generateImage(prompt) {
  const input = {
    prompt: prompt,
    prompt_upsampling: true
  };

  const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });
  
  // Handle different output formats
  if (typeof output === 'string') {
    return output;
  } else if (output && typeof output.url === 'function') {
    return output.url();
  } else if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }
  throw new Error('Unexpected output format from Replicate');
}

// Download image from URL
async function downloadImage(url, solutionId) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const filename = `${solutionId}.jpg`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await writeFile(filepath, Buffer.from(buffer));
  return `/images/solutions/${filename}`;
}

// Load previous progress if exists
async function loadProgress() {
  try {
    if (existsSync(RESULTS_FILE)) {
      const content = await readFile(RESULTS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (e) {
    console.log('No previous progress found, starting fresh');
  }
  return { completed: [], results: [] };
}

// Save progress
async function saveProgress(progress) {
  await writeFile(RESULTS_FILE, JSON.stringify(progress, null, 2));
}

// Main function
async function main() {
  console.log('🚀 Starting solution image generation with FLUX 1.1 Pro...\n');
  console.log('💰 Estimated cost: ~$6.16 for 154 images ($0.04/image)\n');
  
  // Ensure output directory exists
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
    console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
  }
  
  // Load solutions
  const solutions = await readSolutions();
  console.log(`📋 Found ${solutions.length} solutions to process\n`);
  
  // Load previous progress
  const progress = await loadProgress();
  console.log(`✅ Already completed: ${progress.completed.length} images\n`);
  
  const remaining = solutions.length - progress.completed.length;
  console.log(`🎯 Remaining: ${remaining} images (~${(remaining * 0.04).toFixed(2)})\n`);
  console.log('─'.repeat(60) + '\n');
  
  let retryCount = 0;
  const MAX_RETRIES = 3;
  
  // Process each solution
  for (let i = 0; i < solutions.length; i++) {
    const solution = solutions[i];
    
    // Skip if already completed
    if (progress.completed.includes(solution.solutionId)) {
      continue;
    }
    
    const progressNum = progress.completed.length + 1;
    console.log(`[${progressNum}/${solutions.length}] 🎨 ${solution.solutionName}`);
    console.log(`   Category: ${solution.category}`);
    
    try {
      const prompt = generatePrompt(solution.solutionName, solution.category);
      console.log(`   Prompt: "${prompt.substring(0, 50)}..."`);
      
      const imageUrl = await generateImage(prompt);
      console.log(`   ✅ Generated!`);
      
      const localPath = await downloadImage(imageUrl, solution.solutionId);
      console.log(`   💾 Saved: ${localPath}`);
      
      // Update progress
      progress.completed.push(solution.solutionId);
      progress.results.push({
        solutionId: solution.solutionId,
        solutionName: solution.solutionName,
        category: solution.category,
        localPath: localPath,
        replicateUrl: imageUrl
      });
      
      // Save progress after each image
      await saveProgress(progress);
      retryCount = 0; // Reset retry count on success
      
      // Rate limiting
      console.log(`   ⏳ Waiting 1.5s...\n`);
      await new Promise(r => setTimeout(r, 1500));
      
    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      retryCount++;
      
      if (retryCount >= MAX_RETRIES) {
        console.log(`   ⚠️ Skipping after ${MAX_RETRIES} retries\n`);
        retryCount = 0;
        continue;
      }
      
      console.log(`   🔄 Retry ${retryCount}/${MAX_RETRIES} in 5s...\n`);
      await new Promise(r => setTimeout(r, 5000));
      i--; // Retry this solution
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('🎉 Generation complete!');
  console.log(`📊 Total generated: ${progress.results.length} images`);
  console.log(`📁 Images saved to: ${OUTPUT_DIR}`);
  console.log(`📋 Results saved to: ${RESULTS_FILE}`);
  console.log('═'.repeat(60) + '\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});