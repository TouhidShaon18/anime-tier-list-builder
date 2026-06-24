import TierListBuilder from "@/components/TierListBuilder";
import { getTopAnime } from "@/lib/anime";

export default async function Home() {
  const anime = await getTopAnime(12);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
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

      <footer className="mt-12 text-center text-xs text-white/30">
        Anime data &amp; posters from{" "}
        <a
          href="https://jikan.moe"
          className="underline hover:text-white/60"
          target="_blank"
          rel="noopener noreferrer"
        >
          Jikan / MyAnimeList
        </a>
      </footer>
    </main>
  );
}
