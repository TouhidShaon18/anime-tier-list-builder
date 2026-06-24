export type Anime = {
  id: number;
  title: string;
  image: string; // proxied URL, safe for canvas export
};

type JikanAnime = {
  mal_id: number;
  title_english?: string | null;
  title?: string | null;
  images?: {
    jpg?: { image_url?: string; large_image_url?: string };
    webp?: { image_url?: string; large_image_url?: string };
  };
};

/** Route every image through our same-origin proxy so html-to-image
 *  can export the board without the canvas becoming "tainted". */
export function proxied(url: string): string {
  return `/api/img?u=${encodeURIComponent(url)}`;
}

/** A small built-in set so the page is never empty if Jikan is down. */
const FALLBACK: Anime[] = [
  "Fullmetal Alchemist: Brotherhood",
  "Steins;Gate",
  "Attack on Titan",
  "Death Note",
  "Hunter x Hunter",
  "One Piece",
  "Demon Slayer",
  "Jujutsu Kaisen",
  "Naruto",
  "My Hero Academia",
  "Cowboy Bebop",
  "Code Geass",
].map((title, i) => ({
  id: -(i + 1),
  title,
  image: "", // empty -> card renders an initials placeholder
}));

/**
 * Fetch the top anime from the free Jikan (MyAnimeList) API.
 * Cached for a day. Falls back to a built-in list on any error.
 */
export async function getTopAnime(limit = 24): Promise<Anime[]> {
  try {
    const res = await fetch(
      "https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=25&sfw",
      { next: { revalidate: 86400 } },
    );
    if (!res.ok) throw new Error(`Jikan ${res.status}`);

    const json = (await res.json()) as { data: JikanAnime[] };
    const list = (json.data ?? [])
      .map((a): Anime | null => {
        const title = a.title_english || a.title;
        const raw =
          a.images?.jpg?.large_image_url || a.images?.jpg?.image_url;
        if (!title || !raw) return null;
        return { id: a.mal_id, title, image: proxied(raw) };
      })
      .filter((a): a is Anime => a !== null)
      .slice(0, limit);

    return list.length ? list : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
