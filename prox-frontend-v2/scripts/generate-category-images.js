import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import Replicate from 'replicate';
import path from 'path';

const replicate = new Replicate();
const OUTPUT_DIR = './public/images/solutions';

// Category images to generate
const IMAGES_TO_GENERATE = [
  {
    id: 'drawer-organizers',
    prompt: 'bamboo drawer organizer tray with compartments for kitchen utensils, overhead view, kitchen organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'shelf-risers',
    prompt: 'stackable cabinet shelf riser organizer, white metal wire shelf insert for kitchen cabinet, kitchen organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'can-organizers',
    prompt: 'pantry can organizer rack, stackable can dispenser storage for canned goods, kitchen pantry organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'hanging-closet-shelves',
    prompt: 'hanging closet organizer with fabric shelves, sweater storage hanging from closet rod, closet organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'drawer-dividers',
    prompt: 'adjustable drawer dividers set, expandable bamboo drawer organizers separating clothes in dresser drawer, home organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'shelf-dividers',
    prompt: 'acrylic shelf dividers for closet, clear vertical shelf separators organizing folded sweaters on shelf, closet organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'shower-caddies',
    prompt: 'tension pole shower caddy with multiple shelves, corner shower organizer with baskets for shampoo bottles, bathroom organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'toothbrush-holders',
    prompt: 'bathroom toothbrush holder stand with toothpaste storage, countertop dental organizer, bathroom organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'desk-organizers',
    prompt: 'wooden desk organizer with pen holder and file slots, desktop office supplies organizer, office organization product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  },
  {
    id: 'picture-hangers',
    prompt: 'picture hanging kit with hooks and wire, wall art hanging hardware set, home improvement product, product photography, clean white background, studio lighting, minimalist style, commercial product shot, 4k, high quality'
  }
];

async function generateImage(prompt) {
  const input = {
    prompt: prompt,
    prompt_upsampling: true
  };

  const output = await replicate.run("black-forest-labs/flux-1.1-pro", { input });

  if (typeof output === 'string') {
    return output;
  } else if (output && typeof output.url === 'function') {
    return output.url();
  } else if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }
  throw new Error('Unexpected output format from Replicate');
}

async function downloadImage(url, imageId) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  const filename = `${imageId}.jpg`;
  const filepath = path.join(OUTPUT_DIR, filename);
  await writeFile(filepath, Buffer.from(buffer));
  return `/images/solutions/${filename}`;
}

async function main() {
  console.log('🚀 Generating category images with FLUX 1.1 Pro...');
  console.log('⚠️  Rate limited mode: 12s delay between requests\n');

  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  let completed = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < IMAGES_TO_GENERATE.length; i++) {
    const image = IMAGES_TO_GENERATE[i];

    // Check if image already exists
    const filepath = path.join(OUTPUT_DIR, `${image.id}.jpg`);
    if (existsSync(filepath)) {
      console.log(`[${i + 1}/${IMAGES_TO_GENERATE.length}] ⏭️  ${image.id} - already exists`);
      skipped++;
      continue;
    }

    console.log(`[${i + 1}/${IMAGES_TO_GENERATE.length}] 🎨 ${image.id}`);
    console.log(`   Prompt: "${image.prompt.substring(0, 50)}..."`);

    let retries = 3;
    while (retries > 0) {
      try {
        const imageUrl = await generateImage(image.prompt);
        console.log(`   ✅ Generated!`);

        const localPath = await downloadImage(imageUrl, image.id);
        console.log(`   💾 Saved: ${localPath}`);
        completed++;

        // Rate limiting - 12 seconds for low-credit accounts
        console.log(`   ⏳ Waiting 12s...\n`);
        await new Promise(r => setTimeout(r, 12000));
        break;

      } catch (error) {
        retries--;
        if (error.message.includes('429') && retries > 0) {
          console.log(`   ⚠️  Rate limited, waiting 15s (${retries} retries left)...`);
          await new Promise(r => setTimeout(r, 15000));
        } else {
          console.error(`   ❌ Error: ${error.message}\n`);
          failed++;
          break;
        }
      }
    }
  }

  console.log('\n' + '═'.repeat(50));
  console.log(`🎉 Done! Generated: ${completed}, Skipped: ${skipped}, Failed: ${failed}`);
  console.log('═'.repeat(50));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
