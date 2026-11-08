"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Redo2,
  RotateCcw,
  Sparkles,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  getElementMeta,
  MAX_BOUQUET_ITEMS,
  MAX_ITEM_ROTATION,
  MAX_ITEM_SCALE,
  MAX_ITEM_X,
  MAX_ITEM_Y,
  MIN_ITEM_ROTATION,
  MIN_ITEM_SCALE,
  MIN_ITEM_X,
  MIN_ITEM_Y,
  type PaperType,
  type RibbonType,
} from "@/lib/bouquet-catalog";
import { BouquetSvg, type EditableBouquetItem } from "./BouquetSvg";

export interface BuilderCanvasProps {
  paper: PaperType;
  ribbon: RibbonType;
  items: readonly EditableBouquetItem[];
  selectedUid: string | null;
  canUndo: boolean;
  canRedo: boolean;
  onSelectUid: (uid: string | null) => void;
  onLiveUpdateItem: (
    uid: string,
    patch: Partial<Pick<EditableBouquetItem, "x" | "y" | "scale" | "rotation">>
  ) => void;
  onCommitGesture: () => void;
  onChangeItemCommitted: (
    uid: string,
    patch: Partial<Pick<EditableBouquetItem, "x" | "y" | "scale" | "rotation">>
  ) => void;
  onBringForward: (uid: string) => void;
  onSendBackward: (uid: string) => void;
  onDuplicate: (uid: string) => void;
  onDelete: (uid: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onRandomize: () => void;
  onReset: () => void;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function BuilderCanvas({
  paper,
  ribbon,
  items,
  selectedUid,
  canUndo,
  canRedo,
  onSelectUid,
  onLiveUpdateItem,
  onCommitGesture,
  onChangeItemCommitted,
  onBringForward,
  onSendBackward,
  onDuplicate,
  onDelete,
  onUndo,
  onRedo,
  onRandomize,
  onReset,
}: BuilderCanvasProps): React.ReactElement {
  const svgRef = React.useRef<SVGSVGElement | null>(null);
  const canvasWrapperRef = React.useRef<HTMLDivElement | null>(null);

  // Active pointer tracking for single-pointer drag AND two-finger pinch/rotate
  const pointersRef = React.useRef<Map<number, { clientX: number; clientY: number }>>(
    new Map()
  );
  const dragStateRef = React.useRef<{
    uid: string;
    offsetX: number;
    offsetY: number;
    moved: boolean;
  } | null>(null);
  const pinchStateRef = React.useRef<{
    uid: string;
    initialDist: number;
    initialAngle: number;
    initialScale: number;
    initialRotation: number;
    changed: boolean;
  } | null>(null);

  const selectedItem = React.useMemo(
    () => items.find((item) => item.uid === selectedUid) ?? null,
    [items, selectedUid]
  );

  const clientToSvgCoords = React.useCallback((clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: 300, y: 260 };
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return { x: 300, y: 260 };
    return {
      x: ((clientX - rect.left) / rect.width) * CANVAS_WIDTH,
      y: ((clientY - rect.top) / rect.height) * CANVAS_HEIGHT,
    };
  }, []);

  const handleItemPointerDown = React.useCallback(
    (uid: string, event: React.PointerEvent<SVGGElement>) => {
      onSelectUid(uid);
      canvasWrapperRef.current?.focus({ preventScroll: true });

      const targetItem = items.find((i) => i.uid === uid);
      if (!targetItem) return;

      pointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      try {
        svgRef.current?.setPointerCapture(event.pointerId);
      } catch {
        // Ignore pointer capture error in synthetic events
      }

      if (pointersRef.current.size === 1) {
        const pt = clientToSvgCoords(event.clientX, event.clientY);
        dragStateRef.current = {
          uid,
          offsetX: targetItem.x - pt.x,
          offsetY: targetItem.y - pt.y,
          moved: false,
        };
      }
    },
    [clientToSvgCoords, items, onSelectUid]
  );

  const handleCanvasPointerDown = React.useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      pointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (pointersRef.current.size === 2 && selectedItem) {
        const pts = Array.from(pointersRef.current.values());
        const p1 = pts[0]!;
        const p2 = pts[1]!;
        const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
        const angle =
          (Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180) / Math.PI;

        dragStateRef.current = null;
        pinchStateRef.current = {
          uid: selectedItem.uid,
          initialDist: Math.max(10, dist),
          initialAngle: angle,
          initialScale: selectedItem.scale,
          initialRotation: selectedItem.rotation,
          changed: false,
        };
        try {
          svgRef.current?.setPointerCapture(event.pointerId);
        } catch {
          // Ignore
        }
        return;
      }

      // Clicking blank background deselects
      if (event.target === svgRef.current) {
        onSelectUid(null);
      }
    },
    [onSelectUid, selectedItem]
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!pointersRef.current.has(event.pointerId)) return;
      pointersRef.current.set(event.pointerId, {
        clientX: event.clientX,
        clientY: event.clientY,
      });

      if (pointersRef.current.size >= 2 && selectedItem) {
        const pts = Array.from(pointersRef.current.values());
        const p1 = pts[0]!;
        const p2 = pts[1]!;
        const dist = Math.hypot(p2.clientX - p1.clientX, p2.clientY - p1.clientY);
        const angle =
          (Math.atan2(p2.clientY - p1.clientY, p2.clientX - p1.clientX) * 180) / Math.PI;

        if (!pinchStateRef.current) {
          pinchStateRef.current = {
            uid: selectedItem.uid,
            initialDist: Math.max(10, dist),
            initialAngle: angle,
            initialScale: selectedItem.scale,
            initialRotation: selectedItem.rotation,
            changed: false,
          };
          dragStateRef.current = null;
          return;
        }

        const ratio = dist / pinchStateRef.current.initialDist;
        const nextScale = clamp(
          Math.round(pinchStateRef.current.initialScale * ratio * 100) / 100,
          MIN_ITEM_SCALE,
          MAX_ITEM_SCALE
        );

        let nextRotation =
          pinchStateRef.current.initialRotation +
          (angle - pinchStateRef.current.initialAngle);
        while (nextRotation > 180) nextRotation -= 360;
        while (nextRotation < -180) nextRotation += 360;
        nextRotation = clamp(
          Math.round(nextRotation),
          MIN_ITEM_ROTATION,
          MAX_ITEM_ROTATION
        );

        pinchStateRef.current.changed = true;
        onLiveUpdateItem(pinchStateRef.current.uid, {
          scale: nextScale,
          rotation: nextRotation,
        });
        return;
      }

      const drag = dragStateRef.current;
      if (drag && pointersRef.current.size === 1) {
        const pt = clientToSvgCoords(event.clientX, event.clientY);
        const nextX = clamp(Math.round(pt.x + drag.offsetX), MIN_ITEM_X, MAX_ITEM_X);
        const nextY = clamp(Math.round(pt.y + drag.offsetY), MIN_ITEM_Y, MAX_ITEM_Y);
        drag.moved = true;
        onLiveUpdateItem(drag.uid, { x: nextX, y: nextY });
      }
    },
    [clientToSvgCoords, onLiveUpdateItem, selectedItem]
  );

  const finishPointer = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(event.pointerId);

      if (pinchStateRef.current && pointersRef.current.size < 2) {
        const changed = pinchStateRef.current.changed;
        pinchStateRef.current = null;
        if (changed) {
          onCommitGesture();
        }
      }

      if (dragStateRef.current && pointersRef.current.size === 0) {
        const moved = dragStateRef.current.moved;
        dragStateRef.current = null;
        if (moved) {
          onCommitGesture();
        }
      }
    },
    [onCommitGesture]
  );

  // Accessible keyboard controls on the canvas
  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!selectedItem) return;
      const step = event.shiftKey ? 18 : 6;

      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            x: clamp(selectedItem.x - step, MIN_ITEM_X, MAX_ITEM_X),
          });
          break;
        case "ArrowRight":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            x: clamp(selectedItem.x + step, MIN_ITEM_X, MAX_ITEM_X),
          });
          break;
        case "ArrowUp":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            y: clamp(selectedItem.y - step, MIN_ITEM_Y, MAX_ITEM_Y),
          });
          break;
        case "ArrowDown":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            y: clamp(selectedItem.y + step, MIN_ITEM_Y, MAX_ITEM_Y),
          });
          break;
        case "[":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            rotation: clamp(
              selectedItem.rotation - 10,
              MIN_ITEM_ROTATION,
              MAX_ITEM_ROTATION
            ),
          });
          break;
        case "]":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            rotation: clamp(
              selectedItem.rotation + 10,
              MIN_ITEM_ROTATION,
              MAX_ITEM_ROTATION
            ),
          });
          break;
        case "+":
        case "=":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            scale: clamp(
              Math.round((selectedItem.scale + 0.08) * 100) / 100,
              MIN_ITEM_SCALE,
              MAX_ITEM_SCALE
            ),
          });
          break;
        case "-":
          event.preventDefault();
          onChangeItemCommitted(selectedItem.uid, {
            scale: clamp(
              Math.round((selectedItem.scale - 0.08) * 100) / 100,
              MIN_ITEM_SCALE,
              MAX_ITEM_SCALE
            ),
          });
          break;
        case "Delete":
        case "Backspace":
          event.preventDefault();
          onDelete(selectedItem.uid);
          break;
        case "Escape":
          onSelectUid(null);
          break;
      }
    },
    [onChangeItemCommitted, onDelete, onSelectUid, selectedItem]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Top Canvas Toolbar: Undo, Redo, Acak, Reset */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-paper-border bg-paper-card px-3 py-2 shadow-sm">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Urungkan perubahan terakhir"
            title="Urungkan (Ctrl+Z)"
            className="inline-flex items-center gap-1 rounded-xl border border-paper-border bg-paper px-2.5 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-paper-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Urungkan</span>
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Ulangi perubahan"
            title="Ulangi (Ctrl+Shift+Z)"
            className="inline-flex items-center gap-1 rounded-xl border border-paper-border bg-paper px-2.5 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-paper-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Redo2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Ulangi</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-testid="randomize-bouquet-btn"
            onClick={onRandomize}
            className="inline-flex items-center gap-1.5 rounded-xl bg-lavender-100 px-3 py-1.5 text-xs font-bold text-ink transition-colors hover:bg-lavender-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
          >
            <Sparkles className="h-3.5 w-3.5 text-lavender-500" aria-hidden="true" />
            <span>Acak</span>
          </button>
          <button
            type="button"
            data-testid="reset-bouquet-btn"
            onClick={onReset}
            disabled={items.length === 0}
            className="inline-flex items-center gap-1 rounded-xl border border-paper-border bg-paper px-2.5 py-1.5 text-xs font-bold text-ink-soft transition-colors hover:bg-blush-50 hover:text-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Interactive SVG Canvas */}
      <div
        ref={canvasWrapperRef}
        tabIndex={0}
        role="application"
        aria-label="Kanvas perakit buket. Ketuk bunga untuk memilih, geser untuk memindahkan, atau gunakan tombol panah keyboard."
        onKeyDown={handleKeyDown}
        onPointerMove={handlePointerMove}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        className="relative mx-auto flex w-full max-w-[490px] items-center justify-center overflow-hidden rounded-3xl border border-paper-border bg-gradient-to-b from-paper-card via-paper to-paper-warm p-2 shadow-cozy focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 sm:p-4"
      >
        {items.length === 0 && (
          <div className="pointer-events-none absolute inset-x-6 top-8 z-10 rounded-2xl bg-white/85 px-4 py-2.5 text-center shadow-sm backdrop-blur-sm">
            <p className="font-script text-xl font-bold text-blush-600">
              Kanvasmu masih kosong ✨
            </p>
            <p className="text-xs text-ink-soft">
              Ketuk bunga atau daun dari palet untuk mulai merangkai, atau klik tombol{" "}
              <strong>Acak</strong>!
            </p>
          </div>
        )}

        <BouquetSvg
          svgRef={svgRef}
          paper={paper}
          ribbon={ribbon}
          items={items}
          selectedUid={selectedUid}
          interactive
          onCanvasBackgroundPointerDown={handleCanvasPointerDown}
          onItemPointerDown={handleItemPointerDown}
          className="h-auto max-h-[54vh] w-full select-none sm:max-h-[540px]"
        />
      </div>

      {/* Selected Element Precision Controls (Resize, Rotate, Z-Layer, Duplicate, Delete) */}
      {selectedItem ? (
        <div
          aria-label={`Pengaturan elemen ${getElementMeta(selectedItem.type).name}`}
          className="rounded-2xl border border-blush-200 bg-paper-card p-3 shadow-sm sm:p-4"
        >
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-ink sm:text-sm">
              <span
                className="h-2.5 w-2.5 rounded-full bg-blush-400"
                aria-hidden="true"
              />
              Terpilih: {getElementMeta(selectedItem.type).name}
            </span>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => onBringForward(selectedItem.uid)}
                aria-label="Majukan posisi ke depan"
                title="Bawa ke depan"
                className="inline-flex items-center gap-1 rounded-xl border border-paper-border bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
              >
                <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Maju</span>
              </button>
              <button
                type="button"
                onClick={() => onSendBackward(selectedItem.uid)}
                aria-label="Mundurkan posisi ke belakang"
                title="Kirim ke belakang"
                className="inline-flex items-center gap-1 rounded-xl border border-paper-border bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
              >
                <ArrowDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Mundur</span>
              </button>
              <button
                type="button"
                onClick={() => onDuplicate(selectedItem.uid)}
                disabled={items.length >= MAX_BOUQUET_ITEMS}
                aria-label="Duplikat elemen terpilih"
                className="inline-flex items-center gap-1 rounded-xl border border-paper-border bg-paper px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-paper-warm focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Duplikat</span>
              </button>
              <button
                type="button"
                onClick={() => onDelete(selectedItem.uid)}
                aria-label="Hapus elemen terpilih"
                className="inline-flex items-center gap-1 rounded-xl bg-blush-100 px-2.5 py-1.5 text-xs font-bold text-blush-700 hover:bg-blush-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Hapus</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
              <span className="flex justify-between">
                <span>Ukuran</span>
                <span>{Math.round(selectedItem.scale * 100)}%</span>
              </span>
              <input
                type="range"
                min={MIN_ITEM_SCALE}
                max={MAX_ITEM_SCALE}
                step={0.05}
                value={selectedItem.scale}
                onChange={(e) =>
                  onLiveUpdateItem(selectedItem.uid, {
                    scale: Number(e.target.value),
                  })
                }
                onPointerUp={onCommitGesture}
                onKeyUp={onCommitGesture}
                className="accent-blush-500"
              />
            </label>

            <label className="flex flex-col gap-1 text-xs font-semibold text-ink-soft">
              <span className="flex justify-between">
                <span>Putar</span>
                <span>{Math.round(selectedItem.rotation)}°</span>
              </span>
              <input
                type="range"
                min={MIN_ITEM_ROTATION}
                max={MAX_ITEM_ROTATION}
                step={2}
                value={selectedItem.rotation}
                onChange={(e) =>
                  onLiveUpdateItem(selectedItem.uid, {
                    rotation: Number(e.target.value),
                  })
                }
                onPointerUp={onCommitGesture}
                onKeyUp={onCommitGesture}
                className="accent-blush-500"
              />
            </label>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-paper-border bg-paper-card/70 px-4 py-2.5 text-center text-xs text-ink-muted">
          Ketuk salah satu bunga atau daun di kanvas untuk mengatur ukuran, putaran,
          urutan tumpukan, atau menghapusnya.
        </div>
      )}
    </div>
  );
}
