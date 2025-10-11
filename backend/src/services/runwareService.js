import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { HttpError } from '../utils/errorHandlers.js';

const RUNWARE_URL = 'https://api.runware.ai/v1';

const requireApiKey = () => {
  if (!process.env.RUNWARE_API_KEY) {
    throw new HttpError(500, 'RUNWARE_API_KEY is not configured.');
  }
};

export const generateSceneIllustration = async ({
  prompt,
  pageNumber,
  artStyle = 'cinematic illustration',
  aspectRatio = '16:9',
  seed,
  referenceImage,
}) => {
  console.log(`🎨 Runware: Starting image generation for page ${pageNumber}...`, { 
    prompt: prompt.substring(0, 100) + '...', 
    artStyle, 
    aspectRatio, 
    seed,
    hasReference: !!referenceImage 
  });
  
  requireApiKey();

  try {
    // Enhance prompt for better consistency and quality (no negative prompt needed)
    const enhancedPrompt = referenceImage 
      ? `${prompt}. Maintain consistent character appearance and art style from previous scenes. High quality digital illustration, clean composition, professional artwork.`
      : `${prompt}. High quality digital illustration, consistent character design, storybook art style, clean composition, professional artwork, vibrant colors, detailed rendering.`;

    console.log(`🎨 Runware: Calling Runware API for page ${pageNumber}...`);
    const taskUUID = uuidv4();
    const payload = [
      {
        taskUUID: taskUUID,
        taskType: 'imageInference',
        numberResults: 1,
        outputFormat: 'JPEG',
        width: 1024,
        height: 1024,
        seed: seed || undefined,
        includeCost: false,
        model: 'bytedance:5@0',
        positivePrompt: enhancedPrompt,
      }
    ];

    console.log(`🎨 Runware: Payload for page ${pageNumber}`, { 
      taskUUID: taskUUID,
      hasReference: !!referenceImage,
      promptLength: enhancedPrompt.length,
      model: 'bytedance:5@0 (Seedream 4.0)',
      outputFormat: payload[0].outputFormat,
      dimensions: `${payload[0].width}x${payload[0].height}`,
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
    const result = Array.isArray(data) ? data[0] : data;
    console.log(`🎨 Runware: Received response for page ${pageNumber}:`, { 
      hasImageURL: !!result?.imageURL, 
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
