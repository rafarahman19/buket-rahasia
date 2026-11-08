"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Flag, RotateCw, ShieldOff, Sparkles } from "lucide-react";
import {
  type BouquetJson,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  getElementMeta,
} from "@/lib/bouquet-catalog";
import {
  BouquetFlowerHeadGraphic,
  BouquetRibbonBowShapes,
  BouquetStemGraphic,
  WrappingPaperBack,
  WrappingPaperDefs,
  WrappingPaperFront,
} from "./BouquetArt";
import { BouquetSvg, buildBouquetAltText, type EditableBouquetItem } from "./BouquetSvg";

/**
 * Configurable timing & physics constants for the 4-stage bouquet reveal sequence.
 */
export const REVEAL_TIMING = {
  /** Stage 1 (0.0s - 0.56s): Wrapping paper back layer fades & slides up gently */
  wrapperBackDelayS: 0,
  wrapperBackDurationS: 0.56,
  wrapperBackInitialScale: 0.92,
  wrapperBackInitialY: 24,

  /** Stage 2 (0.56s - ~3.1s): Stems grow & flowers bloom one by one (sorted by z) */
  flowersStartDelayS: 0.56,
  flowerStaggerS: 0.13, // 130ms stagger per element (within 120-180ms)
  maxTotalStaggerS: 1.92, // Caps 25-item total stagger so all items finish within ~3s
  minFlowersWindowS: 1.94, // Keeps 1-flower & 10-flower window aligned around ~2.5s
  flowerBloomSettleBufferS: 0.62,
  flowerOpacityFadeS: 0.18,
  flowerSpring: {
    stiffness: 170,
    damping: 14,
    mass: 0.9,
  },
  stemGrowDurationS: 0.34,
  headBloomOffsetS: 0.12,
  headBloomDurationS: 0.48,
  centerPopOffsetS: 0.06,
  centerPopDurationS: 0.42,
  petalOpenRotationDeg: 20,
  maxInitialRotationOffsetDeg: 15,

  /** Lightweight floating petal/sparkle particles during bloom (capped <= 10) */
  particleCount: 8,
  particleMinDurationS: 1.45,
  particleMaxDurationS: 1.85,

  /** Stage 3 (~2.5s - 3.8s): Front wrapper folds over stems, then ribbon bow ties */
  wrapperFrontDurationS: 0.44,
  wrapperFrontInitialScale: 0.94,
  wrapperFrontInitialY: 32,
  ribbonOffsetAfterFrontS: 0.22,
  ribbonDurationS: 0.5,
  ribbonBounceScale: [0, 1.15, 1] as [number, number, number],

  /** Stage 4 (~3.5s - 4.8s): Secret message card fades & slides up */
  messageOffsetAfterRibbonS: 0.3,
  messageDurationS: 0.72,
  messageInitialY: 18,

  /** Reduced-motion fallback duration (300ms simple fade) */
  reducedMotionFadeS: 0.3,
} as const;

interface RevealSchedule {
  staggerS: number;
  lastItemStartS: number;
  wrapperFrontDelayS: number;
  ribbonDelayS: number;
  messageDelayS: number;
}

function computeRevealSchedule(itemCount: number): RevealSchedule {
  const clampedCount = Math.max(1, Math.min(itemCount, 25));
  const staggerS =
    clampedCount > 1
      ? Math.min(
          REVEAL_TIMING.flowerStaggerS,
          REVEAL_TIMING.maxTotalStaggerS / (clampedCount - 1)
        )
      : 0;
  const lastItemStartS = REVEAL_TIMING.flowersStartDelayS + (clampedCount - 1) * staggerS;
  const wrapperFrontDelayS = Math.max(
    REVEAL_TIMING.flowersStartDelayS + REVEAL_TIMING.minFlowersWindowS,
    lastItemStartS + REVEAL_TIMING.flowerBloomSettleBufferS
  );
  const ribbonDelayS = wrapperFrontDelayS + REVEAL_TIMING.ribbonOffsetAfterFrontS;
  const messageDelayS =
    ribbonDelayS +
    REVEAL_TIMING.ribbonDurationS +
    REVEAL_TIMING.messageOffsetAfterRibbonS;

  return {
    staggerS,
    lastItemStartS,
    wrapperFrontDelayS,
    ribbonDelayS,
    messageDelayS,
  };
}

/**
 * Deterministic golden-ratio unit hash in [0, 1) so SSR and replays never mismatch.
 */
function seededUnit(seed: number): number {
  const raw = ((seed + 1) * 0.61803398875) % 1;
  return raw < 0 ? raw + 1 : raw;
}

interface ItemAnimationSpec {
  item: EditableBouquetItem;
  isFlower: boolean;
  delayS: number;
  localDx: number;
  localDy: number;
  initialRotationOffsetDeg: number;
  petalStartDeg: number;
  petalOvershootDeg: number;
}

/**
 * Computes the local SVG translation offset that hides an item down inside the
 * bouquet cone's base pocket (around x=300, y=425) regardless of saved rotation/scale.
 */
function buildItemAnimationSpec(
  item: EditableBouquetItem,
  orderIndex: number,
  staggerS: number
): ItemAnimationSpec {
  const isFlower = getElementMeta(item.type).category === "flower";
  const delayS = REVEAL_TIMING.flowersStartDelayS + orderIndex * staggerS;

  const dxSvg = (300 - item.x) * 0.5;
  const dySvg = Math.max(92, 425 - item.y);
  const safeScale = Math.max(0.4, item.scale);
  const rad = (item.rotation * Math.PI) / 180;

  const localDx =
    Math.round(((dxSvg * Math.cos(rad) + dySvg * Math.sin(rad)) / safeScale) * 100) / 100;
  const localDy =
    Math.round(((-dxSvg * Math.sin(rad) + dySvg * Math.cos(rad)) / safeScale) * 100) /
    100;

  const direction = orderIndex % 2 === 0 ? -1 : 1;
  const magnitude =
    8 + seededUnit(orderIndex * 3 + 1) * (REVEAL_TIMING.maxInitialRotationOffsetDeg - 8);
  const initialRotationOffsetDeg = Math.round(direction * magnitude * 10) / 10;

  const petalSign = orderIndex % 2 === 0 ? -1 : 1;
  const petalStartDeg = petalSign * REVEAL_TIMING.petalOpenRotationDeg;
  const petalOvershootDeg = -petalSign * 4;

  return {
    item,
    isFlower,
    delayS,
    localDx,
    localDy,
    initialRotationOffsetDeg,
    petalStartDeg,
    petalOvershootDeg,
  };
}

interface BloomParticleSpec {
  id: string;
  kind: "petal" | "sparkle";
  x: number;
  y: number;
  fill: string;
  delayS: number;
  durationS: number;
  driftX: number;
  driftY: number;
  driftRot: number;
}

const PARTICLE_COLORS = [
  "#F28CA8",
  "#F4BA49",
  "#B698EB",
  "#F4978E",
  "#F5C451",
  "#8DC09A",
] as const;

function buildBloomParticles(schedule: RevealSchedule): BloomParticleSpec[] {
  const count = Math.max(0, Math.min(REVEAL_TIMING.particleCount, 10));
  const bloomSpanS = Math.max(
    0.9,
    schedule.wrapperFrontDelayS - REVEAL_TIMING.flowersStartDelayS - 0.35
  );

  return Array.from({ length: count }, (_, idx) => {
    const progress = count > 1 ? idx / (count - 1) : 0.5;
    const jitterX = (seededUnit(idx * 5 + 2) - 0.5) * 44;
    const x = Math.round(192 + progress * 216 + jitterX);
    const y = Math.round(250 + seededUnit(idx * 7 + 3) * 85);
    const delayS =
      Math.round(
        (REVEAL_TIMING.flowersStartDelayS + 0.14 + progress * bloomSpanS) * 100
      ) / 100;
    const durationS =
      Math.round(
        (REVEAL_TIMING.particleMinDurationS +
          seededUnit(idx * 11 + 4) *
            (REVEAL_TIMING.particleMaxDurationS - REVEAL_TIMING.particleMinDurationS)) *
          100
      ) / 100;
    const driftX = Math.round(
      (idx % 2 === 0 ? -1 : 1) * (10 + seededUnit(idx * 13) * 18)
    );
    const driftY = -Math.round(78 + seededUnit(idx * 17 + 1) * 38);
    const driftRot = Math.round(
      (idx % 2 === 0 ? 1 : -1) * (28 + seededUnit(idx * 19) * 34)
    );

    return {
      id: `particle-${idx}`,
      kind: idx % 3 === 1 ? "sparkle" : "petal",
      x,
      y,
      fill: PARTICLE_COLORS[idx % PARTICLE_COLORS.length]!,
      delayS,
      durationS,
      driftX,
      driftY,
      driftRot,
    };
  });
}

function AnimatedBouquetRevealSvg({
  paper,
  ribbon,
  items,
  schedule,
}: {
  paper: BouquetJson["paper"];
  ribbon: BouquetJson["ribbon"];
  items: readonly EditableBouquetItem[];
  schedule: RevealSchedule;
}): React.ReactElement {
  const reactId = React.useId().replace(/:/g, "");
  const computedAlt = React.useMemo(
    () => buildBouquetAltText(paper, ribbon, items),
    [paper, ribbon, items]
  );

  const itemSpecs = React.useMemo(() => {
    const sorted = [...items].sort((a, b) => a.z - b.z);
    return sorted.map((item, idx) =>
      buildItemAnimationSpec(item, idx, schedule.staggerS)
    );
  }, [items, schedule.staggerS]);

  const flowerSpecs = React.useMemo(
    () => itemSpecs.filter((spec) => spec.isFlower),
    [itemSpecs]
  );

  const particles = React.useMemo(() => buildBloomParticles(schedule), [schedule]);

  const sharedItemOriginStyle: React.CSSProperties & {
    originX: string;
    originY: string;
  } = {
    transformBox: "view-box",
    originX: "0px",
    originY: "0px",
  };

  return (
    <svg
      viewBox={`0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`}
      role="img"
      aria-label={computedAlt}
      data-testid="reveal-bouquet-svg"
      className="h-auto w-full select-none"
    >
      <title>{computedAlt}</title>
      <WrappingPaperDefs paper={paper} idPrefix={reactId} />

      {/* Subtle warm radial glow behind the bouquet */}
      <circle cx="300" cy="310" r="235" fill="#FCEEF2" fillOpacity="0.55" />

      {/* Layer 1: Wrapping Paper Back (0.0s - 0.6s) */}
      <motion.g
        data-layer="wrapper-back"
        data-testid="layer-wrapper-back"
        initial={{
          opacity: 0,
          y: REVEAL_TIMING.wrapperBackInitialY,
          scale: REVEAL_TIMING.wrapperBackInitialScale,
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: REVEAL_TIMING.wrapperBackDelayS,
          duration: REVEAL_TIMING.wrapperBackDurationS,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <WrappingPaperBack paper={paper} idPrefix={reactId} />
      </motion.g>

      {/* Layer 2: Stems & Greenery (sorted by saved z, growing upward from base) */}
      <g data-layer="stems-and-greenery" data-testid="layer-stems-and-greenery">
        {itemSpecs.map((spec) => (
          <g
            key={`stem-${spec.item.uid}`}
            data-testid={!spec.isFlower ? `bouquet-item-${spec.item.type}` : undefined}
            transform={`translate(${spec.item.x}, ${spec.item.y}) rotate(${spec.item.rotation}) scale(${spec.item.scale})`}
          >
            <motion.g
              style={sharedItemOriginStyle}
              initial={{
                opacity: 0,
                x: spec.localDx,
                y: spec.localDy,
                scale: 0,
                rotate: spec.initialRotationOffsetDeg,
              }}
              animate={{
                opacity: 1,
                x: 0,
                y: 0,
                scale: 1,
                rotate: 0,
              }}
              transition={{
                default: {
                  type: "spring",
                  stiffness: REVEAL_TIMING.flowerSpring.stiffness,
                  damping: REVEAL_TIMING.flowerSpring.damping,
                  mass: REVEAL_TIMING.flowerSpring.mass,
                  delay: spec.delayS,
                },
                opacity: {
                  duration: REVEAL_TIMING.flowerOpacityFadeS,
                  delay: spec.delayS,
                  ease: "easeOut",
                },
              }}
            >
              <g
                className="bouquet-reveal-stem"
                style={{
                  animationDelay: `${spec.delayS}s`,
                  animationDuration: `${REVEAL_TIMING.stemGrowDurationS}s`,
                }}
              >
                <BouquetStemGraphic type={spec.item.type} />
              </g>
            </motion.g>
          </g>
        ))}
      </g>

      {/* Layer 3: Flower Heads (sorted by saved z, blooming after stem rises) */}
      <g data-layer="flowers" data-testid="layer-flowers">
        {flowerSpecs.map((spec) => {
          const headDelayS = spec.delayS + REVEAL_TIMING.headBloomOffsetS;
          const centerDelayS = headDelayS + REVEAL_TIMING.centerPopOffsetS;

          return (
            <g
              key={`head-${spec.item.uid}`}
              data-testid={`bouquet-item-${spec.item.type}`}
              transform={`translate(${spec.item.x}, ${spec.item.y}) rotate(${spec.item.rotation}) scale(${spec.item.scale})`}
            >
              <motion.g
                style={sharedItemOriginStyle}
                initial={{
                  opacity: 0,
                  x: spec.localDx,
                  y: spec.localDy,
                  scale: 0,
                  rotate: spec.initialRotationOffsetDeg,
                }}
                animate={{
                  opacity: 1,
                  x: 0,
                  y: 0,
                  scale: 1,
                  rotate: 0,
                }}
                transition={{
                  default: {
                    type: "spring",
                    stiffness: REVEAL_TIMING.flowerSpring.stiffness,
                    damping: REVEAL_TIMING.flowerSpring.damping,
                    mass: REVEAL_TIMING.flowerSpring.mass,
                    delay: spec.delayS,
                  },
                  opacity: {
                    duration: REVEAL_TIMING.flowerOpacityFadeS,
                    delay: spec.delayS,
                    ease: "easeOut",
                  },
                }}
              >
                <BouquetFlowerHeadGraphic
                  type={spec.item.type}
                  petalsClassName="bouquet-reveal-petals"
                  petalsStyle={
                    {
                      "--petal-start-rot": `${spec.petalStartDeg}deg`,
                      "--petal-overshoot-rot": `${spec.petalOvershootDeg}deg`,
                      animationDelay: `${headDelayS}s`,
                      animationDuration: `${REVEAL_TIMING.headBloomDurationS}s`,
                    } as React.CSSProperties
                  }
                  centerClassName="bouquet-reveal-center"
                  centerStyle={{
                    animationDelay: `${centerDelayS}s`,
                    animationDuration: `${REVEAL_TIMING.centerPopDurationS}s`,
                  }}
                />
              </motion.g>
            </g>
          );
        })}
      </g>

      {/* Floating Petal & Sparkle Particles (pure CSS/SVG, capped <= 10, fade to 0) */}
      <g
        data-layer="particles"
        data-testid="layer-particles"
        aria-hidden="true"
        pointerEvents="none"
      >
        {particles.map((p) => (
          <g key={p.id} transform={`translate(${p.x}, ${p.y})`}>
            <g
              className="bouquet-reveal-particle"
              style={
                {
                  "--drift-x": `${p.driftX}px`,
                  "--drift-y": `${p.driftY}px`,
                  "--drift-rot": `${p.driftRot}deg`,
                  animationDelay: `${p.delayS}s`,
                  animationDuration: `${p.durationS}s`,
                } as React.CSSProperties
              }
            >
              {p.kind === "petal" ? (
                <path
                  d="M 0 -8.5 C 6 -5, 7 3.5, 0 8.5 C -7 3.5, -6 -5, 0 -8.5 Z"
                  fill={p.fill}
                  fillOpacity="0.92"
                  stroke="#FFFFFF"
                  strokeWidth="1"
                />
              ) : (
                <path
                  d="M 0 -8 L 2.2 -2.2 L 8 0 L 2.2 2.2 L 0 8 L -2.2 2.2 L -8 0 L -2.2 -2.2 Z"
                  fill={p.fill}
                  stroke="#FFFDF7"
                  strokeWidth="0.9"
                />
              )}
            </g>
          </g>
        ))}
      </g>

      {/* Layer 4: Wrapping Paper Front Flap (folds over stems) */}
      <motion.g
        data-layer="wrapper-front"
        data-testid="layer-wrapper-front"
        initial={{
          opacity: 0,
          y: REVEAL_TIMING.wrapperFrontInitialY,
          scale: REVEAL_TIMING.wrapperFrontInitialScale,
        }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          delay: schedule.wrapperFrontDelayS,
          duration: REVEAL_TIMING.wrapperFrontDurationS,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        <WrappingPaperFront paper={paper} idPrefix={reactId} />
      </motion.g>

      {/* Layer 5: Ribbon Bow (ties at bouquet waist with gentle bounce 0 -> 1.15 -> 1) */}
      <g data-layer="ribbon" data-testid="layer-ribbon" transform="translate(300, 492)">
        <motion.g
          data-testid="ribbon-bow-motion"
          style={sharedItemOriginStyle}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1],
            scale: REVEAL_TIMING.ribbonBounceScale,
          }}
          transition={{
            delay: schedule.ribbonDelayS,
            duration: REVEAL_TIMING.ribbonDurationS,
            times: [0, 0.62, 1],
            ease: ["easeOut", "easeInOut"],
          }}
        >
          <BouquetRibbonBowShapes ribbon={ribbon} />
        </motion.g>
      </g>
    </svg>
  );
}

export interface RevealExperienceProps {
  bouquetId: string;
  bouquet: BouquetJson;
  message: string;
  signoff: string | null;
  recipientName: string | null;
  blockToken: string;
  initialOpenReport?: boolean;
}

export function RevealExperience({
  bouquetId,
  bouquet,
  message,
  signoff,
  recipientName,
  blockToken,
  initialOpenReport = false,
}: RevealExperienceProps): React.ReactElement {
  const [motionMode, setMotionMode] = React.useState<"pending" | "reduced" | "full">(
    "pending"
  );
  const [replayKey, setReplayKey] = React.useState(0);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotionPreference = () => {
      setMotionMode(mq.matches ? "reduced" : "full");
    };
    syncMotionPreference();
    mq.addEventListener("change", syncMotionPreference);
    return () => {
      mq.removeEventListener("change", syncMotionPreference);
    };
  }, []);

  const [reportOpen, setReportOpen] = React.useState(initialOpenReport);
  const [reportReason, setReportReason] = React.useState("");
  const [reportStatus, setReportStatus] = React.useState<
    "idle" | "submitting" | "done" | "error"
  >("idle");
  const [reportError, setReportError] = React.useState<string | null>(null);

  const displayItems = React.useMemo<EditableBouquetItem[]>(
    () =>
      bouquet.items.map((item, idx) => ({
        uid: `rev_${idx}`,
        ...item,
      })),
    [bouquet.items]
  );

  const schedule = React.useMemo(
    () => computeRevealSchedule(displayItems.length),
    [displayItems.length]
  );

  const handleSubmitReport = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReportStatus("submitting");
    setReportError(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bouquetId,
          reason: reportReason.trim() || null,
        }),
      });

      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "Gagal mengirim laporan. Coba lagi sebentar ya.");
      }

      setReportStatus("done");
    } catch (err) {
      setReportStatus("error");
      setReportError(
        err instanceof Error
          ? err.message
          : "Terjadi kendala saat mengirim laporan. Coba lagi ya."
      );
    }
  };

  const blockHref = `/blokir?token=${encodeURIComponent(blockToken)}`;

  const messageCardBody = (
    <>
      {recipientName && (
        <p className="mb-2 text-xs font-bold uppercase tracking-widest text-blush-600">
          Untuk: {recipientName}
        </p>
      )}

      <p
        data-testid="reveal-secret-message"
        className="whitespace-pre-line break-words font-script text-2xl leading-relaxed text-ink sm:text-3xl"
      >
        {message}
      </p>

      {signoff && (
        <p
          data-testid="reveal-signoff"
          className="mt-4 text-right font-script text-xl text-ink-soft sm:text-2xl"
        >
          — {signoff}
        </p>
      )}
    </>
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
      {/* Top Badge */}
      <div className="mb-4 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blush-100 px-3.5 py-1 text-xs font-bold text-blush-700">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Kiriman Buket Rahasia Untukmu</span>
        </span>
      </div>

      {reportStatus === "done" ? (
        <div
          role="status"
          className="rounded-3xl border border-paper-border bg-paper-card p-6 text-center shadow-cozy sm:p-8"
        >
          <p className="font-script text-3xl font-bold text-ink">
            Terima kasih sudah melapor 🙏
          </p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            Laporanmu sudah kami catat dan isi pesan ini telah kami sembunyikan dari
            layarmu. Jika kamu tidak ingin menerima buket anonim lagi ke alamat emailmu,
            kamu juga bisa mengaktifkan pemblokiran di bawah ini.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={blockHref}
              className="inline-flex items-center gap-2 rounded-full bg-blush-500 px-6 py-3 text-sm font-bold text-white shadow-petal hover:bg-blush-600"
            >
              <ShieldOff className="h-4 w-4" aria-hidden="true" />
              <span>Jangan Kirim Lagi ke Email Ini</span>
            </Link>
            <Link
              href="/"
              className="inline-flex items-center rounded-full border border-paper-border bg-paper px-5 py-3 text-sm font-bold text-ink-soft hover:bg-paper-warm"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      ) : (
        <>
          {motionMode === "pending" ? (
            <div className="opacity-0" aria-hidden="true">
              <div className="relative mx-auto max-w-[440px] rounded-3xl border border-paper-border bg-gradient-to-b from-paper-card via-paper to-paper-warm p-3 shadow-cozy sm:p-5">
                <BouquetSvg
                  paper={bouquet.paper}
                  ribbon={bouquet.ribbon}
                  items={displayItems}
                  className="h-auto w-full"
                />
              </div>
              <section className="mt-6 rounded-3xl border border-blush-200 bg-paper-card p-6 shadow-cozy sm:p-8">
                {messageCardBody}
              </section>
            </div>
          ) : motionMode === "reduced" ? (
            <motion.div
              key={`reduced-${replayKey}`}
              data-testid="reveal-reduced-motion-fade"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: REVEAL_TIMING.reducedMotionFadeS,
                ease: "easeOut",
              }}
            >
              <div className="relative mx-auto max-w-[440px] rounded-3xl border border-paper-border bg-gradient-to-b from-paper-card via-paper to-paper-warm p-3 shadow-cozy sm:p-5">
                <BouquetSvg
                  paper={bouquet.paper}
                  ribbon={bouquet.ribbon}
                  items={displayItems}
                  className="h-auto w-full"
                />
                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    data-testid="replay-reveal-btn"
                    onClick={() => setReplayKey((k) => k + 1)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-soft shadow-sm transition-colors hover:bg-blush-50 hover:text-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden="true" />
                    <span>Putar ulang mekarnya</span>
                  </button>
                </div>
              </div>

              <section
                aria-label="Kartu pesan rahasia"
                data-testid="reveal-message-card"
                className="mt-6 rounded-3xl border border-blush-200 bg-paper-card p-6 shadow-cozy sm:p-8"
              >
                {messageCardBody}
              </section>
            </motion.div>
          ) : (
            <>
              {/* Animated Bouquet Stage */}
              <div className="relative mx-auto max-w-[440px] rounded-3xl border border-paper-border bg-gradient-to-b from-paper-card via-paper to-paper-warm p-3 shadow-cozy sm:p-5">
                <AnimatedBouquetRevealSvg
                  key={`stage-${replayKey}`}
                  paper={bouquet.paper}
                  ribbon={bouquet.ribbon}
                  items={displayItems}
                  schedule={schedule}
                />

                <div className="mt-2 flex justify-center">
                  <button
                    type="button"
                    data-testid="replay-reveal-btn"
                    onClick={() => setReplayKey((k) => k + 1)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-ink-soft shadow-sm transition-colors hover:bg-blush-50 hover:text-blush-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
                  >
                    <RotateCw className="h-3 w-3" aria-hidden="true" />
                    <span>Putar ulang mekarnya</span>
                  </button>
                </div>
              </div>

              {/* Secret Message Card (Plain text only — zero dangerouslySetInnerHTML) */}
              <motion.section
                key={`msg-${replayKey}`}
                aria-label="Kartu pesan rahasia"
                data-testid="reveal-message-card"
                initial={{ opacity: 0, y: REVEAL_TIMING.messageInitialY }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: schedule.messageDelayS,
                  duration: REVEAL_TIMING.messageDurationS,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="mt-6 rounded-3xl border border-blush-200 bg-paper-card p-6 shadow-cozy sm:p-8"
              >
                {messageCardBody}
              </motion.section>
            </>
          )}

          {/* Primary CTA: Send a bouquet to someone else */}
          <div className="mt-8 text-center">
            <Link
              href="/rakit"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blush-500 px-7 py-3.5 text-sm font-bold text-white shadow-petal transition-all hover:-translate-y-0.5 hover:bg-blush-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500 focus-visible:ring-offset-2 sm:text-base"
            >
              <span>Buat buket untuk orang lain 🌸</span>
            </Link>
          </div>

          {/* Safety Links: Laporkan & Jangan kirim lagi ke email ini */}
          <div className="mt-8 border-t border-paper-border pt-5 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-ink-muted">
              <button
                type="button"
                data-testid="open-report-btn"
                onClick={() => setReportOpen((v) => !v)}
                className="inline-flex items-center gap-1 underline-offset-4 hover:text-blush-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Laporkan</span>
              </button>
              <span aria-hidden="true">•</span>
              <Link
                href={blockHref}
                data-testid="block-email-link"
                className="inline-flex items-center gap-1 underline-offset-4 hover:text-blush-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blush-500"
              >
                <ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Jangan kirim lagi ke email ini</span>
              </Link>
            </div>

            {reportOpen && (
              <form
                onSubmit={handleSubmitReport}
                className="mx-auto mt-4 max-w-md rounded-2xl border border-paper-border bg-paper-card p-4 text-left shadow-sm"
              >
                <label
                  htmlFor="report-reason"
                  className="block text-xs font-bold text-ink"
                >
                  Laporkan pesan yang mengganggu atau tidak pantas
                </label>
                <p className="mt-0.5 text-[11px] text-ink-muted">
                  Pengirim yang disalahgunakan untuk mengganggu orang lain akan dibatasi
                  atau diblokir secara otomatis.
                </p>
                <textarea
                  id="report-reason"
                  rows={2}
                  maxLength={500}
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Alasan singkat (opsional, misal: spam atau pesan mengganggu)"
                  className="mt-2 w-full rounded-xl border border-paper-border bg-paper px-3 py-2 text-xs text-ink focus:border-blush-400 focus:outline-none focus:ring-2 focus:ring-blush-200"
                />
                {reportError && (
                  <p role="alert" className="mt-1.5 text-xs text-blush-700">
                    {reportError}
                  </p>
                )}
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setReportOpen(false)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold text-ink-soft hover:bg-paper-warm"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={reportStatus === "submitting"}
                    className="rounded-full bg-blush-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-blush-700 disabled:opacity-50"
                  >
                    {reportStatus === "submitting" ? "Mengirim..." : "Kirim Laporan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
