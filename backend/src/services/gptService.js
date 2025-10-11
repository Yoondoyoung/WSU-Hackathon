import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";
import { config as loadEnv } from "dotenv";
import { HttpError } from "../utils/errorHandlers.js";
import {
  normaliseTimelineEntry,
  timelineDialogueText,
} from "../utils/timeline.js";
import fs from "fs";

const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
let envChecked = false;

const ensureOpenAiKey = () => {
  if (process.env.OPENAI_API_KEY || envChecked) {
    return;
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // Attempt to load backend/.env first
  loadEnv({ path: path.resolve(__dirname, "..", ".env"), override: false });

  // Fallback to repo-root/.env if still missing
  if (!process.env.OPENAI_API_KEY) {
    loadEnv({
      path: path.resolve(__dirname, "..", "..", ".env"),
      override: false,
    });
  }

  envChecked = true;
};

const buildUserPrompt = ({
  theme,
  genre,
  targetAgeGroup,
  storyLength = 6,
  artStyle,
  mainCharacter,
  supportingCharacters = [],
  narrationTone,
}) => ({
  theme,
  genre,
  targetAgeGroup,
  storyLength,
  artStyle,
  narrationTone,
  mainCharacter,
  supportingCharacters,
});

const parseTimeline = (timeline = []) => {
  return timeline
    .map(normaliseTimelineEntry)
    .filter((entry) => Boolean(entry?.type));
};

const parseStoryFromContent = (content) => {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new HttpError(502, "OpenAI returned non-JSON content.", { content });
  }

  // Handle new pages[] structure
  if (Array.isArray(parsed?.pages)) {
    const pages = parsed.pages.map((page, index) => {
      const pageNumber = page.page ?? index + 1;
      
      // Process timeline entries
      const timeline = Array.isArray(page.timeline) ? page.timeline.map(entry => {
        const baseEntry = {
          type: entry.type,
          text: entry.text,
        };

        // Add type-specific fields
        if (entry.type === 'narration') {
          return {
            ...baseEntry,
            voiceId: entry.voice_id,
            voiceSettings: entry.voice_settings,
          };
        } else if (entry.type === 'character') {
          return {
            ...baseEntry,
            name: entry.name,
            emotion: entry.emotion,
            voiceId: entry.voice_id,
            voiceSettings: entry.voice_settings,
          };
        } else if (entry.type === 'sfx') {
          return {
            ...baseEntry,
            description: entry.description,
            placeholder: entry.placeholder,
            text: entry.placeholder || entry.description,
          };
        }
        
        return baseEntry;
      }) : [];

      return {
        pageNumber,
        title: page.scene_title || `Scene ${pageNumber}`,
        setting: page.scene_title || `Scene ${pageNumber}`,
        imagePrompt: page.image_prompt,
        summary: timeline.find(entry => entry.type === 'narration')?.text || page.scene_title || `Scene ${pageNumber}`,
        timeline,
        dialogueText: timelineDialogueText(timeline),
      };
    });

    const fullTimelineText = pages
      .map((page) => page.dialogueText)
      .join("\n\n");

    return {
      title: parsed.title ?? "Untitled Adventure",
      logline: parsed.genre
        ? `${parsed.genre} - ${parsed.target_audience}`
        : "Untitled Story",
      characters: [], // Will be extracted from timeline
      pages,
      fullText: fullTimelineText,
      metadata: {
        genre: parsed.genre,
        targetAudience: parsed.target_audience,
        theme: themeFromPages(pages),
      },
    };
  }

  // Fallback to old scenes[] structure for backward compatibility
  if (!Array.isArray(parsed?.scenes)) {
    throw new HttpError(502, "Story payload missing pages or scenes array.", { parsed });
  }

  const scenes = parsed.scenes.map((scene, index) => {
    const sceneNumber = scene.scene_number ?? index + 1;

    // Convert scenes to pages format for compatibility
    const timeline = [];

    // Add narration
    if (scene.narration) {
      timeline.push({
        type: "narration",
        text: scene.narration.text,
        voice: scene.narration.voice,
        voiceId: scene.narration.voice_id,
      });
    }

    // Add characters
    if (Array.isArray(scene.characters)) {
      scene.characters.forEach((char) => {
        timeline.push({
          type: "character",
          name: char.name,
          text: char.text,
          voice: char.voice,
          voiceId: char.voice_id,
        });
      });
    }

    // Add SFX
    if (Array.isArray(scene.sfx)) {
      scene.sfx.forEach((sfx) => {
        timeline.push({
          type: "sfx",
          description: sfx,
          text: sfx,
        });
      });
    }

    return {
      pageNumber: sceneNumber,
      title: scene.title,
      setting: scene.title,
      imagePrompt: scene.image_prompt,
      summary: scene.narration?.text || scene.title,
      timeline,
      dialogueText: timelineDialogueText(timeline),
    };
  });

  const fullTimelineText = scenes
    .map((scene) => scene.dialogueText)
    .join("\n\n");

  return {
    title: parsed.title ?? "Untitled Adventure",
    logline: parsed.genre
      ? `${parsed.genre} - ${parsed.target_audience}`
      : "Untitled Story",
    characters: parsed.characters ?? [],
    pages: scenes, // Keep as pages for compatibility
    fullText: fullTimelineText,
    metadata: {
      genre: parsed.genre,
      targetAudience: parsed.target_audience,
      theme: parsed.theme ?? themeFromPages(scenes),
    },
  };
};

const themeFromPages = (pages) => {
  if (!Array.isArray(pages) || pages.length === 0) {
    return undefined;
  }

  return pages[0]?.summary;
};

const loadVoicePrompt = () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const voicePromptPath = path.join(__dirname, '..', '..', 'data', 'voicePrompt.txt');
    return fs.readFileSync(voicePromptPath, 'utf8');
  } catch (error) {
    console.warn('Could not load voice prompt:', error.message);
    return '';
  }
};

// Generate dynamic story structure based on length
const getStoryStructureGuide = (storyLength) => {
  if (storyLength <= 2) {
    return `**2-Page Structure (Simple Story):**
    1. **Setup & Conflict**: Introduce characters and establish the main challenge or situation
    2. **Resolution**: Resolve the conflict and show character growth or outcome
    
    Focus on a single, clear conflict that can be resolved quickly.`;
  } else if (storyLength <= 4) {
    return `**3-4 Page Structure (Short Story):**
    1. **Setup**: Introduce characters and establish the world naturally
    2. **Rising Action**: Develop the conflict and build tension
    3. **Climax**: Peak emotional moment or decisive action
    4. **Resolution**: Quick resolution and character growth
    
    Each page should advance the story significantly.`;
  } else if (storyLength <= 6) {
    return `**5-6 Page Structure (Medium Story):**
    1. **Setup**: Introduce characters and establish the world naturally
    2. **Rising Action**: Develop the conflict and build tension through character interactions
    3. **Climax**: Peak emotional confrontation or decisive moment
    4. **Falling Action**: Consequences and reactions to the climax
    5. **Resolution**: Character growth and satisfying conclusion through dialogue
    6. **Epilogue** (if 6 pages): Brief aftermath or reflection
    
    Allow for more character development and plot complexity.`;
  } else {
    return `**7+ Page Structure (Long Story):**
    1. **Setup**: Introduce characters and establish the world naturally
    2. **Inciting Incident**: Event that starts the main conflict
    3. **Rising Action**: Develop the conflict and build tension through character interactions
    4. **Midpoint**: Major plot twist or character revelation
    5. **Crisis**: Escalating tension and complications
    6. **Climax**: Peak emotional confrontation or decisive moment
    7. **Falling Action**: Consequences and reactions to the climax
    8. **Resolution**: Character growth and satisfying conclusion through dialogue
    9. **Epilogue** (if 8+ pages): Brief aftermath or reflection
    
    Allow for complex character arcs and multiple plot threads.`;
  }
};

// Generate page-by-page guidelines based on story length
const getPageByPageGuide = (storyLength) => {
  if (storyLength <= 2) {
    return `**Page 1**: Setup & Conflict - Introduce characters and establish the main challenge
**Page 2**: Resolution - Resolve the conflict and show outcome`;
  } else if (storyLength <= 4) {
    return `**Page 1**: Setup - Introduce characters and establish the world
**Page 2**: Rising Action - Develop conflict and build tension
**Page 3**: Climax - Peak emotional moment or decisive action
**Page 4**: Resolution - Quick resolution and character growth`;
  } else if (storyLength <= 6) {
    return `**Page 1**: Setup - Introduce characters and establish the world
**Page 2**: Rising Action - Develop conflict and build tension
**Page 3**: Rising Action - Continue building tension through character interactions
**Page 4**: Climax - Peak emotional confrontation or decisive moment
**Page 5**: Falling Action - Consequences and reactions to the climax
**Page 6**: Resolution - Character growth and satisfying conclusion`;
  } else {
    return `**Page 1**: Setup - Introduce characters and establish the world
**Page 2**: Inciting Incident - Event that starts the main conflict
**Page 3**: Rising Action - Develop conflict and build tension
**Page 4**: Rising Action - Continue building tension through character interactions
**Page 5**: Midpoint - Major plot twist or character revelation
**Page 6**: Crisis - Escalating tension and complications
**Page 7**: Climax - Peak emotional confrontation or decisive moment
**Page 8**: Falling Action - Consequences and reactions to the climax
**Page 9+**: Resolution - Character growth and satisfying conclusion`;
  }
};

export const createStory = async (options) => {
  ensureOpenAiKey();
  const voicePrompt = loadVoicePrompt();
  
  const prompt = `
    ## SYSTEM INSTRUCTIONS

    You are a cinematic story writer that creates emotionally engaging, dialogue-driven stories for AI-generated storybooks.
    Focus on character interactions to move the story forward.
    Use narration sparingly — only to describe scene transitions, atmosphere, or internal emotions that dialogue cannot convey.

    The story should feel like a radio drama or film script with vivid character voices and natural pacing.

    Your output must be strictly valid JSON that follows the timeline structure described below.

    Each page should include:
    - A timeline array containing 5-8 entries for rich, engaging scenes.
    - Dialogue as the main storytelling method (70–80% of content).
    - Occasional short narration (1–2 sentences) for transitions or mood.
    - Each page should have substantial content: 3-4 character interactions + 1-2 narration beats + optional SFX.
    - Optional sound effects (sfx) for emotional or environmental emphasis.
    - An image_prompt describing the visual look and mood of the scene.

    ## CHARACTER INFORMATION
    **Main Character:** ${options.mainCharacter?.name || 'Alex'} (${options.mainCharacter?.gender || 'male'}) - ${options.mainCharacter?.traits?.join(', ') || 'brave, curious'}
    
    **Supporting Characters:**
    ${options.supportingCharacters?.map(char => `- ${char.name} (${char.gender || 'non-binary'}) - ${char.traits?.join(', ') || 'loyal'}`).join('\n    ') || '- Sam (female) - loyal, inventive'}
    
    **IMPORTANT:** Use the character gender information above to select appropriate voices. Male characters should use male voices, female characters should use female voices.

    ## STORY STRUCTURE
    Create exactly ${options.storyLength || 4} pages following a dynamic structure based on length:
    
    ${getStoryStructureGuide(options.storyLength || 4)}
    
    IMPORTANT: Generate exactly ${options.storyLength || 6} pages, no more, no less.
    
    ## PAGE-BY-PAGE GUIDELINES
    ${getPageByPageGuide(options.storyLength || 4)}

    ## TIMELINE STRUCTURE
    Each timeline entry must be one of these types:

    ### NARRATION (Use sparingly - 20-30% of content)
    - type: "narration"
    - voice_id: "${options.narrationVoiceId || 'EkK5I93UQWFDigLMpZcX'}" (Use the selected narrator voice consistently throughout the story)
    - voice_settings: Use emotion presets (see below)
    - text: Short, atmospheric narration (1-2 sentences max)

    ### CHARACTER (Main content - 70-80% of timeline)
    - type: "character" 
    - name: Character name
    - emotion: One of the emotion presets (see below)
    - voice_id: Choose character voice based on the character's gender and role:
      
      **For MALE characters:**
      * Young Hero: "TX3LPaxmHKxFdv7VOQHJ" (Liam - energetic, warm young male)
      * Mature Hero: "EkK5I93UQWFDigLMpZcX" (James - husky, engaging male)
      * Villain: "2EiwWnXFnvU5JabPnv8n" (Clyde - deep, intense male)
      * Mentor: "EiNlNiXeDU1pqqOPrYMO" (John Doe - deep, wise male)
      * Sidekick: "29vD33N1CtxCmqQRPOHJ" (Drew - casual, friendly male)
      
      **For FEMALE characters:**
      * Young Hero: "ZF6FPAbjXT4488VcRRnw" (Amelia - clear, enthusiastic young female)
      * Mature Hero: "EXAVITQu4vr4xnSDxMaL" (Sarah - confident, warm female)
      * Villain: "XB0fDUnXU5powFXDhCwa" (Charlotte - sensual, raspy female)
      * Mentor: "Xb7hH8MSUJpSbSDYk0k2" (Alice - clear, engaging female)
      * Sidekick: "Crm8VULvkVs5ZBDa1Ixm" (Andrea Wolff - clear, youthful female)
      
      **For NON-BINARY or MYSTICAL characters:**
      * Mystical: "1hlpeD1ydbI2ow0Tt3EW" (Oracle X - mysterious, otherworldly)
      * Neutral: "Mu5jxyqZOLIGltFpfalg" (Jameson - calm, meditative)
      
    - voice_settings: Use emotion presets (see below)
    - text: Natural dialogue without stage directions - just the spoken words

    ### SFX (Optional - for emphasis and atmosphere)
    - type: "sfx"
    - description: Detailed sound effect description for contextual generation
    - placeholder: Text representation like "CRACK—!" or "WHOOSH!"
    
    **CRITICAL SFX RULE**: NEVER use SFX without preceding narration!
    - **MANDATORY Pattern**: [Narration] → [SFX] (SFX alone is FORBIDDEN)
    - **Why**: Listeners need context to understand what the sound represents
    - **Examples**: 
      * ❌ WRONG: Direct SFX "Footsteps crunching in the sand"
      * ✅ CORRECT: Narration: "선원들은 하나, 둘씩 땅에 발을 디뎠습니다" → SFX: "Footsteps crunching in the sand"
      * ❌ WRONG: Direct SFX "Rustling leaves and creaking branches"  
      * ✅ CORRECT: Narration: "그 때! 나무가 흔들렸어요!" → SFX: "Rustling leaves and creaking branches"
    - **Rule**: Every SFX entry MUST have a narration entry immediately before it
    
    **SFX Guidelines:**
    - **Short sounds (1-2s)**: clicks, snaps, pops, beeps, dings, ticks, taps, knocks
    - **Action sounds (2-3s)**: crashes, bangs, explosions, cracks, slams, thuds, splashes, whooshes
    - **Movement sounds (3s)**: footsteps, walking, running, rustling, creaking, doors, gates
    - **Vocal sounds (2-3s)**: laughs, whispers, murmurs, chatter, giggles, sighs, gasps
    - **Natural sounds (4s)**: thunder, engines, motors, bells, alarms, sirens, horns
    - **Ambient sounds (4s)**: wind, rain, forest, ocean, waves, birds, crickets, atmosphere
    
    **MANDATORY SFX Patterns (Copy these exactly):**
    - **Footsteps**: Narration: "선원들은 하나, 둘씩 땅에 발을 디뎠습니다" → SFX: "Footsteps crunching in the sand"
    - **Tree Movement**: Narration: "그 때! 나무가 흔들렸어요!" → SFX: "Rustling leaves and creaking branches"
    - **Chest Opening**: Narration: "그 때! 상자가 천천히 열리기 시작했어요!" → SFX: "Creaking of the chest as it slowly opens"
    - **Lightning**: Narration: "하늘이 갈라지며 번개가 내리쳤어요!" → SFX: "Sharp crack of lightning splitting the sky"
    - **Approaching Steps**: Narration: "누군가 조심스럽게 걸어오는 소리가 들렸어요" → SFX: "Gentle footsteps on wooden floorboards"
    - **Thunder**: Narration: "먼 곳에서 천둥소리가 울려 퍼졌어요" → SFX: "Distant thunder rumbling across the valley"
    - **Door Opening**: Narration: "문이 삐걱거리며 열리기 시작했어요" → SFX: "Creaking door hinges"
    - **Water Splash**: Narration: "물이 튀며 파도가 일렁였어요" → SFX: "Water splashing and waves"

    ## EMOTION PRESETS & VOICE SETTINGS
    Use these emotion presets when creating voice_settings for narration and characters:

    | Emotion | Description | stability | similarity_boost | style | speed |
    |---------|-------------|-----------|------------------|-------|-------|
    | calm | Neutral tone, steady delivery | 0.85 | 0.8 | 0.2 | 1.0 |
    | narrative | Balanced and professional (for narrator) | 0.9 | 0.9 | 0.15 | 1.0 |
    | curious | Inquisitive, wondering tone | 0.6 | 0.7 | 0.7 | 1.05 |
    | anger | Intense, harsh, sharp articulation | 0.4 | 0.7 | 0.9 | 0.95 |
    | fear | Shaky, hesitant tone | 0.5 | 0.6 | 0.8 | 1.05 |
    | sadness | Slower, softer, lower energy | 0.5 | 0.7 | 0.7 | 0.9 |
    | joy | Bright, cheerful tone | 0.6 | 0.6 | 0.8 | 1.1 |
    | determined | Confident and bold | 0.5 | 0.7 | 0.8 | 1.0 |
    | mysterious | Whisper-like, controlled tone | 0.7 | 0.8 | 0.4 | 0.95 |
    | villainous | Deep, dramatic, confident tone | 0.45 | 0.7 | 0.85 | 0.95 |

    👉 Narration usually uses "narrative" preset.
    👉 Characters should reflect the emotional context of their dialogue.

    ## CONTENT LENGTH GUIDELINES
    **Each page should contain 5-8 timeline entries for rich storytelling:**
    - **3-4 Character dialogue exchanges** (main content)
    - **1-2 Narration beats** (scene setting, transitions)
    - **0-2 Sound effects** (environmental, emotional emphasis)
    - **Total: 5-8 entries per page** for substantial, engaging scenes
    
    ## SFX VALIDATION RULES
    **Before generating any SFX, check:**
    1. Is there a narration entry immediately before this SFX?
    2. Does the narration explain what sound is about to happen?
    3. If NO to either question, add narration first or remove SFX
    
    **SFX Checklist:**
    - ✅ Narration: "선원들은 하나, 둘씩 땅에 발을 디뎠습니다"
    - ✅ SFX: "Footsteps crunching in the sand"
    - ❌ SFX: "Footsteps crunching in the sand" (without narration)

    ## EXAMPLE JSON STRUCTURE
    {
      "title": "The Awakening",
      "genre": "Fantasy Adventure",
      "target_audience": "General",
      "pages": [
        {
          "page": 1,
          "scene_title": "The Awakening",
          "timeline": [
            {
              "type": "narration",
              "voice_id": "EkK5I93UQWFDigLMpZcX",
              "voice_settings": {
                "stability": 0.9,
                "similarity_boost": 0.9,
                "style": 0.15,
                "speed": 1.0
              },
              "text": "The night was silent, except for the wind that whispered through the ruins."
            },
            {
              "type": "character",
              "name": "Taeil",
              "emotion": "curious",
              "voice_id": "ZF6FPAbjXT4488VcRRnw",
              "voice_settings": {
                "stability": 0.6,
                "similarity_boost": 0.7,
                "style": 0.7,
                "speed": 1.05
              },
              "text": "Strange... this place feels alive. Almost like it's breathing."
            },
            {
              "type": "character",
              "name": "Guardian",
              "emotion": "mysterious",
              "voice_id": "2EiwWnXFnvU5JabPnv8n",
              "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.7,
                "style": 0.8,
                "speed": 0.95
              },
              "text": "It breathes because it remembers, human. Every echo here has a name."
            },
            {
              "type": "character",
              "name": "Taeil",
              "emotion": "fear",
              "voice_id": "ZF6FPAbjXT4488VcRRnw",
              "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.6,
                "style": 0.8,
                "speed": 1.1
              },
              "text": "Who's there?! Show yourself!"
            },
            {
              "type": "narration",
              "voice_id": "EkK5I93UQWFDigLMpZcX",
              "voice_settings": {
                "stability": 0.9,
                "similarity_boost": 0.9,
                "style": 0.15,
                "speed": 1.0
              },
              "text": "그 때! 땅이 갈라지며 거대한 돌이 깨어났어요!"
            },
            {
              "type": "sfx",
              "description": "Stone cracking as a giant awakens beneath the ruins",
              "placeholder": "CRACK—!"
            },
            {
              "type": "narration",
              "voice_id": "EkK5I93UQWFDigLMpZcX",
              "voice_settings": {
                "stability": 0.9,
                "similarity_boost": 0.9,
                "style": 0.2,
                "speed": 1.0
              },
              "text": "The ground trembled, and an ancient guardian rose from the depths."
            }
          ],
          "image_prompt": "A fantasy scene where Taeil faces a massive stone guardian rising in a storm of dust and glowing light."
        }
      ]
    }

    ## SOUND EFFECTS (SFX) GUIDELINES
    Create diverse and specific sound effects that enhance the story atmosphere:
    
    **Environment Sounds** (long duration, ambient):
    - "Wind howling through ancient trees"
    - "Gentle rain pattering on leaves"
    - "Crackling campfire in the distance"
    - "Ocean waves crashing against rocks"
    
    **Action/Impact Sounds** (short, sharp):
    - "Sword clashing against metal armor"
    - "Door slamming shut with a heavy thud"
    - "Glass shattering into pieces"
    - "Thunder crackling across the sky"
    
    **Movement Sounds** (medium duration):
    - "Footsteps echoing in empty corridors"
    - "Leaves rustling as someone approaches"
    - "Horse hooves galloping on cobblestone"
    - "Wings flapping as a bird takes flight"
    
    **Character Sounds** (short, emotional):
    - "Soft laughter echoing in the room"
    - "Gasp of surprise and wonder"
    - "Sigh of relief after tension"
    - "Whispered conversation in the shadows"
    
    **Magical/Mystical Sounds** (unique, atmospheric):
    - "Crystal humming with magical energy"
    - "Ancient spell casting with ethereal tones"
    - "Portal opening with dimensional crackling"
    - "Mystical chimes resonating through the air"

    ## IMPORTANT RULES
    1. **Rich Content**: Each page must contain 5-8 timeline entries for substantial storytelling
    2. **Dialogue First**: 70-80% of content should be character dialogue
    3. **Minimal Narration**: Use narration only for scene transitions and atmosphere (1-2 sentences max)
    4. **Natural Speech**: Character dialogue should be natural, without stage directions in quotes
    5. **Consistent Voices**: 
       - Use the SAME voice_id for each character across ALL pages
       - Use the SAME narrator voice_id "${options.narrationVoiceId || 'EkK5I93UQWFDigLMpZcX'}" throughout the entire story
       - Match character gender to voice gender: male characters use male voices, female characters use female voices
       - Create a character-to-voice mapping at the start and stick to it
       - Example: If Alex (male) uses "TX3LPaxmHKxFdv7VOQHJ" in page 1, use the same ID for Alex in all pages
    6. **Emotional Authenticity**: Use appropriate emotion presets for each character's state
    7. **Radio Drama Feel**: Focus on character interactions and emotional beats
    8. **Diverse SFX**: Use varied sound effects that match the scene's mood and action
    9. **SFX Context**: MANDATORY - Every SFX MUST be preceded by narration. NEVER use SFX alone. This is CRITICAL for listener understanding.
    10. **Image Prompts**: Describe visual mood and key elements for Seedream 4.0

${voicePrompt}

  `;

  if (!process.env.OPENAI_API_KEY) {
    throw new HttpError(500, "OPENAI_API_KEY is not configured.");
  }

  const payload = buildUserPrompt(options);

  try {
    const { data } = await axios.post(
      OPENAI_CHAT_COMPLETIONS_URL,
      {
        model: OPENAI_MODEL,
        temperature: 0.8,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: prompt,
          },
          {
            role: "user",
            content: JSON.stringify(payload),
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      throw new HttpError(502, "OpenAI returned an empty response.");
    }
    console.log("OpenAI response:", content);
    return parseStoryFromContent(content);
  } catch (error) {
    if (error.response) {
      // Log server-side details to help debugging during development
      // (keys are not logged; only response payload)
      console.error("OpenAI error response:", error.response.data);
    }
    if (error.response) {
      throw new HttpError(
        error.response.status,
        "OpenAI API error",
        error.response.data
      );
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(500, "Failed to generate story with OpenAI.", {
      message: error.message,
    });
  }
};
