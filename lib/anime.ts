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

/** Anime that must always appear, by their stable MyAnimeList IDs. */
const REQUIRED_IDS = [
  21, // One Piece
  813, // Dragon Ball Z
  527, // Pokémon
];

function mapAnime(a: JikanAnime): Anime | null {
  const title = a.title_english || a.title;
  const raw = a.images?.jpg?.large_image_url || a.images?.jpg?.image_url;
  if (!title || !raw) return null;
  return { id: a.mal_id, title, image: proxied(raw) };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Fetch a single anime by MAL id; retries once if Jikan rate-limits (429). */
async function getAnimeById(id: number): Promise<Anime | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${id}`, {
        next: { revalidate: 86400 },
      });
      if (res.status === 429) {
        await sleep(700);
        continue;
      }
      if (!res.ok) return null;
      const json = (await res.json()) as { data: JikanAnime };
      return json.data ? mapAnime(json.data) : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Fetch the top anime from the free Jikan (MyAnimeList) API, then merge in the
 * always-required titles (One Piece, Dragon Ball Z, Pokémon). Cached for a day.
 * Falls back to a built-in list on any error.
 */
export async function getTopAnime(limit = 24): Promise<Anime[]> {
  try {
    const topRes = await fetch(
      "https://api.jikan.moe/v4/top/anime?filter=bypopularity&limit=25&sfw",
      { next: { revalidate: 86400 } },
    );
    if (!topRes.ok) throw new Error(`Jikan ${topRes.status}`);
    const json = (await topRes.json()) as { data: JikanAnime[] };

    const top = (json.data ?? [])
      .map(mapAnime)
      .filter((a): a is Anime => a !== null)
      .slice(0, limit);

    // Fetch required titles one at a time to respect Jikan's rate limit.
    const required: (Anime | null)[] = [];
    for (const id of REQUIRED_IDS) {
      required.push(await getAnimeById(id));
      await sleep(400);
    }

    // Merge required titles in, de-duplicated by id.
    const seen = new Set(top.map((a) => a.id));
    const extras = required.filter(
      (a): a is Anime => a !== null && !seen.has(a.id),
    );

    const merged = [...top, ...extras];
    return merged.length ? merged : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
