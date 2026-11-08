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
  BouquetFlowerHeadGraphic,
  BouquetRibbonBow,
  BouquetStemGraphic,
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

function SelectionRing({ scale }: { scale: number }): React.ReactElement {
  const safeScale = Math.max(0.6, scale);
  return (
    <g data-editor-overlay="true" pointerEvents="none">
      <circle
        cx="0"
        cy="-4"
        r="46"
        fill="none"
        stroke="#DF5B7D"
        strokeWidth={2.2 / safeScale}
        strokeDasharray="6 5"
      />
      <circle
        cx="0"
        cy="-50"
        r={5.5 / safeScale}
        fill="#DF5B7D"
        stroke="#FFFFFF"
        strokeWidth={1.8 / safeScale}
      />
    </g>
  );
}

/**
 * Shared static/interactive SVG renderer for Builder, Live Preview, PNG Export,
 * and Reduced-Motion Reveal.
 *
 * Enforces strict botanical layering from back to front:
 *   1. Wrapper back (`WrappingPaperBack`)
 *   2. Stems & greenery (sorted by saved `z`)
 *   3. Flower heads (sorted by saved `z`)
 *   4. Wrapper front flap (`WrappingPaperFront`)
 *   5. Ribbon bow (`BouquetRibbonBow`)
 */
export function BouquetSvg({
  paper,
  ribbon,
  items,
  selectedUid = null,
  interactive = false,
  svgRef,
  className,
  ariaLabel,
  onCanvasBackgroundPointerDown,
  onItemPointerDown,
}: BouquetSvgProps): React.ReactElement {
  const reactId = React.useId().replace(/:/g, "");
  const sortedItems = React.useMemo(() => [...items].sort((a, b) => a.z - b.z), [items]);

  const flowerItems = React.useMemo(
    () => sortedItems.filter((item) => getElementMeta(item.type).category === "flower"),
    [sortedItems]
  );

  const computedAlt = ariaLabel ?? buildBouquetAltText(paper, ribbon, items);

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
      <g data-layer="wrapper-back">
        <WrappingPaperBack paper={paper} idPrefix={reactId} />
      </g>

      {/* Layer 2: Stems & Greenery (sorted by saved z) */}
      <g data-layer="stems-and-greenery">
        {sortedItems.map((item) => {
          const isGreenery = getElementMeta(item.type).category === "greenery";
          const isSelected = interactive && selectedUid === item.uid;
          return (
            <g
              key={`stem-${item.uid}`}
              data-testid={isGreenery ? `bouquet-item-${item.type}` : undefined}
              transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(${item.scale})`}
              onPointerDown={
                interactive && onItemPointerDown
                  ? (e) => {
                      e.stopPropagation();
                      onItemPointerDown(item.uid, e);
                    }
                  : undefined
              }
              style={{ cursor: interactive ? "grab" : "default" }}
            >
              <BouquetStemGraphic type={item.type} />
              {isGreenery && isSelected && <SelectionRing scale={item.scale} />}
            </g>
          );
        })}
      </g>

      {/* Layer 3: Flower Heads (sorted by saved z) */}
      <g data-layer="flowers">
        {flowerItems.map((item) => {
          const isSelected = interactive && selectedUid === item.uid;
          return (
            <g
              key={`head-${item.uid}`}
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
              style={{ cursor: interactive ? "grab" : "default" }}
            >
              <BouquetFlowerHeadGraphic type={item.type} />
              {isSelected && <SelectionRing scale={item.scale} />}
            </g>
          );
        })}
      </g>

      {/* Layer 4: Wrapping Paper Front Flap */}
      <g data-layer="wrapper-front">
        <WrappingPaperFront paper={paper} idPrefix={reactId} />
      </g>

      {/* Layer 5: Ribbon Bow */}
      <g data-layer="ribbon">
        <BouquetRibbonBow ribbon={ribbon} />
      </g>
    </svg>
  );
}
