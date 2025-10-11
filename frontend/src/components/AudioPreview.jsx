export const AudioPreview = ({ audio, isLoading, onRequestNarration, disabled }) => {
  const canPlay = Boolean(audio?.audioBase64);
  const audioSrc = canPlay
    ? `data:${audio.mimeType || 'audio/mpeg'};base64,${audio.audioBase64}`
    : null;

  return (
    <section className="space-y-4 rounded-xl bg-white p-6 shadow-lg">
      <header className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Narration</h3>
          <p className="text-sm text-slate-500">Generate an MP3 narration using ElevenLabs.</p>
        </div>
        <button type="button" disabled={disabled || isLoading} onClick={onRequestNarration}>
          {isLoading ? 'Creating narration…' : 'Generate narration'}
        </button>
      </header>

      {!canPlay && (
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Narration preview will show here once generated.
        </p>
      )}

      {canPlay && (
        <audio controls className="w-full">
          <source src={audioSrc} type={audio.mimeType || 'audio/mpeg'} />
          Your browser does not support the audio element.
        </audio>
      )}
    </section>
  );
};

export default AudioPreview;
