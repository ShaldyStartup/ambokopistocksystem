export default function Loading() {
  return (
    <div className="stack" role="status" aria-label="Memuat data">
      <div className="skeleton" style={{ height: 80 }} />
      <div className="stats">
        {[1, 2, 3].map((n) => (
          <div className="skeleton" style={{ height: 130 }} key={n} />
        ))}
      </div>
      <div className="skeleton" style={{ height: 320 }} />
      <span className="sr-only">Memuat data…</span>
    </div>
  );
}
