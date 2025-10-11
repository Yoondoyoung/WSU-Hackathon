// Centralized ElevenLabs voice mapping.
// Auto-generated from ElevenLabs API on 2025-10-11T04:17:17.263Z
// Enhanced with detailed voice characteristics for AI selection

// Import enhanced voice mapping
import { 
  VOICE_DATABASE, 
  selectVoiceByCharacteristics, 
  selectNarratorVoice, 
  selectCharacterVoice,
  resolveVoiceId as enhancedResolveVoiceId 
} from './enhancedVoiceMap.js';

export const VOICE_ALIASES = {
  narrator: {
    // GPT-generated voice_id mappings with detailed descriptions for AI selection
    'narrator_01': 'EkK5I93UQWFDigLMpZcX', // James - Deep, engaging male voice, perfect for adventure stories
    'warm_narrator': 'EkK5I93UQWFDigLMpZcX', // James - Warm, professional male voice for storytelling
    'rachel': '21m00Tcm4TlvDq8ikWAM', // Rachel - Clear, conversational female voice
    
    // All available voices with detailed character descriptions for AI selection
    'rebekah_nemethy___pro_narration': 'ESELSAYNsoxwNZeqEklA', // Professional female narrator, clear and engaging
    'jameson___guided_meditation___narration': 'Mu5jxyqZOLIGltFpfalg', // Calm male voice, perfect for meditation and relaxation
    'john_doe___deep': 'EiNlNiXeDU1pqqOPrYMO', // Deep, mature male voice, ideal for wise mentors and elderly characters
    'james___husky___engaging': 'EkK5I93UQWFDigLMpZcX', // Husky, engaging male voice, perfect for adventure narrators
    'oracle_x': '1hlpeD1ydbI2ow0Tt3EW', // Mysterious, otherworldly voice, perfect for mystical characters and oracles
    'hope___soothing_narrator': 'iCrDUkL56s3C8sCRl7wb', // Warm, soothing female voice, ideal for children's stories
    'johnny_kid____serious': '8JVbfL6oEdmuxKn5DK2C', // Young, serious male voice, perfect for determined young heroes
    'amelia': 'ZF6FPAbjXT4488VcRRnw', // Young British female voice, clear and enthusiastic, great for young heroines
    'andrea_wolff___clear__youthful__evenly_paced_': 'Crm8VULvkVs5ZBDa1Ixm', // Clear, youthful American female voice, perfect for sidekicks
    'w__storytime_oxley': 'iUqOXhMfiOIbBejNtfLR', // Rich, storytelling male voice with British accent, perfect for classic tales
    'drew': '29vD33N1CtxCmqQRPOHJ',
    'clyde': '2EiwWnXFnvU5JabPnv8n',
    'paul': '5Q0t7uMcjvnagumLfvZi',
    'aria': '9BWtsMINqrJLrRacOk9x',
    'domi': 'AZnzlk1XvdvUeBnXmlld',
    'dave': 'CYw3kZ02Hs0563khs1Fj',
    'roger': 'CwhRBWXzGAHq8TQ4Fs17',
    'fin': 'D38z5RcWu1voky8WS1ja',
    'sarah': 'EXAVITQu4vr4xnSDxMaL',
    'antoni': 'ErXwobaYiN019PkySvjV',
    'laura': 'FGY2WhTYpPnrIDTdsKH5',
    'thomas': 'GBv7mTt0atIp3Br8iCZE',
    'charlie': 'IKne3meq5aSn9XLyUdCD',
    'george': 'JBFqnCBsd6RMkjVDRZzb',
    'emily': 'LcfcDJNUP1GQjkzn1xUU',
    'elli': 'MF3mGyEYCl7XYWbV9V6O',
    'callum': 'N2lVS1w4EtoT3dr4eOWO',
    'patrick': 'ODq5zmih8GrVes37Dizd',
    'river': 'SAz9YHcvj6GT2YYXdXww',
    'harry': 'SOYHLrjzK2X1ezoPC6cr',
    'liam': 'TX3LPaxmHKxFdv7VOQHJ',
    'dorothy': 'ThT5KcBeYPX3keUQqHPh',
    'josh': 'TxGEqnHWrfWFTfGW9XjX',
    'arnold': 'VR6AewLTigWG4xSOukaG',
    'charlotte': 'XB0fDUnXU5powFXDhCwa',
    'alice': 'Xb7hH8MSUJpSbSDYk0k2',
    'matilda': 'XrExE9yKIg1WjnnlVkGX',
    'james': 'ZQe5CZNOzWyzPSCn5a3c',
    'joseph': 'Zlb1dXrM653N07WRdFW3',
    'will': 'bIHbv24MWmeRgasZH58o',
    'jeremy': 'bVMeCyTHy58xNoL34h3p',
    'jessica': 'cgSgspJ2msm6clMCkdW9',
    'eric': 'cjVigY5qzO86Huf0OWal',
    'michael': 'flq6f7yk4E4fJM5XTYuZ',
    'ethan': 'g5CIjZEefAph4nQFvHAz',
    'chris': 'iP95p4xoKVk53GoZ742B',
    'gigi': 'jBpfuIE2acCO8z3wKNLl',
    'freya': 'jsCqWAovK2LkecY7zXl4',
    'brian': 'nPczCjzI2devNBz1zQrb',
    'grace': 'oWAxZDx7w5VEj9dCyTzz',
    'daniel': 'onwK4e9ZLuTAKqWW03F9',
    'lily': 'pFZP5JQG7iQjIQuC4Bku',
    'serena': 'pMsXgVXv3BLzUgSXRplE',
    'adam': 'pNInz6obpgDQGcFmaJgB',
    'nicole': 'piTKgcLEGmPE4e6mEKli',
    'bill': 'pqHfZKP75CvOlQylNhV4',
    'jessie': 't0jbNlBVZ17f02VDIeMI',
    'sam': 'yoZ06aMxZJJ28mfd3POQ',
    'glinda': 'z9fAnlkpzviPz146aGWa',
    'giovanni': 'zcAOhNBS3c14rBihAFp1',
    'mimi': 'zrHiDhphv9ZnVXBqCLjz',
  },
  characters: {
    // GPT-generated voice_id mappings
    'hero_01': 'ZF6FPAbjXT4488VcRRnw',
    'sidekick_01': 'Crm8VULvkVs5ZBDa1Ixm',
    'villain_01': '2EiwWnXFnvU5JabPnv8n',
    'mentor_01': '',
    'friend_01': '',
    
    // All available voices
    'rebekah_nemethy___pro_narration': 'ESELSAYNsoxwNZeqEklA',
    'jameson___guided_meditation___narration': 'Mu5jxyqZOLIGltFpfalg',
    'john_doe___deep': 'EiNlNiXeDU1pqqOPrYMO',
    'james___husky___engaging': 'EkK5I93UQWFDigLMpZcX',
    'oracle_x': '1hlpeD1ydbI2ow0Tt3EW',
    'hope___soothing_narrator': 'iCrDUkL56s3C8sCRl7wb',
    'johnny_kid____serious': '8JVbfL6oEdmuxKn5DK2C',
    'amelia': 'ZF6FPAbjXT4488VcRRnw',
    'andrea_wolff___clear__youthful__evenly_paced_': 'Crm8VULvkVs5ZBDa1Ixm',
    'w__storytime_oxley': 'iUqOXhMfiOIbBejNtfLR',
    'rachel': '21m00Tcm4TlvDq8ikWAM',
    'drew': '29vD33N1CtxCmqQRPOHJ',
    'clyde': '2EiwWnXFnvU5JabPnv8n',
    'paul': '5Q0t7uMcjvnagumLfvZi',
    'aria': '9BWtsMINqrJLrRacOk9x',
    'domi': 'AZnzlk1XvdvUeBnXmlld',
    'dave': 'CYw3kZ02Hs0563khs1Fj',
    'roger': 'CwhRBWXzGAHq8TQ4Fs17',
    'fin': 'D38z5RcWu1voky8WS1ja',
    'sarah': 'EXAVITQu4vr4xnSDxMaL',
    'antoni': 'ErXwobaYiN019PkySvjV',
    'laura': 'FGY2WhTYpPnrIDTdsKH5',
    'thomas': 'GBv7mTt0atIp3Br8iCZE',
    'charlie': 'IKne3meq5aSn9XLyUdCD',
    'george': 'JBFqnCBsd6RMkjVDRZzb',
    'emily': 'LcfcDJNUP1GQjkzn1xUU',
    'elli': 'MF3mGyEYCl7XYWbV9V6O',
    'callum': 'N2lVS1w4EtoT3dr4eOWO',
    'patrick': 'ODq5zmih8GrVes37Dizd',
    'river': 'SAz9YHcvj6GT2YYXdXww',
    'harry': 'SOYHLrjzK2X1ezoPC6cr',
    'liam': 'TX3LPaxmHKxFdv7VOQHJ',
    'dorothy': 'ThT5KcBeYPX3keUQqHPh',
    'josh': 'TxGEqnHWrfWFTfGW9XjX',
    'arnold': 'VR6AewLTigWG4xSOukaG',
    'charlotte': 'XB0fDUnXU5powFXDhCwa',
    'alice': 'Xb7hH8MSUJpSbSDYk0k2',
    'matilda': 'XrExE9yKIg1WjnnlVkGX',
    'james': 'ZQe5CZNOzWyzPSCn5a3c',
    'joseph': 'Zlb1dXrM653N07WRdFW3',
    'will': 'bIHbv24MWmeRgasZH58o',
    'jeremy': 'bVMeCyTHy58xNoL34h3p',
    'jessica': 'cgSgspJ2msm6clMCkdW9',
    'eric': 'cjVigY5qzO86Huf0OWal',
    'michael': 'flq6f7yk4E4fJM5XTYuZ',
    'ethan': 'g5CIjZEefAph4nQFvHAz',
    'chris': 'iP95p4xoKVk53GoZ742B',
    'gigi': 'jBpfuIE2acCO8z3wKNLl',
    'freya': 'jsCqWAovK2LkecY7zXl4',
    'brian': 'nPczCjzI2devNBz1zQrb',
    'grace': 'oWAxZDx7w5VEj9dCyTzz',
    'daniel': 'onwK4e9ZLuTAKqWW03F9',
    'lily': 'pFZP5JQG7iQjIQuC4Bku',
    'serena': 'pMsXgVXv3BLzUgSXRplE',
    'adam': 'pNInz6obpgDQGcFmaJgB',
    'nicole': 'piTKgcLEGmPE4e6mEKli',
    'bill': 'pqHfZKP75CvOlQylNhV4',
    'jessie': 't0jbNlBVZ17f02VDIeMI',
    'sam': 'yoZ06aMxZJJ28mfd3POQ',
    'glinda': 'z9fAnlkpzviPz146aGWa',
    'giovanni': 'zcAOhNBS3c14rBihAFp1',
    'mimi': 'zrHiDhphv9ZnVXBqCLjz',
  },
};

export const DEFAULTS = {
  narrator: process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'EkK5I93UQWFDigLMpZcX',
};

const looksLikeId = (value) => typeof value === 'string' && value.length >= 12 && !/\s/.test(value);

// Enhanced voice resolution with detailed characteristics
export const resolveVoiceId = (nameOrId, category = 'narrator') => {
  return enhancedResolveVoiceId(nameOrId, category);
};

// New function for AI to select voices based on character characteristics
export const selectVoiceForCharacter = (characteristics) => {
  return selectVoiceByCharacteristics(characteristics);
};

// New function for AI to select narrator voice based on story type
export const selectVoiceForNarrator = (storyType) => {
  return selectNarratorVoice(storyType);
};

// New function for AI to select character voice based on character type
export const selectVoiceForCharacterType = (characterType, emotion) => {
  return selectCharacterVoice(characterType, emotion);
};

export default {
  VOICE_ALIASES,
  DEFAULTS,
  resolveVoiceId,
  selectVoiceForCharacter,
  selectVoiceForNarrator,
  selectVoiceForCharacterType,
  VOICE_DATABASE,
};