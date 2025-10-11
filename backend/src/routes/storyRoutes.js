import { Router } from 'express';
import {
  generateStory,
  generateNarration,
  generateIllustrations,
  generateSceneImages,
  generateStoryBundle,
  listElevenVoices,
  listNarratorVoices,
  narratePages,
  buildStoryPipeline,
  getStoryStatus,
  getStoryPage,
  getStoriesBySessionId,
  getStoryById,
  getSessionStatistics,
  getStoryGenerationLogs,
  createNewSession,
} from '../controllers/storyController.js';
import {
  ENABLE_AUDIO,
  ENABLE_IMAGES,
  ENABLE_BUNDLE,
  ENABLE_ELEVEN_ENDPOINTS,
  disabledHandler,
} from '../utils/features.js';

const router = Router();

// Session management
router.post('/session', createNewSession);
router.get('/session/:sessionId/stories', getStoriesBySessionId);
router.get('/session/:sessionId/stats', getSessionStatistics);

// Story management
router.post('/generate', generateStory);
router.post('/build', buildStoryPipeline);
router.get('/story/:storyId/status', (req, res, next) => {
  console.log(`[storyRoutes] GET /story/${req.params.storyId}/status - Route matched`);
  next();
}, getStoryStatus);
router.get('/story/:storyId/logs', getStoryGenerationLogs);
router.get('/story/:storyId', getStoryById);

// Legacy endpoints
router.post('/narrate', ENABLE_AUDIO && ENABLE_ELEVEN_ENDPOINTS ? generateNarration : disabledHandler('Narration'));
router.post('/illustrate', ENABLE_IMAGES ? generateIllustrations : disabledHandler('Illustration'));
router.post('/generate-images', ENABLE_IMAGES ? generateSceneImages : disabledHandler('Generate Images'));
router.post('/bundle', ENABLE_BUNDLE ? generateStoryBundle : disabledHandler('Bundle'));
router.get('/voices', ENABLE_ELEVEN_ENDPOINTS ? listElevenVoices : disabledHandler('Voices'));
router.get('/narrator-voices', listNarratorVoices);
router.post('/narrate-pages', ENABLE_AUDIO && ENABLE_ELEVEN_ENDPOINTS ? narratePages : disabledHandler('Narrate pages'));
router.get('/story/:storyId/page/:pageNumber', getStoryPage);

export default router;
