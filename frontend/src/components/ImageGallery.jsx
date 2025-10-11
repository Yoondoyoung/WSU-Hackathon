export const ImageGallery = ({ illustrations = [], isLoading }) => {
  if (!illustrations?.length) {
    return (
      <section className="space-y-4 rounded-xl bg-white p-6 shadow-lg">
        <header className="text-lg font-semibold text-slate-900">Illustrations</header>
        <p className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
          Generated artwork will appear here.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-xl bg-white p-6 shadow-lg">
      <header className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900">Illustrations</h3>
        {isLoading && <span className="text-xs text-primary">Updating…</span>}
      </header>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(illustrations || []).map((item) => {
          const src = `data:image/png;base64,${item.imageBase64}`;
          return (
            <figure key={item.pageNumber} className="space-y-2">
              <img
                src={src}
                alt={`Illustration for page ${item.pageNumber}`}
                className="h-48 w-full rounded-lg object-cover shadow"
              />
              <figcaption className="text-xs text-slate-500">
                <div className="font-medium text-slate-600">Page {item.pageNumber}</div>
                {item.prompt && <div className="mt-1 text-slate-400">{item.prompt}</div>}
              </figcaption>
            </figure>
          );
        })}
      </div>
    </section>
  );
};

export default ImageGallery;
