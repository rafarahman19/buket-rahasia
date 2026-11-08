"use client";

import * as React from "react";
import {
  type BouquetJson,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  getElementMeta,
  getPaperMeta,
  getRibbonMeta,
} from "@/lib/bouquet-catalog";
import {
  BouquetElementGraphic,
  BouquetRibbonBow,
  WrappingPaperBack,
  WrappingPaperDefs,
  WrappingPaperFront,
} from "./BouquetArt";

export interface EditableBouquetItem {
  uid: string;
  type: BouquetJson["items"][number]["type"];
  x: number;
  y: number;
  scale: number;
  rotation: number;
  z: number;
}

export interface BouquetSvgProps {
  paper: BouquetJson["paper"];
  ribbon: BouquetJson["ribbon"];
  items: readonly EditableBouquetItem[];
  selectedUid?: string | null;
  interactive?: boolean;
  revealStage?: "static" | "closed" | "opening" | "bloomed";
  reducedMotion?: boolean;
  svgRef?: React.Ref<SVGSVGElement>;
  className?: string;
  ariaLabel?: string;
  onCanvasBackgroundPointerDown?: (event: React.PointerEvent<SVGSVGElement>) => void;
  onItemPointerDown?: (uid: string, event: React.PointerEvent<SVGGElement>) => void;
}

export function buildBouquetAltText(
  paper: BouquetJson["paper"],
  ribbon: BouquetJson["ribbon"],
  items: readonly { type: BouquetJson["items"][number]["type"] }[]
): string {
  const paperName = getPaperMeta(paper).name;
  const ribbonName = getRibbonMeta(ribbon).name;
  const uniqueNames = Array.from(
    new Set(items.map((item) => getElementMeta(item.type).name))
  );
  const flowerSummary =
    uniqueNames.length > 0 ? uniqueNames.slice(0, 6).join(", ") : "bunga pilihan";
  return `Buket bunga digital berisi ${flowerSummary}, dibungkus dengan ${paperName} dan diikat ${ribbonName}.`;
}

/**
 * Shared SVG renderer for:
 * 1. Interactive Bouquet Builder Canvas (selection ring, pointer events)
 * 2. Live Preview & Client PNG Export
 * 3. Choreographed Reveal Animation on `/b/[id]`
 */
export function BouquetSvg({
  paper,
  ribbon,
  items,
  selectedUid = null,
  interactive = false,
  revealStage = "static",
  reducedMotion = false,
  svgRef,
  className,
  ariaLabel,
  onCanvasBackgroundPointerDown,
  onItemPointerDown,
}: BouquetSvgProps): React.ReactElement {
  const reactId = React.useId().replace(/:/g, "");
  const sortedItems = React.useMemo(() => [...items].sort((a, b) => a.z - b.z), [items]);

  const computedAlt = ariaLabel ?? buildBouquetAltText(paper, ribbon, items);

  const isAnimatingReveal = revealStage !== "static" && !reducedMotion;
  const isClosed = revealStage === "closed" && !reducedMotion;

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      role="img"
      aria-label={computedAlt}
      onPointerDown={onCanvasBackgroundPointerDown}
      className={className ?? "h-auto w-full select-none"}
      style={{ touchAction: interactive ? "none" : "auto" }}
    >
      <title>{computedAlt}</title>
      <WrappingPaperDefs paper={paper} idPrefix={reactId} />

      {/* Subtle warm radial glow behind the bouquet */}
      <circle cx="300" cy="310" r="235" fill="#FCEEF2" fillOpacity="0.55" />

      {/* Layer 1: Wrapping Paper Back */}
      <g
        style={
          isAnimatingReveal
            ? {
                transformOrigin: "300px 500px",
                transform: isClosed ? "scale(0.84, 0.92)" : "scale(1, 1)",
                opacity: isClosed ? 0.85 : 1,
                transition:
                  "transform 700ms cubic-bezier(0.22, 1, 0.36, 1), opacity 500ms ease",
              }
            : undefined
        }
      >
        <WrappingPaperBack paper={paper} idPrefix={reactId} />
      </g>

      {/* Layer 2: Flowers & Greenery Items (sorted by z-index) */}
      <g>
        {sortedItems.map((item, idx) => {
          const isSelected = interactive && selectedUid === item.uid;
          const bloomVisible =
            revealStage === "static" ||
            reducedMotion ||
            revealStage === "opening" ||
            revealStage === "bloomed";

          const staggerMs = isAnimatingReveal ? 180 + idx * 65 : 0;

          return (
            <g
              key={item.uid}
              data-testid={`bouquet-item-${item.type}`}
              transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}
              onPointerDown={
                interactive && onItemPointerDown
                  ? (e) => {
                      e.stopPropagation();
                      onItemPointerDown(item.uid, e);
                    }
                  : undefined
              }
              style={{
                cursor: interactive ? "grab" : "default",
              }}
            >
              <g
                style={
                  isAnimatingReveal
                    ? {
                        opacity: bloomVisible ? 1 : 0,
                        transform: bloomVisible
                          ? "scale(1) translateY(0px)"
                          : "scale(0.35) translateY(28px)",
                        transition: `opacity 460ms ease ${staggerMs}ms, transform 560ms cubic-bezier(0.34, 1.56, 0.64, 1) ${staggerMs}ms`,
                      }
                    : reducedMotion && revealStage !== "static"
                      ? {
                          opacity: revealStage === "closed" ? 0 : 1,
                          transition: "opacity 350ms ease",
                        }
                      : undefined
                }
              >
                <BouquetElementGraphic type={item.type} />
              </g>

              {isSelected && (
                <g data-editor-overlay="true" pointerEvents="none">
                  <circle
                    cx="0"
                    cy="-4"
                    r="46"
                    fill="none"
                    stroke="#DF5B7D"
                    strokeWidth={2.2 / Math.max(0.6, item.scale)}
                    strokeDasharray="6 5"
                  />
                  <circle
                    cx="0"
                    cy="-50"
                    r={5.5 / Math.max(0.6, item.scale)}
                    fill="#DF5B7D"
                    stroke="#FFFFFF"
                    strokeWidth={1.8 / Math.max(0.6, item.scale)}
                  />
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Layer 3: Wrapping Paper Front Fold + Ribbon Bow */}
      <g
        style={
          isAnimatingReveal
            ? {
                transformOrigin: "300px 520px",
                transform: isClosed
                  ? "scale(0.95, 1.04) translateY(-10px)"
                  : "scale(1, 1) translateY(0px)",
                transition: "transform 720ms cubic-bezier(0.22, 1, 0.36, 1)",
              }
            : undefined
        }
      >
        <WrappingPaperFront paper={paper} idPrefix={reactId} />
        <BouquetRibbonBow ribbon={ribbon} />
      </g>
    </svg>
  );
}
