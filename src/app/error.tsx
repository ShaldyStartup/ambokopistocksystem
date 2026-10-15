"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="panel empty" role="alert">
      <h1>Data belum dapat dimuat</h1>
      <p>
        Terjadi kesalahan. Silakan coba kembali. Jika berlanjut, hubungi
        pengelola.
      </p>
      <button className="btn" onClick={() => reset()}>
        Coba kembali
      </button>
    </section>
  );
}
