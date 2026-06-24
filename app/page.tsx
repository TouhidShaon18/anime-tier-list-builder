import TierListBuilder, { SITE_NAME, SITE_URL } from "@/components/TierListBuilder";
import { getTopAnime } from "@/lib/anime";

export default async function Home() {
  const anime = await getTopAnime(12);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      {/* Brand bar */}
      <div className="mb-8 flex items-center justify-center">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2 rounded-full bg-white/5 px-4 py-1.5 text-sm font-semibold text-white/80 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white"
        >
          <span aria-hidden className="text-base">🍡</span>
          <span>{SITE_NAME}</span>
        </a>
      </div>

      <header className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-3xl font-black text-transparent sm:text-4xl">
          Anime Tier List Builder
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-white/60">
          Drag each anime into the S, A, B, or C tier. When you&apos;re happy
          with your ranking, download it as an image or share it with your
          anime groups.
        </p>
      </header>

      <TierListBuilder anime={anime} />

      <footer className="mt-12 space-y-1 text-center text-xs text-white/30">
        <p>
          A free tool by{" "}
          <a
            href={SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-300 hover:text-brand-200"
          >
            {SITE_NAME}
          </a>
        </p>
        <p>
          Anime data &amp; posters from{" "}
          <a
            href="https://jikan.moe"
            className="underline hover:text-white/60"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jikan / MyAnimeList
          </a>
        </p>
      </footer>
    </main>
  );
}
