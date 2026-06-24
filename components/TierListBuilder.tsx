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
    <div className="relative h-[120px] w-[84px] overflow-hidden rounded-md bg-brand-900 shadow-md ring-1 ring-white/10">
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
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900 text-xl font-bold text-white">
          {initialsOf(anime.title)}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-0.5 text-center text-[9px] leading-tight text-white">
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
    <div className="flex min-h-[132px] overflow-hidden rounded-lg ring-1 ring-white/10">
      <div
        className="flex w-[64px] shrink-0 items-center justify-center text-2xl font-black text-black/80"
        style={{ backgroundColor: tier.color }}
      >
        {tier.label}
      </div>
      <div
        ref={setNodeRef}
        className={`flex flex-1 flex-wrap content-start gap-2 bg-black/40 p-2 transition-colors ${
          isOver ? "bg-brand-700/40" : ""
        }`}
      >
        {items.map((a) => (
          <DraggableCard key={a.id} anime={a} />
        ))}
      </div>
    </div>
  );
}

function Pool({ items }: { items: Anime[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: "pool" });

  return (
    <div
      ref={setNodeRef}
      className={`flex min-h-[140px] flex-wrap content-start gap-2 rounded-lg bg-black/30 p-3 ring-1 ring-white/10 transition-colors ${
        isOver ? "bg-brand-700/30" : ""
      }`}
    >
      {items.length === 0 ? (
        <p className="m-auto text-sm text-white/40">
          All anime ranked! Drag them back here to unrank.
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
          text: "Here is my anime tier list! Built with the Anime Tier List Builder.",
        });
      } else {
        // Desktop fallback: download so the user can upload it manually.
        await handleDownload();
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
      {/* Exported region: the four tiers */}
      <div ref={boardRef} className="space-y-2 rounded-xl bg-[#0f0a17] p-2">
        {TIERS.map((t) => (
          <TierRow key={t.id} tier={t} items={board[t.id]} />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          onClick={handleDownload}
          disabled={busy}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-500 disabled:opacity-50"
        >
          {busy ? "Working…" : "⬇️ Download image"}
        </button>
        <button
          onClick={handleShareImage}
          disabled={busy}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-50"
        >
          📤 Share image
        </button>
        <button
          onClick={handleFacebook}
          className="rounded-lg bg-[#1877f2] px-4 py-2 text-sm font-semibold text-white shadow hover:brightness-110"
        >
          Share to Facebook
        </button>
        <button
          onClick={resetBoard}
          className="ml-auto rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20"
        >
          Reset
        </button>
      </div>

      {/* Unranked pool */}
      <div className="mt-8">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">
          Drag these into a tier
        </h2>
        <Pool items={board.pool} />
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
