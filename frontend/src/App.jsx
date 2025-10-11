import StoryForm from './components/StoryForm.jsx';
import StoryPager from './components/StoryPager.jsx';
import StoryPipelineStatus from './components/StoryPipelineStatus.jsx';
import { useStorybook } from './hooks/useStorybook.js';

const statusCopy = {
  idle: 'Ready',
  generating: 'Spinning up pipeline…',
  polling: 'Directing scenes…',
  narrating: 'Creating narration…',
};

const App = () => {
  const {
    story,
    pages,
    status,
    isLoading,
    latestError,
    startStoryPipeline,
    generateNarrationOnly,
    isPipelineActive,
    pipelineMessage,
    progress,
  } = useStorybook();

  const handleGenerate = async (payload) => {
    try {
      await startStoryPipeline(payload);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNarration = async () => {
    try {
      await generateNarrationOnly();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-white pb-16">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold text-slate-900">Storybook Studio</h1>
            <p className="text-sm text-slate-500">Create cinematic storybooks with rich narratives, compelling characters, and stunning visuals.</p>
          </div>
          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            {statusCopy[status] ?? 'Working…'}
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-10 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="sticky top-6 self-start">
          <StoryForm onGenerate={handleGenerate} isLoading={isLoading} latestError={latestError} submitLabel="Create story" />
        </section>

        <section className="flex flex-col gap-6">
          {isPipelineActive && (
            <StoryPipelineStatus progress={progress} message={pipelineMessage} pages={pages} />
          )}
          <div className="flex items-center justify-end">
            <button onClick={handleNarration} disabled={isLoading || isPipelineActive}>
              {status === 'narrating' ? 'Generating narration…' : 'Generate narration (narrator only)'}
            </button>
          </div>
          <StoryPager story={story} pages={pages} />
        </section>
      </main>

      {latestError && (
        <div className="fixed bottom-6 right-6 max-w-sm rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600 shadow-lg">
          {latestError}
        </div>
      )}
    </div>
  );
};

export default App;
