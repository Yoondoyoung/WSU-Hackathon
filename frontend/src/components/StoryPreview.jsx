import clsx from 'clsx';

const TimelineRow = ({ entry }) => {
  if (!entry) {
    return null;
  }

  if (entry.type === 'character') {
    return (
      <li className="rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        <span className="font-semibold text-primary">{entry.name || 'Character'}:</span> {entry.text}
      </li>
    );
  }

  if (entry.type === 'sfx') {
    return (
      <li className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
        <span className="font-semibold">SFX:</span> {entry.placeholder ? `${entry.placeholder} ` : ''}
        <span className="text-amber-600">({entry.description})</span>
      </li>
    );
  }

  return (
    <li className="rounded-md bg-white p-3 text-sm text-slate-700 shadow-inner">
      {entry.text}
    </li>
  );
};

export const StoryPreview = ({ story, pages = [], isLoading }) => {
  if (!story) {
    return (
      <section className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-slate-500">
        <p className="text-sm">Your cinematic story will appear here once generated.</p>
        <p className="text-xs text-slate-400">Fill out the form and click “Create storybook”.</p>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col gap-6 overflow-hidden rounded-xl bg-white p-6 shadow-lg">
      <header className="space-y-2">
        <h2 className="text-xl font-semibold text-slate-900">{story.title || 'Story preview'}</h2>
        {story.logline && <p className="text-sm text-slate-500">{story.logline}</p>}
        {story.characters && story.characters.length > 0 && (
          <div className="flex flex-wrap gap-2 text-xs text-slate-500">
            {story.characters.map((character) => (
              <span
                key={character.name || character.id}
                className="rounded-full bg-slate-100 px-3 py-1"
              >
                {character.name}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className={clsx('flex-1 space-y-4 overflow-y-auto pr-2', isLoading && 'opacity-70')}>
        {(pages || []).map((page) => (
          <article
            key={page.page}
            className="space-y-3 rounded-lg border border-slate-200 p-4"
          >
            <header className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-primary">
                Scene {page.page}
              </span>
            </header>

            { (page.imageUrl || page.image) && (
              <img
                src={page.imageUrl || page.image}
                alt={`Illustration for scene ${page.page}`}
                className="h-48 w-full rounded-lg object-cover"
              />
            )}

            {(page.audioUrl || page.audio) && (
              <audio controls className="w-full">
                <source src={page.audioUrl || page.audio} type="audio/mpeg" />
                Your browser does not support the audio element.
              </audio>
            )}

            <ul className="space-y-2">
              {(page.timeline || []).map((entry, index) => (
                <TimelineRow entry={entry} key={`${page.page}-${entry.type}-${index}`} />
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
};

export default StoryPreview;
