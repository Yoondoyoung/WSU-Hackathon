const statusNotes = {
  pending: 'Waiting for cues…',
  processing: 'Recording voiceover…',
  completed: 'Scene ready!',
  failed: 'Needs a redo',
};

const fallbackMessages = [
  'Warming up the narrator…',
  'Dusting off the stage props…',
  'Mixing sparkles with footsteps…',
  'Setting mood lighting for the next scene…',
];

const StoryPipelineStatus = ({ progress = 0, message, pages = [] }) => {
  const percent = Math.round(Math.min(Math.max(progress * 100, 0), 100));
  const displayMessage = message || fallbackMessages[percent % fallbackMessages.length];
  const slices = pages.slice(0, 4);

  return (
    <div className="rounded-xl border border-primary/20 bg-white/80 p-4 shadow animate-[pulse_3s_ease-in-out_infinite]">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">{displayMessage}</p>
        <span className="text-xs text-slate-500">{percent}%</span>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {slices.map((page) => (
          <div key={page.pageNumber} className="flex items-center gap-2 text-xs text-slate-600">
            <span className="rounded-full bg-primary/10 px-2 py-1 font-semibold text-primary">
              Scene {page.pageNumber}
            </span>
            <span className="truncate">
              {statusNotes[page.status] || page.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoryPipelineStatus;
