import axios from 'axios';

// 환경에 따른 API base URL 설정
const getBaseURL = () => {
  if (import.meta.env.PROD) {
    // 프로덕션 환경에서는 백엔드 URL을 설정
    return import.meta.env.VITE_API_URL || 'https://wsu-hackathon-backend.vercel.app/api';
  }
  // 개발 환경에서는 프록시 사용
  return '/api';
};

const client = axios.create({
  baseURL: getBaseURL(),
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

// Session management
export const createSession = async () => {
  try {
    const { data } = await client.post('/story/session');
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const getStoriesBySession = async (sessionId) => {
  try {
    const { data } = await client.get(`/story/session/${sessionId}/stories`);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const getSessionStats = async (sessionId) => {
  try {
    const { data } = await client.get(`/story/session/${sessionId}/stats`);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const getAllStories = async (page = 1, limit = 16) => {
  try {
    const { data } = await client.get(`/story/stories?page=${page}&limit=${limit}`);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

// Story management
export const getStoryById = async (storyId) => {
  try {
    const { data } = await client.get(`/story/story/${storyId}`);
    return data;
  } catch (error) {
    throw new Error(unwrap(error));
  }
};

export const getStoryLogs = async (storyId) => {
  try {
    const { data } = await client.get(`/story/story/${storyId}/logs`);
    return data;
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
