import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
  timeout: 180000,
});

const unwrap = (error) => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }

  return error.message || 'Unexpected error';
};

export const generateStory = async (payload) => {
  try {
    const { data } = await client.post('/story/generate', payload);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const generateBundle = async (payload) => {
  try {
    const { data } = await client.post('/story/bundle', payload);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const buildStory = async (payload) => {
  try {
    const { data } = await client.post('/story/build', payload);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const narratePages = async ({ pages, voiceId }) => {
  try {
    const { data } = await client.post('/story/narrate-pages', { pages, voiceId });
    return data.audios;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const fetchStoryStatus = async (storyId) => {
  try {
    const { data } = await client.get(`/story/${storyId}/status`);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const fetchStoryPage = async (storyId, pageNumber) => {
  try {
    const { data } = await client.get(`/story/${storyId}/page/${pageNumber}`);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const generateNarration = async (payload) => {
  try {
    const { data } = await client.post('/story/narrate', payload);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const generateIllustration = async (payload) => {
  try {
    const { data } = await client.post('/story/illustrate', payload);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const generateSceneImages = async (payload) => {
  try {
    console.log('🌐 API: Sending image generation request...', payload);
    const { data } = await client.post('/story/generate-images', payload);
    console.log('🌐 API: Received image generation response:', data);
    return data.images;
  } catch (error) {
    console.error('🌐 API: Image generation request failed:', error);
    throw new Error(unwrap(error));
  }
};

export const fetchNarratorVoices = async () => {
  try {
    const { data } = await client.get('/story/narrator-voices');
    return data.voices;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export default {
  generateStory,
  generateBundle,
  buildStory,
  generateNarration,
  generateIllustration,
  generateSceneImages,
  narratePages,
  fetchStoryStatus,
  fetchStoryPage,
  fetchNarratorVoices,
};
