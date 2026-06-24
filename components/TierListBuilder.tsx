"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { toPng } from "html-to-image";
import type { Anime } from "@/lib/anime";
import Logo from "@/components/Logo";

export const SITE_NAME = "Marshmallow Tech";
export const SITE_URL = "https://marshmallow-tech.com";

type ContainerId = "S" | "A" | "B" | "C" | "pool";

const TIERS: { id: Exclude<ContainerId, "pool">; label: string; color: string }[] =
  [
    { id: "S", label: "S", color: "#ff6b6b" },
    { id: "A", label: "A", color: "#ffa94d" },
    { id: "B", label: "B", color: "#ffd43b" },
    { id: "C", label: "C", color: "#69db7c" },
  ];

type Board = Record<ContainerId, Anime[]>;

function initialsOf(title: string) {
  return title
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/* ----------------------------- Anime card ----------------------------- */

function AnimeCardVisual({ anime }: { anime: Anime }) {
  const [broken, setBroken] = useState(false);
  const showImg = anime.image && !broken;

  return (
    <div className="group relative h-[120px] w-[84px] overflow-hidden rounded-lg bg-brand-900 shadow-lg shadow-black/40 ring-1 ring-white/10 transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:ring-brand-400/60">
      {showImg ? (
        // Plain <img> (same-origin proxy) so html-to-image can export it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={anime.image}
          alt={anime.title}
          className="h-full w-full object-cover"
          draggable={false}
          onError={() => setBroken(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-500 to-brand-900 text-xl font-bold text-white">
          {initialsOf(anime.title)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent px-1 pb-1 pt-3 text-center text-[9px] font-medium leading-tight text-white">
        <span className="line-clamp-2">{anime.title}</span>
      </div>
    </div>
  );
}

function DraggableCard({ anime }: { anime: Anime }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `anime-${anime.id}`,
    data: { anime },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`dnd-grabbable cursor-grab active:cursor-grabbing ${
        isDragging ? "opacity-30" : ""
      }`}
    >
      <AnimeCardVisual anime={anime} />
    </div>
  );
}

/* ----------------------------- Containers ----------------------------- */

function TierRow({
  tier,
  items,
}: {
  tier: { id: ContainerId; label: string; color: string };
  items: Anime[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: tier.id });

  return (
    <div className="flex min-h-[132px] overflow-hidden rounded-xl ring-1 ring-white/10">
      <div
        className="relative flex w-[68px] shrink-0 flex-col items-center justify-center font-black text-black/80"
        style={{ backgroundColor: tier.color }}
      >
        <span className="text-3xl leading-none drop-shadow-sm">{tier.label}</span>
        {items.length > 0 && (
          <span className="absolute bottom-1.5 rounded-full bg-black/25 px-1.5 text-[10px] font-bold text-black/70">
            {items.length}
          </span>
        )}
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-wrap content-start items-center gap-2 p-2 transition-colors ${
          isOver ? "bg-brand-600/25 ring-1 ring-inset ring-brand-400/50" : "bg-black/40"
        }`}
      >
        {items.length === 0 ? (
          <span className="px-2 text-xs text-white/25">
            {isOver ? "Release to drop" : "Drag anime here"}
          </span>
        ) : (
          items.map((a) => <DraggableCard key={a.id} anime={a} />)
        )}
      </div>
    </div>
  );
}

function Pool({ items }: { items: Anime[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[140px] flex-wrap content-start justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 transition-colors ${
        isOver ? "border-brand-400/50 bg-brand-600/15" : ""
      }`}
    >
      {items.length === 0 ? (
        <p className="m-auto px-2 text-center text-sm text-white/40">
          All anime ranked! 🎉
          <br />
          Drag them back here to unrank.
        </p>
      ) : (
        items.map((a) => <DraggableCard key={a.id} anime={a} />)
      )}
    </div>
  );
}

/* ----------------------------- Main ----------------------------- */

export default function TierListBuilder({ anime }: { anime: Anime[] }) {
  const [board, setBoard] = useState<Board>(() => ({
    S: [],
    A: [],
    B: [],
    C: [],
    pool: anime,
  }));
  const [activeAnime, setActiveAnime] = useState<Anime | null>(null);
  const [busy, setBusy] = useState(false);

  const boardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 6 },
    }),
  );

  const findContainer = useCallback(
    (cardId: string): ContainerId | null => {
      const id = Number(cardId.replace("anime-", ""));
      for (const key of Object.keys(board) as ContainerId[]) {
        if (board[key].some((a) => a.id === id)) return key;
      }
      return null;
    },
    [board],
  );

  function handleDragStart(e: DragStartEvent) {
    setActiveAnime((e.active.data.current?.anime as Anime) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveAnime(null);
    const { active, over } = e;
    if (!over) return;

    const from = findContainer(String(active.id));
    const to = over.id as ContainerId;
    if (!from || from === to) return;

    const id = Number(String(active.id).replace("anime-", ""));
    setBoard((prev) => {
      const moved = prev[from].find((a) => a.id === id);
      if (!moved) return prev;
      return {
        ...prev,
        [from]: prev[from].filter((a) => a.id !== id),
        [to]: [...prev[to], moved],
      };
    });
  }

  function resetBoard() {
    setBoard({ S: [], A: [], B: [], C: [], pool: anime });
  }

  const shareUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.href : ""),
    [],
  );

  async function generatePng(): Promise<Blob | null> {
    if (!boardRef.current) return null;
    const dataUrl = await toPng(boardRef.current, {
      pixelRatio: 2,
      backgroundColor: "#0f0a17",
      cacheBust: true,
    });
    const res = await fetch(dataUrl);
    return res.blob();
  }

  // Send visitors to the Marshmallow Tech site (new tab) after they
  // download or share, so the tool drives traffic back to the site.
  function openSite() {
    window.open(SITE_URL, "_blank", "noopener,noreferrer");
  }

  async function handleDownload() {
    try {
      setBusy(true);
      const blob = await generatePng();
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "anime-tier-list.png";
      a.click();
      URL.revokeObjectURL(url);
      openSite();
    } catch (err) {
      console.error(err);
      alert("Sorry, the image could not be generated. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // Web Share API with the actual PNG file — best for posting to
  // Facebook / Messenger / anime groups straight from a phone.
  async function handleShareImage() {
    try {
      setBusy(true);
      const blob = await generatePng();
      if (!blob) return;
      const file = new File([blob], "anime-tier-list.png", {
        type: "image/png",
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: "My Anime Tier List",
          text: `Here is my anime tier list! Built with the ${SITE_NAME} Anime Tier List Builder — ${SITE_URL}`,
        });
        openSite();
      } else {
        // Desktop fallback: download so the user can upload it manually.
        const blob2 = blob;
        const url = URL.createObjectURL(blob2);
        const a = document.createElement("a");
        a.href = url;
        a.download = "anime-tier-list.png";
        a.click();
        URL.revokeObjectURL(url);
        openSite();
        alert(
          "Your browser can't share files directly. The image has been downloaded — upload it to your Facebook group post.",
        );
      }
    } catch (err) {
      // User cancelling the share dialog throws; ignore that.
      if ((err as Error)?.name !== "AbortError") console.error(err);
    } finally {
      setBusy(false);
    }
  }

  function handleFacebook() {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
      shareUrl || "https://anime-tier-list-builder.vercel.app",
    )}`;
    window.open(url, "_blank", "noopener,width=640,height=640");
  }

  return (
    <DndContext
      id="anime-tier-dnd"
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Tier board (left) + anime pool (right), side by side on desktop */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* Left column: the four tiers + actions */}
        <div className="min-w-0 flex-1">
          {/* Exported region */}
          <div
            ref={boardRef}
            className="rounded-2xl bg-gradient-to-b from-[#140e20] to-[#0b0712] p-3 ring-1 ring-white/10"
          >
            <div className="space-y-2.5">
              {TIERS.map((t) => (
                <TierRow key={t.id} tier={t} items={board[t.id]} />
              ))}
            </div>
            {/* Branding watermark — appears in the downloaded/shared image */}
            <div className="mt-3 flex items-center justify-center gap-2 border-t border-white/10 pt-2.5 text-xs font-semibold text-white/75">
              <Logo idSuffix="mark" className="h-5 w-5" />
              <span>
                {SITE_NAME}
                <span className="mx-1.5 text-white/30">·</span>
                <span className="text-brand-300">
                  {SITE_URL.replace("https://", "")}
                </span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleDownload}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-900/40 transition hover:from-brand-500 hover:to-indigo-500 active:scale-[0.98] disabled:opacity-50"
            >
              <span aria-hidden>⬇️</span>
              {busy ? "Working…" : "Download image"}
            </button>
            <button
              onClick={handleShareImage}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition hover:bg-emerald-500 active:scale-[0.98] disabled:opacity-50"
            >
              <span aria-hidden>📤</span>
              Share image
            </button>
            <button
              onClick={handleFacebook}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1877f2] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#1877f2]/25 transition hover:brightness-110 active:scale-[0.98]"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
                <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07C0 18.1 4.39 23.1 10.13 24v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.89v2.25h3.32l-.53 3.49h-2.79V24C19.61 23.1 24 18.1 24 12.07z" />
              </svg>
              Share to Facebook
            </button>
            <button
              onClick={resetBoard}
              className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:border-white/30 hover:text-white active:scale-[0.98]"
            >
              <span aria-hidden>↺</span>
              Reset
            </button>
          </div>
        </div>

        {/* Right column: unranked anime pool */}
        <div className="w-full shrink-0 lg:sticky lg:top-6 lg:w-[244px]">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Drag into a tier
            </h2>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white/70">
              {board.pool.length}
            </span>
          </div>
          <div className="lg:max-h-[70vh] lg:overflow-y-auto lg:pr-1">
            <Pool items={board.pool} />
          </div>
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeAnime ? (
          <div className="rotate-3">
            <AnimeCardVisual anime={activeAnime} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
