import { createStory } from '../services/gptService.js';
import {
  cloneVoiceFromSample,
  generateSoundEffect,
  synthesizeSpeech,
  listVoices,
} from '../services/elevenLabsService.js';
import { generateSceneIllustration } from '../services/runwareService.js';
import { mixPageAudio } from '../services/audioMixerService.js';
import { asyncHandler, HttpError } from '../utils/errorHandlers.js';
import { matchCharacterVoice, matchNarrationVoice, defaultCharacterVoiceSettings } from '../utils/voiceLibrary.js';
import { timelineToMarkdown } from '../utils/timeline.js';
import { saveBase64Asset } from '../utils/storage.js';
import { resolveVoiceId } from '../config/voiceMap.js';
import { processStory } from '../pipeline/storyPipeline.js';
import { createStoryState, getStoryState } from '../state/storyState.js';
import { NARRATOR_VOICES } from '../config/narratorVoices.js';

const parseTraits = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((trait) => String(trait).trim()).filter(Boolean);
  }

  return String(value)
    .split(',')
    .map((trait) => trait.trim())
    .filter(Boolean);
};

const normaliseCharacterInput = (input) => {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    const parts = input.split('|');
    const namePart = parts[0]?.trim();
    const genderPart = parts[1]?.trim();
    const traitsPart = parts[2]?.trim() || parts[1]?.trim();
    
    return {
      name: namePart,
      gender: genderPart && ['male', 'female', 'non-binary'].includes(genderPart.toLowerCase()) 
        ? genderPart.toLowerCase() 
        : 'non-binary',
      traits: parseTraits(traitsPart),
    };
  }

  if (typeof input === 'object') {
    return {
      name: input.name,
      gender: input.gender || 'non-binary',
      traits: parseTraits(input.traits),
      description: input.description,
    };
  }

  return null;
};

const buildStoryOptions = (body) => {
  const mainCharacter = normaliseCharacterInput(body.mainCharacter);
  const supportingCharacters = Array.isArray(body.supportingCharacters)
    ? body.supportingCharacters.map(normaliseCharacterInput).filter(Boolean)
    : [];

  return {
    theme: body.theme,
    genre: body.genre,
    targetAgeGroup: body.targetAgeGroup,
    storyLength: Number(body.storyLength) || 6,
    artStyle: body.artStyle,
    narrationTone: body.narrationTone,
    mainCharacter,
    supportingCharacters,
  };
};

const assertRequiredStoryFields = (body) => {
  const required = ['theme', 'genre', 'targetAgeGroup', 'storyLength'];
  const missing = required.filter((field) => !body[field]);

  if (missing.length > 0) {
    throw new HttpError(400, `Missing required fields: ${missing.join(', ')}`);
  }
};

const resolveNarratorVoice = async ({ narrationTone, voiceSampleBase64, voiceSampleFormat, useUserVoice, narrationVoiceId, narrationVoiceAlias }) => {
  if (!useUserVoice && narrationVoiceAlias && !narrationVoiceId) {
    const resolved = resolveVoiceId(narrationVoiceAlias, 'narrator');
    if (resolved) narrationVoiceId = resolved;
  }
  if (!useUserVoice && narrationVoiceId) {
    return {
      voiceId: narrationVoiceId,
      voiceSettings: {
        stability: 0.5,
        similarity_boost: 0.85,
        style: 0.2,
      },
    };
  }
  if (useUserVoice && voiceSampleBase64) {
    const cloned = await cloneVoiceFromSample({
      sampleBase64: voiceSampleBase64,
      sampleFormat: voiceSampleFormat ?? 'mp3',
      name: 'User Narrator',
    });

    if (!cloned?.voiceId) {
      throw new HttpError(502, 'Voice cloning completed without returning a voice ID.');
    }

    return {
      voiceId: cloned.voiceId,
      voiceSettings: {
        stability: 0.55,
        similarity_boost: 0.85,
        style: 0.2,
      },
    };
  }

  return matchNarrationVoice(narrationTone);
};

const resolveCharacterVoice = (character) => {
  const traits = parseTraits(character?.traits);
  const voiceId = matchCharacterVoice(traits);
  return {
    voiceId,
    voiceSettings: defaultCharacterVoiceSettings,
  };
};

export const generateStory = asyncHandler(async (req, res) => {
  assertRequiredStoryFields(req.body ?? {});

  const story = await createStory(buildStoryOptions(req.body));
  res.status(201).json(story);
});

export const buildStoryPipeline = asyncHandler(async (req, res) => {
  assertRequiredStoryFields(req.body ?? {});

  const story = await createStory(buildStoryOptions(req.body));
  const storyId = createStoryState({ story });

  console.log(`[pipeline] Story ${storyId}: received ${story.pages.length} scenes.`);

  const narratorConfig = await resolveNarratorVoice({
    narrationTone: req.body.narrationTone,
    voiceSampleBase64: req.body.voiceSampleBase64,
    voiceSampleFormat: req.body.voiceSampleFormat,
    useUserVoice: req.body.useUserVoiceForNarration,
    narrationVoiceId: req.body.narrationVoiceId,
    narrationVoiceAlias: req.body.narrationVoiceAlias,
  });

  const narratorVoiceId = narratorConfig?.voiceId || process.env.ELEVENLABS_NARRATOR_VOICE_ID;

  // Fire-and-forget background processing
  processStory({ storyId, story, narratorVoiceId }).catch((error) => {
    console.error(`[pipeline] Story ${storyId}: pipeline error`, error);
  });

  res.status(202).json({ storyId, story });
});

export const getStoryStatus = asyncHandler(async (req, res) => {
  const state = getStoryState(req.params.storyId);
  if (!state) {
    throw new HttpError(404, 'Story not found');
  }

  res.json({
    story: {
      title: state.story.title,
      logline: state.story.logline,
      characters: state.story.characters,
    },
    pages: state.pages,
    progress: state.progress,
    createdAt: state.createdAt,
  });
});

export const getStoryPage = asyncHandler(async (req, res) => {
  const { storyId, pageNumber } = req.params;
  const state = getStoryState(storyId);
  if (!state) {
    throw new HttpError(404, 'Story not found');
  }

  const pageNum = Number(pageNumber);
  const pageState = state.pages.find((p) => p.pageNumber === pageNum);
  const pageContent = state.story.pages.find((p) => p.pageNumber === pageNum);

  if (!pageState || !pageContent) {
    throw new HttpError(404, 'Page not found');
  }

  res.json({
    pageNumber: pageNum,
    status: pageState.status,
    assets: pageState.assets,
    content: pageContent,
  });
});

export const generateNarration = asyncHandler(async (req, res) => {
  const { text, voiceId, voiceSettings } = req.body;

  if (!text) {
    throw new HttpError(400, 'Text is required for narration.');
  }

  const narration = await synthesizeSpeech({ text, voiceId, voiceSettings });
  res.status(201).json(narration);
});

export const narratePages = asyncHandler(async (req, res) => {
  const { pages, voiceId: userVoiceId, voiceAlias } = req.body;
  if (!Array.isArray(pages) || pages.length === 0) {
    throw new HttpError(400, 'pages array is required.');
  }

  const overrideVoice = voiceAlias ? resolveVoiceId(voiceAlias, 'narrator') : null;
  const fixedVoiceId = overrideVoice || userVoiceId || resolveVoiceId(process.env.ELEVENLABS_NARRATOR_VOICE_ID, 'narrator') || process.env.ELEVENLABS_NARRATOR_VOICE_ID;
  if (!fixedVoiceId) {
    throw new HttpError(400, 'Missing narrator voice id. Provide voiceId or set ELEVENLABS_NARRATOR_VOICE_ID.');
  }

  const results = [];
  for (const page of pages) {
    const pageNumber = page.pageNumber ?? page.page ?? results.length + 1;
    
    // 나레이션 텍스트와 voice_settings 추출
    const narrationEntries = (page.timeline || [])
      .filter((entry) => entry.type === 'narration');
    
    const narrationText = narrationEntries
      .map((entry) => entry.text)
      .filter(Boolean)
      .join(' ');

    if (!narrationText) {
      results.push({ page: pageNumber, audio: null, audioUrl: null });
      continue;
    }

    // 첫 번째 나레이션 엔트리의 voice_settings 사용 (있다면)
    const voiceSettings = narrationEntries[0]?.voiceSettings || {
      stability: 0.85,
      similarity_boost: 0.8,
      style: 0.2,
      speed: 1.0
    };

    const tts = await synthesizeSpeech({ 
      text: narrationText, 
      voiceId: fixedVoiceId,
      voiceSettings 
    });
    const asset = await saveBase64Asset({
      data: tts.audioBase64,
      extension: 'mp3',
      directory: 'audio',
      fileName: `scene-${pageNumber}.mp3`,
    });

    results.push({ page: pageNumber, audio: asset.publicPath, audioUrl: asset.publicUrl });
  }

  res.status(201).json({ audios: results });
});

export const generateIllustrations = asyncHandler(async (req, res) => {
  const { prompt, pageNumber, artStyle, aspectRatio, seed } = req.body;

  if (!prompt) {
    throw new HttpError(400, 'Prompt is required to generate an illustration.');
  }

  const illustration = await generateSceneIllustration({
    prompt,
    pageNumber,
    artStyle,
    aspectRatio,
    seed,
  });

  res.status(201).json(illustration);
});

export const generateSceneImages = asyncHandler(async (req, res) => {
  console.log('🔧 Controller: Starting image generation...', { pagesCount: req.body.pages?.length, artStyle: req.body.artStyle, aspectRatio: req.body.aspectRatio });
  
  const { pages, artStyle = 'storybook', aspectRatio = '3:2' } = req.body;
  
  if (!Array.isArray(pages) || pages.length === 0) {
    console.error('🔧 Controller: Invalid pages array');
    throw new HttpError(400, 'pages array is required.');
  }

  const imageSeed = Math.floor(Math.random() * 10_000_000);
  console.log('🔧 Controller: Generated image seed:', imageSeed);
  const results = [];

  for (const page of pages) {
    const pageNumber = page.pageNumber ?? page.page ?? results.length + 1;
    const imagePrompt = page.imagePrompt || page.image_prompt;
    
    console.log(`🔧 Controller: Processing page ${pageNumber}...`, { hasPrompt: !!imagePrompt, prompt: imagePrompt?.substring(0, 100) + '...' });

    if (!imagePrompt) {
      console.warn(`🔧 Controller: No image prompt for page ${pageNumber}`);
      results.push({ page: pageNumber, image: null, imageUrl: null });
      continue;
    }

    try {
      console.log(`🔧 Controller: Calling generateSceneIllustration for page ${pageNumber}...`);
      const illustration = await generateSceneIllustration({
        prompt: imagePrompt,
        pageNumber,
        artStyle,
        aspectRatio,
        seed: imageSeed,
      });

      console.log(`🔧 Controller: Saving image asset for page ${pageNumber}...`);
      const imageAsset = await saveBase64Asset({
        data: illustration.imageBase64,
        extension: 'png',
        directory: 'images',
        fileName: `scene-${pageNumber}.png`,
      });

      console.log(`🔧 Controller: Successfully generated image for page ${pageNumber}:`, imageAsset.publicUrl);
      results.push({ 
        page: pageNumber, 
        image: imageAsset.publicPath, 
        imageUrl: imageAsset.publicUrl 
      });
    } catch (error) {
      console.error(`🔧 Controller: Failed to generate image for page ${pageNumber}:`, error.message, error);
      results.push({ page: pageNumber, image: null, imageUrl: null });
    }
  }

  console.log('🔧 Controller: Image generation completed:', { resultsCount: results.length, results });
  res.status(201).json({ images: results });
});
export const listElevenVoices = asyncHandler(async (_req, res) => {
  const voices = await listVoices();
  res.json({ voices });
});

export const generateStoryBundle = asyncHandler(async (req, res) => {
  assertRequiredStoryFields(req.body ?? {});

  const {
    createAudio = true,
    createImages = true,
    artStyle = 'storybook',
    aspectRatio = '3:2',
    narrationTone,
    narrationVoiceId,
    voiceSampleBase64,
    voiceSampleFormat,
    useUserVoiceForNarration,
  } = req.body;

  console.log('[bundle] start', { createAudio, createImages, artStyle, aspectRatio });
  const story = await createStory(buildStoryOptions(req.body));
  console.log('[bundle] story generated', { pages: story.pages?.length ?? 0, title: story.title });
  const narratorVoice = await resolveNarratorVoice({
    narrationTone,
    voiceSampleBase64,
    voiceSampleFormat,
    useUserVoice: useUserVoiceForNarration,
    narrationVoiceId,
    narrationVoiceAlias: req.body?.narrationVoiceAlias,
  });
  console.log('[bundle] narrator voice', { voiceId: narratorVoice.voiceId });

  const characterVoiceCache = new Map();
  const imageSeed = Math.floor(Math.random() * 10_000_000);

  const pages = [];

  for (const page of story.pages) {
    console.log('[bundle] page start', { page: page.pageNumber });
    const audioSegments = [];

    if (createAudio) {
      for (const beat of page.timeline) {
        if (beat.type === 'narration') {
          console.log('[bundle] tts narration', { page: page.pageNumber });
          const segment = await synthesizeSpeech({
            text: beat.text,
            voiceId: narratorVoice.voiceId,
            voiceSettings: narratorVoice.voiceSettings,
          });

          audioSegments.push({ type: 'narration', ...segment });
        }

        if (beat.type === 'character') {
          const cacheKey = beat.name?.toLowerCase() ?? 'character';
          if (!characterVoiceCache.has(cacheKey)) {
            characterVoiceCache.set(cacheKey, resolveCharacterVoice(beat));
          }

          const voiceProfile = characterVoiceCache.get(cacheKey);
          console.log('[bundle] tts character', { page: page.pageNumber, name: beat.name, voiceId: voiceProfile.voiceId });
          const segment = await synthesizeSpeech({
            text: beat.text,
            voiceId: voiceProfile.voiceId,
            voiceSettings: voiceProfile.voiceSettings,
          });

          audioSegments.push({
            type: 'character',
            name: beat.name,
            ...segment,
          });
        }

        if (beat.type === 'sfx') {
          console.log('[bundle] sfx', { page: page.pageNumber, description: beat.description });
          const effect = await generateSoundEffect({
            description: beat.description,
            placeholder: beat.placeholder,
          });

          audioSegments.push({ type: 'sfx', ...effect });
        }
      }
    }

    const mixedAudio = createAudio
      ? await mixPageAudio({ pageNumber: page.pageNumber, segments: audioSegments })
      : null;
    if (mixedAudio) {
      console.log('[bundle] audio saved', { page: page.pageNumber, path: mixedAudio.publicPath });
    }

    const illustration = createImages && page.imagePrompt
      ? await generateSceneIllustration({
          prompt: page.imagePrompt,
          pageNumber: page.pageNumber,
          artStyle,
          aspectRatio,
          seed: imageSeed,
        })
      : null;

    const imageAsset = illustration
      ? await saveBase64Asset({
          data: illustration.imageBase64,
          extension: 'png',
          directory: 'images',
          fileName: `page-${page.pageNumber}.png`,
        })
      : null;
    if (imageAsset) {
      console.log('[bundle] image saved', { page: page.pageNumber, path: imageAsset.publicPath });
    }

    pages.push({
      page: page.pageNumber,
      image: imageAsset?.publicPath ?? null,
      imageUrl: imageAsset?.publicUrl ?? null,
      audio: mixedAudio?.publicPath ?? null,
      audioUrl: mixedAudio?.publicUrl ?? null,
      text_md: timelineToMarkdown(page.timeline),
      timeline: page.timeline,
    });
  }

  console.log('[bundle] completed', { scenes: pages.length });
  res.status(201).json({
    story: {
      title: story.title,
      logline: story.logline,
      characters: story.characters,
    },
    pages,
  });
});

// Get list of available narrator voices
export const listNarratorVoices = asyncHandler(async (req, res) => {
  console.log('[narrator-voices] listing available narrator voices');
  
  res.status(200).json({
    voices: NARRATOR_VOICES,
    total: NARRATOR_VOICES.length
  });
});
