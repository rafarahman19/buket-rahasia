"use client";

import * as React from "react";
import {
  type BouquetElementType,
  CATALOG_ELEMENTS,
  MAX_BOUQUET_ITEMS,
  PAPER_STYLES,
  type PaperType,
  RIBBON_STYLES,
  type RibbonType,
} from "@/lib/bouquet-catalog";
import { BouquetElementGraphic } from "./BouquetArt";

type PaletteTab = "flower" | "greenery" | "paper" | "ribbon";

export interface PalettePanelProps {
  currentPaper: PaperType;
  currentRibbon: RibbonType;
  itemCount: number;
  onAddElement: (type: BouquetElementType) => void;
  onSelectPaper: (paper: PaperType) => void;
  onSelectRibbon: (ribbon: RibbonType) => void;
}

export function PalettePanel({
  currentPaper,
  currentRibbon,
  itemCount,
  onAddElement,
  onSelectPaper,
  onSelectRibbon,
}: PalettePanelProps): React.ReactElement {
  const [activeTab, setActiveTab] = React.useState<PaletteTab>("flower");
  const isFull = itemCount >= MAX_BOUQUET_ITEMS;

  const flowers = React.useMemo(
    () => CATALOG_ELEMENTS.filter((item) => item.category === "flower"),
    []
  );
  const greenery = React.useMemo(
    () => CATALOG_ELEMENTS.filter((item) => item.category === "greenery"),
    []
  );

  const tabs: Array<{ id: PaletteTab; label: string }> = [
    { id: "flower", label: "Bunga (12)" },
    { id: "greenery", label: "Daun (7)" },
    { id: "paper", label: "Kertas" },
    { id: "ribbon", label: "Pita" },
  ];

  return (
    <aside
      aria-label="Palet pilihan bunga, daun, kertas, dan pita"
      className="flex flex-col rounded-3xl border border-paper-border bg-paper-card p-3.5 shadow-card sm:p-5"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="font-script text-2xl font-bold text-ink">Pilih Rangkaianmu</h2>
        <span
          aria-live="polite"
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            isFull ? "bg-blush-100 text-blush-700" : "bg-sage-100 text-sage-600"
          }`}
        >
          {itemCount}/{MAX_BOUQUET_ITEMS} elemen
        </span>
      </div>

      {/* Category Tabs */}
      <div
        role="tablist"
        aria-label="Kategori elemen buket"
        className="mb-3 grid grid-cols-4 gap-1.5 rounded-2xl bg-paper-warm p-1"
      >
        {tabs.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-2 py-2 text-xs font-bold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 sm:text-sm ${
                selected
                  ? "bg-white text-blush-700 shadow-sm"
                  : "text-ink-soft hover:text-ink"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {isFull && (activeTab === "flower" || activeTab === "greenery") && (
        <p
          role="status"
          className="mb-3 rounded-xl bg-blush-50 px-3 py-2 text-xs font-medium text-blush-700"
        >
          Buketmu sudah penuh ({MAX_BOUQUET_ITEMS} elemen). Hapus satu elemen dulu kalau
          ingin mengganti ya!
        </p>
      )}

      {/* Tab Content */}
      <div className="max-h-[260px] overflow-y-auto pr-1 sm:max-h-[430px]">
        {(activeTab === "flower" || activeTab === "greenery") && (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {(activeTab === "flower" ? flowers : greenery).map((el) => (
              <button
                key={el.id}
                type="button"
                data-testid={`add-element-${el.id}`}
                disabled={isFull}
                onClick={() => onAddElement(el.id)}
                className="group flex flex-col items-center rounded-2xl border border-paper-border/80 bg-paper p-2 text-center transition-all hover:-translate-y-0.5 hover:border-blush-300 hover:bg-blush-50/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-white/80 p-1">
                  <svg
                    viewBox="-52 -64 104 148"
                    aria-hidden="true"
                    className="h-12 w-12 transition-transform duration-200 group-hover:scale-110"
                  >
                    <BouquetElementGraphic type={el.id} />
                  </svg>
                </div>
                <span className="mt-1.5 line-clamp-1 text-xs font-bold text-ink">
                  {el.name}
                </span>
                <span className="hidden line-clamp-1 text-[10px] text-ink-muted sm:block">
                  {el.meaning}
                </span>
              </button>
            ))}
          </div>
        )}

        {activeTab === "paper" && (
          <div className="grid grid-cols-2 gap-2.5">
            {PAPER_STYLES.map((paper) => {
              const selected = currentPaper === paper.id;
              return (
                <button
                  key={paper.id}
                  type="button"
                  data-testid={`select-paper-${paper.id}`}
                  aria-pressed={selected}
                  onClick={() => onSelectPaper(paper.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 ${
                    selected
                      ? "border-blush-500 bg-blush-50/70 ring-1 ring-blush-400"
                      : "border-paper-border bg-paper hover:border-blush-300"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 rounded-full border-2 shadow-inner"
                    style={{
                      backgroundColor: paper.frontFill,
                      borderColor: paper.stroke,
                    }}
                  />
                  <span className="text-xs font-bold text-ink">{paper.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {activeTab === "ribbon" && (
          <div className="grid grid-cols-2 gap-2.5">
            {RIBBON_STYLES.map((ribbon) => {
              const selected = currentRibbon === ribbon.id;
              return (
                <button
                  key={ribbon.id}
                  type="button"
                  data-testid={`select-ribbon-${ribbon.id}`}
                  aria-pressed={selected}
                  onClick={() => onSelectRibbon(ribbon.id)}
                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 ${
                    selected
                      ? "border-blush-500 bg-blush-50/70 ring-1 ring-blush-400"
                      : "border-paper-border bg-paper hover:border-blush-300"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-9 w-9 shrink-0 rounded-full border-2 shadow-inner"
                    style={{
                      backgroundColor: ribbon.primary,
                      borderColor: ribbon.stroke,
                    }}
                  />
                  <span className="text-xs font-bold text-ink">{ribbon.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-ink-muted">
        Tips: Ketuk bunga untuk menambah, geser di kanvas untuk mengatur posisi, atau
        cubit dua jari di layar HP untuk mengubah ukuran.
      </p>
    </aside>
  );
}
