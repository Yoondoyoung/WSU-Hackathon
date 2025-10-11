import { useNavigate } from 'react-router-dom';
import StoryForm from '../components/StoryForm.jsx';
import StoryPager from '../components/StoryPager.jsx';
import StoryPipelineStatus from '../components/StoryPipelineStatus.jsx';
import { useStorybook } from '../hooks/useStorybook.js';

const statusCopy = {
  idle: 'Ready',
  generating: 'Spinning up pipeline…',
  polling: 'Directing scenes…',
  narrating: 'Creating narration…',
};

const CreatePage = () => {
  const navigate = useNavigate();
  
  const {
    story,
    pages,
    status,
    isLoading,
    latestError,
    startStoryPipeline,
    isPipelineActive,
    pipelineMessage,
    progress,
  } = useStorybook(() => {
    // When story generation is completed, switch to library view
    navigate('/library');
  });

  const handleGenerate = async (payload) => {
    try {
      await startStoryPipeline(payload);
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-secondary/10 to-white pb-16">
      <header className="border-b border-white/60 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 truncate">Storybook Studio</h1>
            <p className="text-xs sm:text-sm text-slate-500 hidden sm:block">Create cinematic storybooks with rich narratives, compelling characters, and stunning visuals.</p>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium bg-purple-500 text-white shadow-sm"
              >
                Create
              </button>
              <button
                onClick={() => navigate('/library')}
                className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm font-medium bg-white text-gray-600 hover:text-gray-900 transition-colors"
              >
                Library
              </button>
            </div>
            <span className="rounded-full border border-primary/30 bg-primary/10 px-2 sm:px-3 py-1 text-xs font-medium text-primary flex items-center gap-2">
              {isLoading && (
                <div className="h-3 w-3 animate-spin rounded-full border border-primary border-t-transparent"></div>
              )}
              {statusCopy[status] ?? 'Working…'}
            </span>
          </div>
        </div>
      </header>


      <main className="mx-auto grid max-w-6xl gap-4 sm:gap-6 px-4 py-6 sm:py-10 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="lg:sticky lg:top-6 lg:self-start">
          <StoryForm onGenerate={handleGenerate} isLoading={isLoading} latestError={latestError} submitLabel="Create story" />
        </section>

        <section className="flex flex-col gap-4 sm:gap-6">
          {isPipelineActive && (
            <StoryPipelineStatus progress={progress} message={pipelineMessage} pages={pages} />
          )}
          <StoryPager story={story} pages={pages || []} />
        </section>
      </main>

      {latestError && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 max-w-xs sm:max-w-sm rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4 text-xs sm:text-sm text-red-600 shadow-lg">
          {latestError}
        </div>
      )}
    </div>
  );
};

export default CreatePage;
