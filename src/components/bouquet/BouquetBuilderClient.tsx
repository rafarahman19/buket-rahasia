"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import {
  type BouquetElementType,
  type BouquetJson,
  createRandomizedBouquet,
  createStarterBouquet,
  getElementMeta,
  MAX_BOUQUET_ITEMS,
  MAX_ITEM_X,
  MAX_ITEM_Y,
  MIN_ITEM_X,
  MIN_ITEM_Y,
  type PaperType,
  type RibbonType,
} from "@/lib/bouquet-catalog";
import type { EditableBouquetItem } from "./BouquetSvg";
import { BuilderCanvas } from "./BuilderCanvas";
import { PalettePanel } from "./PalettePanel";
import { SendStepPanel } from "./SendStepPanel";

interface EditorSnapshot {
  paper: PaperType;
  ribbon: RibbonType;
  items: EditableBouquetItem[];
}

const MAX_HISTORY_STEPS = 40;

let uidCounter = 1;
function nextUid(): string {
  return `el_${uidCounter++}_${Math.random().toString(36).slice(2, 7)}`;
}

function hydrateSnapshot(bouquet: BouquetJson): EditorSnapshot {
  return {
    paper: bouquet.paper,
    ribbon: bouquet.ribbon,
    items: bouquet.items
      .slice()
      .sort((a, b) => a.z - b.z)
      .map((item, idx) => ({
        uid: nextUid(),
        type: item.type,
        x: item.x,
        y: item.y,
        scale: item.scale,
        rotation: item.rotation,
        z: idx,
      })),
  };
}

function normalizeZOrder(items: EditableBouquetItem[]): EditableBouquetItem[] {
  return items
    .slice()
    .sort((a, b) => a.z - b.z)
    .map((item, index) => ({ ...item, z: index }));
}

function toCompactBouquetJson(snapshot: EditorSnapshot): BouquetJson {
  return {
    version: 1,
    paper: snapshot.paper,
    ribbon: snapshot.ribbon,
    items: normalizeZOrder(snapshot.items).map((item) => ({
      type: item.type,
      x: Math.round(item.x * 100) / 100,
      y: Math.round(item.y * 100) / 100,
      scale: Math.round(item.scale * 100) / 100,
      rotation: Math.round(item.rotation * 100) / 100,
      z: item.z,
    })),
  };
}

export interface BouquetBuilderClientProps {
  turnstileSiteKey: string;
}

export function BouquetBuilderClient({
  turnstileSiteKey,
}: BouquetBuilderClientProps): React.ReactElement {
  const [step, setStep] = React.useState<"build" | "send">("build");
  const [past, setPast] = React.useState<EditorSnapshot[]>([]);
  const [present, setPresent] = React.useState<EditorSnapshot>(() =>
    hydrateSnapshot(createStarterBouquet())
  );
  const [future, setFuture] = React.useState<EditorSnapshot[]>([]);
  const [selectedUid, setSelectedUid] = React.useState<string | null>(null);

  // Holds the pre-gesture snapshot while dragging/pinching/sliding so releasing commits 1 undo step
  const preGestureSnapshotRef = React.useRef<EditorSnapshot | null>(null);

  const commitChange = React.useCallback(
    (updater: (prev: EditorSnapshot) => EditorSnapshot) => {
      setPresent((current) => {
        const updated = updater(current);
        setPast((history) => [...history.slice(-(MAX_HISTORY_STEPS - 1)), current]);
        setFuture([]);
        return updated;
      });
    },
    []
  );

  const handleUndo = React.useCallback(() => {
    setPast((history) => {
      if (history.length === 0) return history;
      const previous = history[history.length - 1]!;
      setPresent((current) => {
        setFuture((f) => [current, ...f]);
        return previous;
      });
      setSelectedUid(null);
      return history.slice(0, -1);
    });
  }, []);

  const handleRedo = React.useCallback(() => {
    setFuture((ahead) => {
      if (ahead.length === 0) return ahead;
      const next = ahead[0]!;
      setPresent((current) => {
        setPast((p) => [...p, current]);
        return next;
      });
      setSelectedUid(null);
      return ahead.slice(1);
    });
  }, []);

  // Global Ctrl+Z / Ctrl+Shift+Z shortcuts while in builder step
  React.useEffect(() => {
    if (step !== "build") return;
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleRedo, handleUndo, step]);

  const handleAddElement = React.useCallback(
    (type: BouquetElementType) => {
      if (present.items.length >= MAX_BOUQUET_ITEMS) return;
      const meta = getElementMeta(type);
      const uid = nextUid();
      const jitterX = Math.round((Math.random() - 0.5) * 90);
      const jitterY = Math.round((Math.random() - 0.5) * 65);
      const jitterRot = Math.round((Math.random() - 0.5) * 20);

      commitChange((curr) => {
        const normalized = normalizeZOrder(curr.items);
        const z = meta.category === "greenery" ? 0 : normalized.length;

        const nextItems =
          meta.category === "greenery"
            ? [
                {
                  uid,
                  type,
                  x: 300 + jitterX,
                  y: 225 + jitterY,
                  scale: meta.defaultScale,
                  rotation: jitterRot,
                  z: 0,
                },
                ...normalized.map((item, i) => ({ ...item, z: i + 1 })),
              ]
            : [
                ...normalized,
                {
                  uid,
                  type,
                  x: 300 + jitterX,
                  y: 265 + jitterY,
                  scale: meta.defaultScale,
                  rotation: jitterRot,
                  z,
                },
              ];

        return {
          ...curr,
          items: normalizeZOrder(nextItems),
        };
      });
      setSelectedUid(uid);
    },
    [commitChange, present.items.length]
  );

  const handleLiveUpdateItem = React.useCallback(
    (
      uid: string,
      patch: Partial<Pick<EditableBouquetItem, "x" | "y" | "scale" | "rotation">>
    ) => {
      setPresent((curr) => {
        if (!preGestureSnapshotRef.current) {
          preGestureSnapshotRef.current = curr;
        }
        return {
          ...curr,
          items: curr.items.map((item) =>
            item.uid === uid ? { ...item, ...patch } : item
          ),
        };
      });
    },
    []
  );

  const handleCommitGesture = React.useCallback(() => {
    const startSnap = preGestureSnapshotRef.current;
    if (!startSnap) return;
    preGestureSnapshotRef.current = null;
    setPast((history) => [...history.slice(-(MAX_HISTORY_STEPS - 1)), startSnap]);
    setFuture([]);
  }, []);

  const handleChangeItemCommitted = React.useCallback(
    (
      uid: string,
      patch: Partial<Pick<EditableBouquetItem, "x" | "y" | "scale" | "rotation">>
    ) => {
      commitChange((curr) => ({
        ...curr,
        items: curr.items.map((item) =>
          item.uid === uid ? { ...item, ...patch } : item
        ),
      }));
    },
    [commitChange]
  );

  const handleBringForward = React.useCallback(
    (uid: string) => {
      commitChange((curr) => {
        const sorted = normalizeZOrder(curr.items);
        const index = sorted.findIndex((i) => i.uid === uid);
        if (index === -1 || index === sorted.length - 1) return curr;
        const copy = sorted.slice();
        const temp = copy[index]!;
        copy[index] = copy[index + 1]!;
        copy[index + 1] = temp;
        return { ...curr, items: copy.map((item, idx) => ({ ...item, z: idx })) };
      });
    },
    [commitChange]
  );

  const handleSendBackward = React.useCallback(
    (uid: string) => {
      commitChange((curr) => {
        const sorted = normalizeZOrder(curr.items);
        const index = sorted.findIndex((i) => i.uid === uid);
        if (index <= 0) return curr;
        const copy = sorted.slice();
        const temp = copy[index]!;
        copy[index] = copy[index - 1]!;
        copy[index - 1] = temp;
        return { ...curr, items: copy.map((item, idx) => ({ ...item, z: idx })) };
      });
    },
    [commitChange]
  );

  const handleDuplicate = React.useCallback(
    (uid: string) => {
      if (present.items.length >= MAX_BOUQUET_ITEMS) return;
      const newUid = nextUid();
      commitChange((curr) => {
        const source = curr.items.find((i) => i.uid === uid);
        if (!source || curr.items.length >= MAX_BOUQUET_ITEMS) return curr;
        const normalized = normalizeZOrder(curr.items);
        const clone: EditableBouquetItem = {
          ...source,
          uid: newUid,
          x: Math.min(MAX_ITEM_X, Math.max(MIN_ITEM_X, source.x + 22)),
          y: Math.min(MAX_ITEM_Y, Math.max(MIN_ITEM_Y, source.y + 14)),
          z: normalized.length,
        };
        return { ...curr, items: [...normalized, clone] };
      });
      setSelectedUid(newUid);
    },
    [commitChange, present.items.length]
  );

  const handleDelete = React.useCallback(
    (uid: string) => {
      commitChange((curr) => ({
        ...curr,
        items: normalizeZOrder(curr.items.filter((i) => i.uid !== uid)),
      }));
      setSelectedUid((currUid) => (currUid === uid ? null : currUid));
    },
    [commitChange]
  );

  const handleRandomize = React.useCallback(() => {
    commitChange(() => hydrateSnapshot(createRandomizedBouquet()));
    setSelectedUid(null);
  }, [commitChange]);

  const handleReset = React.useCallback(() => {
    commitChange((curr) => ({
      ...curr,
      items: [],
    }));
    setSelectedUid(null);
  }, [commitChange]);

  const compactBouquet = React.useMemo(() => toCompactBouquetJson(present), [present]);

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-6 sm:py-8">
      {/* Stepper Header */}
      <div className="mb-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
        <div>
          <h1 className="font-script text-3xl font-bold text-ink sm:text-4xl">
            {step === "build"
              ? "1. Rakit Buket Bungamu 🌸"
              : "2. Tulis Pesan & Kirim Rahasia 💌"}
          </h1>
          <p className="text-xs text-ink-soft sm:text-sm">
            {step === "build"
              ? "Padukan bunga, daun pelengkap, kertas pembungkus, dan pita sesuai suasana hatimu."
              : "Cek lagi pratinjau buketmu sebelum dikirim ke email penerima secara anonim."}
          </p>
        </div>

        {/* Step Pill Indicator */}
        <ol
          aria-label="Langkah pembuatan buket"
          className="flex items-center gap-2 rounded-full border border-paper-border bg-paper-card px-3 py-1.5 text-xs font-bold shadow-sm"
        >
          <li
            className={`rounded-full px-3 py-1 ${
              step === "build" ? "bg-blush-500 text-white" : "text-ink-soft"
            }`}
          >
            1. Rakit Buket
          </li>
          <li aria-hidden="true" className="text-ink-muted">
            →
          </li>
          <li
            className={`rounded-full px-3 py-1 ${
              step === "send" ? "bg-blush-500 text-white" : "text-ink-soft"
            }`}
          >
            2. Kirim Pesan
          </li>
        </ol>
      </div>

      {step === "build" ? (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Canvas Column */}
          <div className="lg:col-span-7">
            <BuilderCanvas
              paper={present.paper}
              ribbon={present.ribbon}
              items={present.items}
              selectedUid={selectedUid}
              canUndo={past.length > 0}
              canRedo={future.length > 0}
              onSelectUid={setSelectedUid}
              onLiveUpdateItem={handleLiveUpdateItem}
              onCommitGesture={handleCommitGesture}
              onChangeItemCommitted={handleChangeItemCommitted}
              onBringForward={handleBringForward}
              onSendBackward={handleSendBackward}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onUndo={handleUndo}
              onRedo={handleRedo}
              onRandomize={handleRandomize}
              onReset={handleReset}
            />
          </div>

          {/* Palette + Next Step CTA Column */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            <PalettePanel
              currentPaper={present.paper}
              currentRibbon={present.ribbon}
              itemCount={present.items.length}
              onAddElement={handleAddElement}
              onSelectPaper={(paper) => commitChange((curr) => ({ ...curr, paper }))}
              onSelectRibbon={(ribbon) => commitChange((curr) => ({ ...curr, ribbon }))}
            />

            <button
              type="button"
              data-testid="proceed-to-send-btn"
              disabled={present.items.length === 0}
              onClick={() => {
                setSelectedUid(null);
                setStep("send");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-blush-500 px-6 py-4 text-base font-bold text-white shadow-petal transition-all hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <span>Lanjut Tulis Pesan Rahasia</span>
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      ) : (
        <SendStepPanel
          bouquet={compactBouquet}
          editableItems={present.items}
          turnstileSiteKey={turnstileSiteKey}
          onBackToBuilder={() => setStep("build")}
        />
      )}
    </div>
  );
}

export default BouquetBuilderClient;
