# Anime Tier List Builder

Drag-and-drop anime into **S / A / B / C** tiers, then download the result as an
image or share it to Facebook / anime groups.

- **Framework:** Next.js 16 (App Router) + React 19 + Tailwind v4
- **Drag & drop:** `@dnd-kit/core` (mouse + touch)
- **Image export:** `html-to-image`
- **Anime data:** free [Jikan / MyAnimeList](https://jikan.moe) API, fetched
  server-side and cached for a day. Posters are served through a same-origin
  image proxy (`/api/img`) so the downloaded image isn't blocked by browser
  canvas security.

## Run locally

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Deploy to GitHub + Vercel

1. Create a new GitHub repo and push this folder:
   ```bash
   git init
   git add .
   git commit -m "Anime Tier List Builder"
   git branch -M main
   git remote add origin git@github.com:<you>/anime-tier-list-builder.git
   git push -u origin main
   ```
2. Go to [vercel.com/new](https://vercel.com/new), import the repo.
3. Framework preset auto-detects **Next.js** — no env vars needed. Click
   **Deploy**.
4. (Optional) Add a custom domain like `tierlist.marshmallow-tech.com` in the
   Vercel project's **Domains** settings.

## Notes on sharing

- **Download image** renders the four tiers to a PNG.
- **Share image** uses the Web Share API to post the actual PNG straight to
  Facebook / Messenger / groups (works on mobile and modern desktop browsers).
  On unsupported browsers it falls back to downloading the image.
- **Share to Facebook** opens Facebook's share dialog for the page link.
  Because Facebook can't read a freshly generated client-side image from a URL,
  the reliable way to post *your specific board* to a group is: **Download
  image → create a group post → attach the PNG.**

## Customizing the anime list

Edit `lib/anime.ts`:

- Change `getTopAnime(24)` in `app/page.tsx` to show more/fewer titles.
- Swap the Jikan endpoint (e.g. `?filter=favorite`, or by season/genre).
- Or replace `getTopAnime` entirely with a hardcoded array of
  `{ id, title, image }` if you want a fixed, curated set.
