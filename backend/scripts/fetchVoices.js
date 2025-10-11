import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

if (!ELEVENLABS_API_KEY) {
  console.error('❌ ELEVENLABS_API_KEY not found in environment variables');
  process.exit(1);
}

async function fetchVoices() {
  try {
    console.log('🎤 Fetching voices from ElevenLabs...');
    
    const response = await axios.get('https://api.elevenlabs.io/v2/voices', {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY,
      },
      params: {
        page_size: 100, // Get more voices
        include_total_count: true,
      }
    });

    const { voices, total_count } = response.data;
    console.log(`✅ Found ${voices.length} voices (total: ${total_count})`);

    // Categorize voices
    const categorized = {
      narrator: [],
      characters: [],
      male: [],
      female: [],
      young: [],
      mature: [],
      professional: [],
      casual: [],
      all: voices.map(voice => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        labels: voice.labels || {},
        preview_url: voice.preview_url,
      }))
    };

    // Categorize based on name, description, and labels
    voices.forEach(voice => {
      const name = voice.name.toLowerCase();
      const description = (voice.description || '').toLowerCase();
      const labels = voice.labels || {};
      
      // Gender categorization
      if (name.includes('male') || name.includes('man') || name.includes('boy') || 
          description.includes('male') || description.includes('man') || description.includes('boy') ||
          labels.gender === 'male') {
        categorized.male.push(voice);
      }
      
      if (name.includes('female') || name.includes('woman') || name.includes('girl') || 
          description.includes('female') || description.includes('woman') || description.includes('girl') ||
          labels.gender === 'female') {
        categorized.female.push(voice);
      }

      // Age categorization
      if (name.includes('young') || name.includes('child') || name.includes('teen') ||
          description.includes('young') || description.includes('child') || description.includes('teen') ||
          labels.age === 'young') {
        categorized.young.push(voice);
      }
      
      if (name.includes('mature') || name.includes('adult') || name.includes('senior') ||
          description.includes('mature') || description.includes('adult') || description.includes('senior') ||
          labels.age === 'mature') {
        categorized.mature.push(voice);
      }

      // Style categorization
      if (name.includes('professional') || name.includes('formal') || name.includes('business') ||
          description.includes('professional') || description.includes('formal') || description.includes('business') ||
          labels.style === 'professional') {
        categorized.professional.push(voice);
      }
      
      if (name.includes('casual') || name.includes('friendly') || name.includes('warm') ||
          description.includes('casual') || description.includes('friendly') || description.includes('warm') ||
          labels.style === 'casual') {
        categorized.casual.push(voice);
      }

      // Narrator candidates (warm, clear, professional voices)
      if (name.includes('narrator') || name.includes('story') || name.includes('warm') || 
          name.includes('clear') || name.includes('professional') ||
          description.includes('narrator') || description.includes('story') || description.includes('warm') ||
          description.includes('clear') || description.includes('professional') ||
          labels.role === 'narrator') {
        categorized.narrator.push(voice);
      }

      // Character candidates (expressive, diverse voices)
      if (name.includes('character') || name.includes('expressive') || name.includes('diverse') ||
          description.includes('character') || description.includes('expressive') || description.includes('diverse') ||
          labels.role === 'character') {
        categorized.characters.push(voice);
      }
    });

    // If no specific narrator/character voices found, use some defaults
    if (categorized.narrator.length === 0) {
      // Add some warm, clear voices as narrator candidates
      const warmVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes('sarah') ||
        voice.name.toLowerCase().includes('laura') ||
        voice.name.toLowerCase().includes('alice') ||
        voice.name.toLowerCase().includes('matilda')
      );
      categorized.narrator.push(...warmVoices);
    }

    if (categorized.characters.length === 0) {
      // Add diverse voices as character candidates
      const diverseVoices = voices.filter(voice => 
        voice.name.toLowerCase().includes('roger') ||
        voice.name.toLowerCase().includes('charlie') ||
        voice.name.toLowerCase().includes('george') ||
        voice.name.toLowerCase().includes('liam') ||
        voice.name.toLowerCase().includes('will') ||
        voice.name.toLowerCase().includes('eric')
      );
      categorized.characters.push(...diverseVoices);
    }

    // Save categorized voices
    const outputPath = path.join(__dirname, '..', 'data', 'voices.json');
    const outputDir = path.dirname(outputPath);
    
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(categorized, null, 2));
    console.log(`💾 Saved categorized voices to ${outputPath}`);

    // Generate voiceMap.js content
    const voiceMapContent = generateVoiceMapContent(categorized);
    const voiceMapPath = path.join(__dirname, '..', 'src', 'config', 'voiceMap.js');
    
    fs.writeFileSync(voiceMapPath, voiceMapContent);
    console.log(`🗺️ Updated voiceMap.js with ${categorized.all.length} voices`);

    // Print summary
    console.log('\n📊 Voice Categories:');
    Object.entries(categorized).forEach(([category, voices]) => {
      if (Array.isArray(voices)) {
        console.log(`  ${category}: ${voices.length} voices`);
      }
    });

  } catch (error) {
    console.error('❌ Error fetching voices:', error.response?.data || error.message);
    process.exit(1);
  }
}

function generateVoiceMapContent(categorized) {
  const { narrator, characters, all } = categorized;
  
  // Create mappings for GPT-generated voice_ids
  const narratorMappings = {};
  const characterMappings = {};
  
  // Map common GPT voice_ids to actual ElevenLabs voices
  const narratorVoices = narrator.slice(0, 5); // Top 5 narrator candidates
  const characterVoices = characters.slice(0, 10); // Top 10 character candidates
  
  // Narrator mappings
  narratorMappings['narrator_01'] = narratorVoices[0]?.voice_id || '';
  narratorMappings['warm_narrator'] = narratorVoices[0]?.voice_id || '';
  narratorMappings['rachel'] = narratorVoices[0]?.voice_id || '';
  
  // Character mappings
  characterMappings['hero_01'] = characterVoices[0]?.voice_id || '';
  characterMappings['sidekick_01'] = characterVoices[1]?.voice_id || '';
  characterMappings['villain_01'] = characterVoices[2]?.voice_id || '';
  characterMappings['mentor_01'] = characterVoices[3]?.voice_id || '';
  characterMappings['friend_01'] = characterVoices[4]?.voice_id || '';
  
  // Add all voices by name
  all.forEach(voice => {
    const name = voice.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
    narratorMappings[name] = voice.voice_id;
    characterMappings[name] = voice.voice_id;
  });

  return `// Centralized ElevenLabs voice mapping.
// Auto-generated from ElevenLabs API on ${new Date().toISOString()}
// Fill these with your actual voice IDs from /api/story/voices.
// You can reference aliases like 'antoni', 'rachel', 'adam', etc.

export const VOICE_ALIASES = {
  narrator: {
    // GPT-generated voice_id mappings
    'narrator_01': '${narratorMappings['narrator_01']}',
    'warm_narrator': '${narratorMappings['warm_narrator']}',
    'rachel': '${narratorMappings['rachel']}',
    
    // All available voices
${Object.entries(narratorMappings).filter(([key]) => !['narrator_01', 'warm_narrator', 'rachel'].includes(key)).map(([key, value]) => `    '${key}': '${value}',`).join('\n')}
  },
  characters: {
    // GPT-generated voice_id mappings
    'hero_01': '${characterMappings['hero_01']}',
    'sidekick_01': '${characterMappings['sidekick_01']}',
    'villain_01': '${characterMappings['villain_01']}',
    'mentor_01': '${characterMappings['mentor_01']}',
    'friend_01': '${characterMappings['friend_01']}',
    
    // All available voices
${Object.entries(characterMappings).filter(([key]) => !['hero_01', 'sidekick_01', 'villain_01', 'mentor_01', 'friend_01'].includes(key)).map(([key, value]) => `    '${key}': '${value}',`).join('\n')}
  },
};

export const DEFAULTS = {
  narrator: process.env.ELEVENLABS_DEFAULT_VOICE_ID || '${narratorMappings['narrator_01']}',
};

const looksLikeId = (value) => typeof value === 'string' && value.length >= 12 && !/\\s/.test(value);

export const resolveVoiceId = (nameOrId, category = 'narrator') => {
  if (!nameOrId) {
    return VOICE_ALIASES[category]?.default || DEFAULTS[category] || '';
  }

  // If it's already an ID, return as-is
  if (looksLikeId(nameOrId)) return nameOrId;

  const key = String(nameOrId).toLowerCase().trim();
  const byCategory = VOICE_ALIASES[category] || {};
  return byCategory[key] || DEFAULTS[category] || '';
};

export default {
  VOICE_ALIASES,
  DEFAULTS,
  resolveVoiceId,
};`;
}

// Run the script
fetchVoices();
