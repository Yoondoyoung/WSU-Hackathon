import { useMemo, useState } from 'react';

const statusBadge = {
  pending: 'bg-slate-100 text-slate-600 border border-slate-200',
  processing: 'bg-amber-100 text-amber-700 border border-amber-200',
  completed: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
  failed: 'bg-rose-100 text-rose-700 border border-rose-200',
};

const getStatusClass = (status) => statusBadge[status] || 'bg-slate-100 text-slate-600 border border-slate-200';

const getLatestLog = (page) => {
  if (!page?.logs?.length) return null;
  return page.logs[page.logs.length - 1];
};

const StoryPager = ({ story, pages }) => {
  const [index, setIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  const total = pages?.length || 0;

  const current = useMemo(() => {
    if (!pages || pages.length === 0) return null;
    return pages[Math.min(Math.max(index, 0), pages.length - 1)];
  }, [index, pages]);

  if (!story || !pages || pages.length === 0) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        <p className="text-sm">Your generated story will appear here.</p>
        <p className="text-xs text-slate-400">Fill out the form and click "Create story" to begin.</p>
      </section>
    );
  }

  const goPrev = () => {
    setIndex((i) => Math.max(i - 1, 0));
    setImageError(false); // Reset image error when changing pages
  };
  const goNext = () => {
    setIndex((i) => Math.min(i + 1, total - 1));
    setImageError(false); // Reset image error when changing pages
  };

  // 우선순위: Runware URL > 로컬 URL > 기타
  const imageSrc = current?.imageUrl || current?.assets?.image || current?.image;
  const audioSrc = current?.audioUrl || current?.assets?.audio;
  const status = current?.status || 'pending';
  const latestLog = getLatestLog(current);

  return (
    <section className="flex h-full flex-col gap-4 overflow-hidden rounded-xl bg-white p-6 shadow-lg">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{story.title || 'Story'}</h2>
          {story.logline && <p className="text-sm text-slate-500">{story.logline}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={goPrev}
            disabled={index === 0}
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500">{index + 1} / {total}</span>
          <button type="button" onClick={goNext} disabled={index >= total - 1}>
            Next →
          </button>
        </div>
      </header>

      {current && (
        <article className="flex flex-col gap-4 rounded-lg border border-slate-200 p-4">
          {/* 상단: 이미지 */}
          <div className="aspect-[16/9] overflow-hidden rounded-lg border border-slate-200 bg-slate-100 relative group">
            {imageSrc && !imageError ? (
              <>
                <img
                  src={imageSrc}
                  alt={current.title || `Scene ${current.pageNumber || current.page}`}
                  className="h-full w-full object-cover"
                  onError={() => setImageError(true)}
                  onLoad={() => setImageError(false)}
                />
                {/* 호버 시 프롬프트 툴팁 */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-white rounded-lg p-4 m-4 max-w-md max-h-64 overflow-y-auto shadow-lg">
                    <div className="text-xs font-semibold text-slate-700 mb-2">Image Prompt:</div>
                    <p className="text-xs text-slate-600 whitespace-pre-line">
                      {current.imagePrompt || current.image_prompt || 'No prompt provided.'}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center p-4 text-sm text-slate-600">
                <div className="text-center">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {imageError ? 'Image failed to load' : 'Illustration prompt'}
                  </div>
                  <p className="whitespace-pre-line text-xs">
                    {current.imagePrompt || current.image_prompt || 'No prompt provided.'}
                  </p>
                  {imageSrc && imageError && (
                    <p className="mt-2 text-xs text-red-500">
                      URL: {imageSrc}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 중단: 스토리 */}
          <div className="flex flex-col gap-3">
            <header className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Scene {current.pageNumber || current.page}
                {current.title ? `: ${current.title}` : ''}
              </span>
              <span className={`rounded-full px-2 py-1 text-[11px] font-medium ${getStatusClass(status)}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </header>

            {Array.isArray(current.timeline) && current.timeline.length > 0 ? (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <ul className="space-y-2">
                  {current.timeline.map((entry, i) => (
                    <li
                      key={`${current.pageNumber || current.page}-${i}`}
                      className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700"
                    >
                      {entry.type === 'character' ? (
                        <span className="font-semibold text-primary">{entry.name || 'Character'}: </span>
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
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {current.text || current.summary}
                </p>
              </div>
            )}

            {latestLog && (
              <p className="text-xs text-slate-400">
                {new Date(latestLog.timestamp).toLocaleTimeString()}: {latestLog.message}
              </p>
            )}
          </div>

          {/* 하단: 오디오 재생 바 */}
          {audioSrc && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-semibold text-slate-600">Audio</span>
              </div>
              <audio 
                controls 
                className="w-full" 
                preload="auto"
                style={{ 
                  height: '40px',
                  borderRadius: '8px'
                }}
              >
                <source src={audioSrc} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            </div>
          )}
        </article>
      )}
    </section>
  );
};

export default StoryPager;
