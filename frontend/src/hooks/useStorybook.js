import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  buildStory,
  narratePages,
  fetchStoryStatus,
} from '../lib/api.js';

const isSceneDone = (page) => page.status === 'completed' || page.status === 'failed';

export const useStorybook = (onStoryCompleted) => {
  const [story, setStory] = useState(null);
  const [pages, setPages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [errorMessages, setErrorMessages] = useState([]);
  const [lastPayload, setLastPayload] = useState(null);
  const [storyId, setStoryId] = useState(null);
  const [progress, setProgress] = useState(0);

  const pollingRef = useRef(null);

  const setError = useCallback((message) => {
    setErrorMessages((prev) => [...prev, message]);
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    stopPolling();
    setStory(null);
    setPages([]);
    setStatus('idle');
    setErrorMessages([]);
    setLastPayload(null);
    setStoryId(null);
    setProgress(0);
  }, [stopPolling]);

  const startStoryPipeline = useCallback(async (payload) => {
    setStatus('generating');
    setErrorMessages([]);
    setLastPayload(payload);

    try {
      const data = await buildStory(payload);
      const baseStory = data.story ?? {};
      setStory({
        title: baseStory.title,
        logline: baseStory.logline,
        characters: baseStory.characters,
      });
      setPages(
        (baseStory.pages || []).map((page) => ({
          ...page,
          status: 'pending',
          assets: {},
          logs: [],
          errors: [],
        }))
      );
      setStoryId(data.storyId);
      setProgress(0);
      setStatus('polling');
    } catch (error) {
      setError(error.message);
      setStatus('idle');
      throw error;
    }
  }, [setError]);

  useEffect(() => {
    if (!storyId || status !== 'polling') {
      stopPolling();
      return;
    }

    const poll = async () => {
      try {
        const data = await fetchStoryStatus(storyId);
        setProgress(data.progress ?? 0);

        setPages((prev) =>
          prev.map((page) => {
            const statePage = data.pages?.find((p) => p.pageNumber === page.pageNumber);
            if (!statePage) {
              return page;
            }
            return {
              ...page,
              status: statePage.status,
              assets: statePage.assets || page.assets || {},
              logs: statePage.logs || [],
              errors: statePage.errors || [],
            };
          })
        );

        if (data.story) {
          setStory((prev) => ({
            title: data.story.title ?? prev?.title,
            logline: data.story.logline ?? prev?.logline,
            characters: data.story.characters ?? prev?.characters,
          }));
        }

        const done = data.pages?.every(isSceneDone);
        if (done) {
          stopPolling();
          setStatus('idle');
          // Call callback when story generation is completed
          if (onStoryCompleted) {
            onStoryCompleted();
          }
        }
      } catch (error) {
        stopPolling();
        setStatus('idle');
        setError(error.message);
      }
    };

    // Initial poll & start interval
    poll();
    pollingRef.current = setInterval(poll, 2000);

    return () => {
      stopPolling();
    };
  }, [storyId, status, stopPolling]);

  const generateNarrationOnly = useCallback(async (voiceId) => {
    if (!pages.length) {
      const err = new Error('Please generate a story first.');
      setError(err.message);
      throw err;
    }
    setStatus('narrating');
    try {
      const audios = await narratePages({
        pages,
        voiceId,
        voiceAlias: lastPayload?.narrationVoiceAlias,
      });
      setPages((prev) =>
        prev.map((p) => {
          const found = audios.find((a) => a.page === (p.pageNumber ?? p.page));
          if (!found) return p;
          return {
            ...p,
            assets: {
              ...(p.assets || {}),
              audio: found.audioUrl,
              narration: found.audioUrl,
            },
            audioUrl: found.audioUrl,
            audio: found.audio,
          };
        })
      );
      return audios;
    } catch (e) {
      setError(e.message);
      throw e;
    } finally {
      setStatus('idle');
    }
  }, [pages, lastPayload, setError]);

  const isPipelineActive = status === 'polling' || status === 'generating';
  const isLoading = status !== 'idle';

  const latestError = useMemo(
    () => errorMessages[errorMessages.length - 1] ?? null,
    [errorMessages]
  );

  const pipelineMessage = useMemo(() => {
    if (!isPipelineActive) {
      return null;
    }

    const processingPage = pages.find((p) => p.status === 'processing');
    if (processingPage?.logs?.length) {
      return processingPage.logs[processingPage.logs.length - 1].message;
    }

    const pendingPage = pages.find((p) => p.status === 'pending');
    if (pendingPage) {
      return `Story engine is outlining scene ${pendingPage.pageNumber}...`;
    }

    const failedPage = pages.find((p) => p.status === 'failed');
    if (failedPage?.errors?.length) {
      return `Scene ${failedPage.pageNumber} stumbled: ${failedPage.errors[failedPage.errors.length - 1].message}`;
    }

    return 'Polishing the final touches...';
  }, [isPipelineActive, pages]);

  return {
    story,
    pages,
    status,
    isLoading,
    isPipelineActive,
    pipelineMessage,
    progress,
    errorMessages,
    latestError,
    lastPayload,
    storyId,
    startStoryPipeline,
    generateNarrationOnly,
    reset,
  };
};

export default useStorybook;
