// Narrator voice options for frontend selection
export const NARRATOR_VOICES = [
  {
    id: 'EkK5I93UQWFDigLMpZcX',
    name: 'James - Husky & Engaging',
    gender: 'male',
    description: 'Deep, engaging male voice perfect for adventure stories',
    style: 'professional',
    accent: 'american'
  },
  {
    id: 'ESELSAYNsoxwNZeqEklA',
    name: 'Rebekah Nemethy - Pro Narration',
    gender: 'female',
    description: 'Professional female narrator with clear articulation',
    style: 'professional',
    accent: 'american'
  },
  {
    id: 'Mu5jxyqZOLIGltFpfalg',
    name: 'Jameson - Guided Meditation & Narration',
    gender: 'male',
    description: 'Calm and soothing voice perfect for meditation and relaxation',
    style: 'meditative',
    accent: 'american'
  },
  {
    id: 'iCrDUkL56s3C8sCRl7wb',
    name: 'Hope - Soothing Narrator',
    gender: 'female',
    description: 'Warm and soothing voice ideal for children\'s stories',
    style: 'soothing',
    accent: 'american'
  },
  {
    id: 'iUqOXhMfiOIbBejNtfLR',
    name: 'W. Storytime Oxley',
    gender: 'male',
    description: 'Rich, storytelling voice with British accent for classic tales',
    style: 'storytelling',
    accent: 'british'
  },
  {
    id: '21m00Tcm4TlvDq8ikWAM',
    name: 'Rachel',
    gender: 'female',
    description: 'Clear, conversational female voice',
    style: 'conversational',
    accent: 'american'
  },
  {
    id: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    gender: 'female',
    description: 'Confident and warm female voice with professional tone',
    style: 'professional',
    accent: 'american'
  },
  {
    id: 'Xb7hH8MSUJpSbSDYk0k2',
    name: 'Alice',
    gender: 'female',
    description: 'Clear and engaging British female voice suitable for e-learning',
    style: 'educational',
    accent: 'british'
  },
  {
    id: 'pFZP5JQG7iQjIQuC4Bku',
    name: 'Lily',
    gender: 'female',
    description: 'Velvety British female voice with warmth and clarity',
    style: 'narrative',
    accent: 'british'
  },
  {
    id: 'onwK4e9ZLuTAKqWW03F9',
    name: 'Daniel',
    gender: 'male',
    description: 'Strong voice perfect for professional broadcasts and news',
    style: 'broadcast',
    accent: 'british'
  }
];

// Helper function to get narrator voice by ID
export const getNarratorVoiceById = (id) => {
  return NARRATOR_VOICES.find(voice => voice.id === id);
};

// Helper function to get narrator voices by gender
export const getNarratorVoicesByGender = (gender) => {
  return NARRATOR_VOICES.filter(voice => voice.gender === gender);
};

// Helper function to get narrator voices by style
export const getNarratorVoicesByStyle = (style) => {
  return NARRATOR_VOICES.filter(voice => voice.style === style);
};

export default NARRATOR_VOICES;

