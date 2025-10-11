import axios from 'axios';
import { HttpError } from '../utils/errorHandlers.js';

const RUNWARE_URL = 'https://api.runware.ai/v1/images/generate';

const requireApiKey = () => {
  if (!process.env.RUNWARE_API_KEY) {
    throw new HttpError(500, 'RUNWARE_API_KEY is not configured.');
  }
};

export const generateSceneIllustration = async ({
  prompt,
  pageNumber,
  artStyle = 'storybook',
  aspectRatio = '3:2',
  seed,
  referenceImage,
}) => {
  console.log(`🎨 Runware: Starting image generation for page ${pageNumber}...`, { prompt: prompt.substring(0, 100) + '...', artStyle, aspectRatio, seed });
  
  requireApiKey();

  try {
    console.log(`🎨 Runware: Calling Runware API for page ${pageNumber}...`);
    const payload = {
      taskType: 'imageInference',
      inputs: [
        {
          prompt,
          aspect_ratio: aspectRatio,
          style: artStyle,
          model: 'seedream-4.0',
          seed,
          negative_prompt: 'blurry, violent, scary, photorealistic, inconsistent characters',
          steps: 30,
          guidance_scale: 7.4,
          reference_images: referenceImage ? [referenceImage] : undefined,
          character_reference_strength: referenceImage ? 0.8 : undefined,
        },
      ],
    };

    console.log(`🎨 Runware: Payload for page ${pageNumber}`, { hasReference: !!referenceImage });

    const response = await axios.post(
      RUNWARE_URL,
      payload,
      {
        headers: {
          Authorization: `Bearer ${process.env.RUNWARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { data } = response;
    const result = Array.isArray(data) ? data[0] : data;
    console.log(`🎨 Runware: Received response for page ${pageNumber}:`, { hasImageData: !!result?.image_base64, requestId: result?.request_id });

    if (!result?.image_base64) {
      console.error(`🎨 Runware: No image data returned for page ${pageNumber}:`, result);
      throw new HttpError(502, 'Runware did not return image data', result);
    }

    console.log(`🎨 Runware: Successfully generated image for page ${pageNumber}`);
    return {
      pageNumber,
      prompt,
      imageBase64: result.image_base64,
      meta: {
        aspectRatio,
        artStyle,
        requestId: result.request_id,
        seed: result.parameters?.seed ?? seed,
      },
    };
  } catch (error) {
    console.error(`🎨 Runware: Error generating image for page ${pageNumber}:`, error.message, error.response?.data);
    
    if (error.response) {
      throw new HttpError(error.response.status, 'Runware API error', error.response.data);
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
