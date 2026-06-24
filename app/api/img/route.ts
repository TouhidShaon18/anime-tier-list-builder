import { NextRequest } from "next/server";

// Only allow proxying images from MyAnimeList's CDN.
const ALLOWED_HOSTS = new Set([
  "cdn.myanimelist.net",
  "myanimelist.net",
]);

export async function GET(req: NextRequest) {
  const u = req.nextUrl.searchParams.get("u");
  if (!u) {
    return new Response("Missing url", { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(u);
  } catch {
    return new Response("Bad url", { status: 400 });
  }

  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new Response("Host not allowed", { status: 403 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      // Cache aggressively at the edge; posters never change.
      next: { revalidate: 604800 },
      headers: { Accept: "image/*" },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Upstream error", { status: 502 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type":
          upstream.headers.get("content-type") ?? "image/jpeg",
        "Cache-Control": "public, max-age=604800, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch {
    return new Response("Fetch failed", { status: 502 });
  }
}
