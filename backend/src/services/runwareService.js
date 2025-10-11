import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { HttpError } from '../utils/errorHandlers.js';

const RUNWARE_URL = 'https://api.runware.ai/v1';

const requireApiKey = () => {
  if (!process.env.RUNWARE_API_KEY) {
    throw new HttpError(500, 'RUNWARE_API_KEY is not configured.');
  }
};

const getArtStyleDescription = (artStyle) => {
  const styleMap = {
    'storybook': 'storybook illustration style, warm and inviting',
    'watercolor': 'watercolor painting style, soft and flowing',
    'digital-painting': 'digital painting style, detailed and vibrant',
    'paper-cut': 'paper cut art style, layered and dimensional',
    'comic': 'comic book art style, bold and dynamic',
    'photorealistic': 'photorealistic style, highly detailed and lifelike',
    'oil-painting': 'oil painting style, rich textures and colors',
    'sketch': 'pencil sketch style, artistic and expressive',
    'anime': 'anime art style, colorful and stylized',
    'cartoon': 'cartoon art style, fun and playful',
    'cinematic': 'cinematic art style, dramatic lighting and composition',
    'fantasy-art': 'fantasy art style, magical and ethereal'
  };
  
  return styleMap[artStyle] || 'storybook illustration style, warm and inviting';
};

const getAspectRatioDimensions = (aspectRatio) => {
  const ratioMap = {
    '1:1': { width: 1024, height: 1024 },
    '4:3': { width: 1024, height: 768 },
    '3:2': { width: 1024, height: 683 },
    '16:9': { width: 1024, height: 576 },
    '21:9': { width: 1024, height: 439 }
  };
  
  return ratioMap[aspectRatio] || { width: 1024, height: 683 }; // Default to 3:2
};

export const generateSceneIllustration = async ({
  prompt,
  pageNumber,
  artStyle = 'Storybook',
  aspectRatio = '3:2',
  seed,
  characterReferences = [],
}) => {
  console.log(`🎨 Runware: Starting image generation for page ${pageNumber}...`, { 
    prompt: prompt.substring(0, 100) + '...', 
    artStyle, 
    aspectRatio, 
    seed,
    characterReferencesCount: characterReferences.length 
  });
  
  requireApiKey();

  try {
    // Process character references
    const referenceImages = [];
    if (characterReferences && characterReferences.length > 0) {
      for (const ref of characterReferences) {
        if (ref.imageBase64) {
          // Convert base64 to buffer for Runware API
          const base64Data = ref.imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
          referenceImages.push({
            id: ref.id,
            characterName: ref.characterName,
            imageBase64: base64Data
          });
        }
      }
    }

    // Enhance prompt for better consistency and quality
    const artStyleDescription = getArtStyleDescription(artStyle);
    let enhancedPrompt = prompt;
    
    if (referenceImages.length > 0) {
      // Add character reference information to prompt
      const characterInfo = referenceImages.map(ref => 
        `Character ${ref.id} (${ref.characterName}): Use this reference image to maintain consistent appearance`
      ).join('. ');
      
      enhancedPrompt = `${prompt}. ${characterInfo}. Maintain consistent character appearance and art style from reference images. ${artStyleDescription}, high quality digital illustration, clean composition, professional artwork.`;
    } else {
      enhancedPrompt = `${prompt}. ${artStyleDescription}, high quality digital illustration, consistent character design, clean composition, professional artwork, vibrant colors, detailed rendering.`;
    }

    console.log(`🎨 Runware: Calling Runware API for page ${pageNumber}...`);
    const taskUUID = uuidv4();
    const dimensions = getAspectRatioDimensions(aspectRatio);
    const payload = [
      {
        taskUUID: taskUUID,
        taskType: 'imageInference',
        numberResults: 1,
        outputFormat: 'JPEG',
        width: dimensions.width,
        height: dimensions.height,
        seed: seed || undefined,
        includeCost: false,
        model: 'bytedance:5@0',
        positivePrompt: enhancedPrompt,
        referenceImages: referenceImages.length > 0 ? referenceImages : undefined,
      }
    ];

    console.log(`🎨 Runware: Payload for page ${pageNumber}`, { 
      taskUUID: taskUUID,
      referenceImagesCount: referenceImages.length,
      promptLength: enhancedPrompt.length,
      model: 'bytedance:5@0 (Seedream 4.0)',
      outputFormat: payload[0].outputFormat,
      dimensions: `${payload[0].width}x${payload[0].height}`,
      aspectRatio: aspectRatio,
      artStyle: artStyle,
      seed: payload[0].seed
    });

    const response = await axios.post(
      RUNWARE_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.RUNWARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes timeout for image generation
      }
    );

    const { data } = response;
    console.log(`🎨 Runware: Raw response data for page ${pageNumber}:`, data);
    
    const result = Array.isArray(data) ? data[0] : data;
    console.log(`🎨 Runware: Processed result for page ${pageNumber}:`, result);
    console.log(`🎨 Runware: ImageURL check for page ${pageNumber}:`, {
      hasImageURL: !!result?.imageURL,
      imageURL: result?.imageURL,
      imageUUID: result?.imageUUID,
      cost: result?.cost,
      seed: result?.seed
    });

    if (!result?.imageURL) {
      console.error(`🎨 Runware: No image URL returned for page ${pageNumber}:`, result);
      throw new HttpError(502, 'Runware did not return image URL', result);
    }

    console.log(`🎨 Runware: Successfully generated image for page ${pageNumber}`);
    return {
      pageNumber,
      prompt,
      imageURL: result.imageURL, // Return URL directly instead of base64
      meta: {
        aspectRatio,
        artStyle,
        imageUUID: result.imageUUID,
        seed: result.seed,
        model: 'seedream-4.0',
        cost: result.cost,
      },
    };
  } catch (error) {
    console.error(`🎨 Runware: Error generating image for page ${pageNumber}:`, error.message, error.response?.data);
    
    if (error.response) {
      const errorData = error.response.data;
      console.error(`🎨 Runware: API Error Details:`, errorData);
      throw new HttpError(error.response.status, 'Runware API error', errorData);
    }

    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(500, 'Failed to generate illustration with Runware.', {
      message: error.message,
      prompt,
      pageNumber,
    });
  }
};
