import { useState, useEffect, useRef } from 'react';
import { fetchStoryStatus } from '../lib/api.js';

const StoryViewer = ({ storyId, onBack }) => {
  const [story, setStory] = useState(null);
  const [pages, setPages] = useState([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoPlay, setAutoPlay] = useState(true);
  const audioRef = useRef(null);

  useEffect(() => {
    const loadStory = async () => {
      try {
        setLoading(true);
        const data = await fetchStoryStatus(storyId);
        setStory(data.story);
        setPages(data.pages || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      loadStory();
    }
  }, [storyId]);

  const currentPage = pages[currentPageIndex];
  const audioSrc = currentPage?.assets?.audio;

  // 페이지가 변경될 때 음성 자동 재생
  useEffect(() => {
    if (autoPlay && audioRef.current && audioSrc) {
      // 이전 음성 정지
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // 오디오 소스 강제 업데이트
      audioRef.current.load();
      
      // 새 음성 재생
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().catch(error => {
            console.log('Auto-play was prevented:', error);
            setAutoPlay(false);
          });
        }
      }, 200);
    }
  }, [currentPageIndex, audioSrc, autoPlay]);

  const goToNextPage = () => {
    // 현재 재생 중인 음성 정지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (currentPageIndex < pages.length - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPrevPage = () => {
    // 현재 재생 중인 음성 정지
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading story</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Back to Library
        </button>
      </div>
    );
  }

  if (!story || !currentPage) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Story not found</h3>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
        >
          Back to Library
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={onBack}
          className="flex items-center px-3 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-purple-500 hover:text-white hover:border-purple-500 transition-colors duration-200 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Library
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{story.title}</h1>
            {story.logline && (
              <p className="text-gray-600 mt-1">{story.logline}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPageIndex === 0}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-sm text-gray-500 px-3">
              {currentPageIndex + 1} / {pages.length}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPageIndex === pages.length - 1}
              className="p-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Story Content */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* 상단: 이미지 */}
        <div className="aspect-[16/9] overflow-hidden bg-slate-100">
          {currentPage.assets?.image ? (
            <img
              src={currentPage.assets.image}
              alt={currentPage.title || `Scene ${currentPage.pageNumber}`}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center p-4 text-sm text-slate-600">
              <div className="text-center">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  No image available
                </div>
                <p className="whitespace-pre-line text-xs">
                  {currentPage.imagePrompt || 'No prompt provided.'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 중단: 대사들 */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <span className="text-sm font-semibold uppercase tracking-wide text-orange-600">
              Scene {currentPage.pageNumber}
              {currentPage.title ? `: ${currentPage.title}` : ''}
            </span>
          </div>

          {Array.isArray(currentPage.timeline) && currentPage.timeline.length > 0 ? (
            <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
              <ul className="space-y-3">
                {currentPage.timeline.map((entry, i) => (
                  <li
                    key={`${currentPage.pageNumber}-${i}`}
                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
                  >
                    {entry.type === 'character' ? (
                      <span className="font-semibold text-orange-600">{entry.name || 'Character'}: </span>
                    ) : entry.type === 'narration' ? (
                      <span className="font-semibold text-slate-600">Narrator: </span>
                    ) : entry.type === 'sfx' ? (
                      <span className="font-semibold text-amber-600">SFX: </span>
                    ) : null}
                    {entry.text || entry.description}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm text-slate-500">No content available for this scene.</p>
            </div>
          )}
        </div>

        {/* 하단: 오디오 바 */}
        {currentPage.assets?.audio && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 sm:p-6">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-sm font-semibold text-slate-600">Audio</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoPlay(!autoPlay)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  autoPlay 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {autoPlay ? 'Auto-play ON' : 'Auto-play OFF'}
              </button>
            </div>
            <audio 
              key={`audio-${currentPageIndex}-${audioSrc}`}
              ref={audioRef}
              controls 
              className="w-full" 
              preload="auto"
              style={{ 
                height: '40px',
                borderRadius: '8px'
              }}
            >
              <source src={currentPage.assets.audio} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;

