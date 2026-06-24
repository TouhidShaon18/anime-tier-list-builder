import TierListBuilder, { SITE_NAME, SITE_URL } from "@/components/TierListBuilder";
import Logo from "@/components/Logo";
import { getTopAnime } from "@/lib/anime";

export default async function Home() {
  const anime = await getTopAnime(12);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      {/* Top nav / brand bar */}
      <nav className="mb-10 flex items-center justify-between">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-2.5 rounded-full py-1 pl-1 pr-4 transition hover:bg-white/5"
        >
          <Logo idSuffix="nav" decorative className="h-9 w-9" />
          <span className="text-sm font-bold tracking-tight text-white/90 group-hover:text-white">
            {SITE_NAME}
          </span>
        </a>
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-white/15 px-4 py-1.5 text-xs font-semibold text-white/70 transition hover:border-brand-400/60 hover:text-white"
        >
          Visit website →
        </a>
      </nav>

      <header className="mb-8 text-center">
        <h1 className="bg-gradient-to-r from-brand-300 via-brand-400 to-indigo-400 bg-clip-text text-4xl font-black tracking-tight text-transparent sm:text-5xl">
          Anime Tier List Builder
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
          Drag each anime into the S, A, B, or C tier. When you&apos;re happy
          with your ranking, download it as an image or share it with your
          anime groups.
        </p>
      </header>

      <TierListBuilder anime={anime} />

      <footer className="mt-14 flex flex-col items-center gap-2 border-t border-white/10 pt-6 text-center text-xs text-white/55">
        <a
          href={SITE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-semibold text-white/70 transition hover:text-white"
        >
          <Logo idSuffix="foot" decorative className="h-5 w-5" />
          A free tool by {SITE_NAME}
        </a>
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
