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

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`[storyRoutes] ${req.method} ${req.originalUrl} - Request received`);
  console.log(`[storyRoutes] Base URL: ${req.baseUrl}, Path: ${req.path}`);
  next();
});

// Session management
router.post('/session', createNewSession);
router.get('/session/:sessionId/stories', getStoriesBySessionId);
router.get('/session/:sessionId/stats', getSessionStatistics);

// Story management
router.post('/generate', generateStory);
router.post('/build', buildStoryPipeline);

// Legacy endpoints (must come before parameterized routes)
router.post('/narrate', ENABLE_AUDIO && ENABLE_ELEVEN_ENDPOINTS ? generateNarration : disabledHandler('Narration'));
router.post('/illustrate', ENABLE_IMAGES ? generateIllustrations : disabledHandler('Illustration'));
router.post('/generate-images', ENABLE_IMAGES ? generateSceneImages : disabledHandler('Generate Images'));
router.post('/bundle', ENABLE_BUNDLE ? generateStoryBundle : disabledHandler('Bundle'));
router.get('/voices', ENABLE_ELEVEN_ENDPOINTS ? listElevenVoices : disabledHandler('Voices'));
router.get('/narrator-voices', listNarratorVoices);
router.post('/narrate-pages', ENABLE_AUDIO && ENABLE_ELEVEN_ENDPOINTS ? narratePages : disabledHandler('Narrate pages'));

// Parameterized routes (must come after specific routes)
router.get('/:storyId/status', (req, res, next) => {
  console.log(`[storyRoutes] GET /${req.params.storyId}/status - Route matched`);
  next();
}, getStoryStatus);

router.get('/:storyId/logs', (req, res, next) => {
  console.log(`[storyRoutes] GET /${req.params.storyId}/logs - Route matched`);
  next();
}, getStoryGenerationLogs);

router.get('/:storyId/page/:pageNumber', getStoryPage);

router.get('/:storyId', (req, res, next) => {
  console.log(`[storyRoutes] GET /${req.params.storyId} - Route matched`);
  next();
}, getStoryById);

export default router;
