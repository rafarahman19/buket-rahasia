import * as React from "react";
import {
  type BouquetElementType,
  getElementMeta,
  getPaperMeta,
  getRibbonMeta,
  type PaperType,
  type RibbonType,
} from "@/lib/bouquet-catalog";

/**
 * Renders the stem (for flowers) or full leafy sprig (for greenery).
 * Separating stems/greenery from flower heads enforces proper botanical layering:
 * wrapper back -> stems/greenery -> flower heads -> wrapper front -> ribbon,
 * and allows stems to grow upward (`scaleY: 0 -> 1`) before flower heads bloom on top.
 */
export function BouquetStemGraphic({
  type,
}: {
  type: BouquetElementType;
}): React.ReactElement {
  switch (type) {
    case "rose":
      return (
        <g>
          <path
            d="M 0 28 Q -4 68 2 115"
            fill="none"
            stroke="#6E9975"
            strokeWidth="4.2"
            strokeLinecap="round"
          />
          <path
            d="M -1 62 Q -22 52 -24 38 Q -8 40 -1 56 Z"
            fill="#97C09D"
            stroke="#5D8464"
            strokeWidth="1.6"
          />
          <path
            d="M 1 76 Q 21 66 24 52 Q 9 54 1 70 Z"
            fill="#A6CCA9"
            stroke="#5D8464"
            strokeWidth="1.6"
          />
        </g>
      );

    case "tulip":
      return (
        <g>
          <path
            d="M 0 26 Q 3 72 -2 120"
            fill="none"
            stroke="#6B9871"
            strokeWidth="4.5"
            strokeLinecap="round"
          />
          <path
            d="M 1 96 Q -24 68 -20 34 Q -5 54 1 84 Z"
            fill="#8EB893"
            stroke="#5B8360"
            strokeWidth="1.6"
          />
        </g>
      );

    case "sunflower":
      return (
        <g>
          <path
            d="M 0 32 Q -3 76 3 122"
            fill="none"
            stroke="#65916A"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M 0 74 Q 26 62 28 45 Q 10 48 0 68 Z"
            fill="#8CB88E"
            stroke="#557D5A"
            strokeWidth="1.6"
          />
        </g>
      );

    case "daisy":
      return (
        <path
          d="M 0 24 Q 4 68 0 112"
          fill="none"
          stroke="#739E79"
          strokeWidth="3.8"
          strokeLinecap="round"
        />
      );

    case "lily":
      return (
        <path
          d="M 0 28 Q -4 74 2 118"
          fill="none"
          stroke="#68956E"
          strokeWidth="4.2"
          strokeLinecap="round"
        />
      );

    case "peony":
      return (
        <path
          d="M 0 30 Q 2 74 -3 116"
          fill="none"
          stroke="#6C9872"
          strokeWidth="4.4"
          strokeLinecap="round"
        />
      );

    case "lavender":
      return (
        <g>
          <path
            d="M 0 -46 Q 2 34 -2 120"
            fill="none"
            stroke="#759B7A"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M 0 56 Q -18 42 -16 26 Q -4 36 0 50 Z"
            fill="#98B99D"
            stroke="#618566"
            strokeWidth="1.3"
          />
          <path
            d="M 0 64 Q 18 50 16 34 Q 4 44 0 58 Z"
            fill="#98B99D"
            stroke="#618566"
            strokeWidth="1.3"
          />
        </g>
      );

    case "babys_breath": {
      const twigEnds = [
        { x: -24, y: -18 },
        { x: -12, y: -32 },
        { x: 4, y: -36 },
        { x: 20, y: -26 },
        { x: 26, y: -10 },
        { x: -18, y: 0 },
        { x: 0, y: -16 },
        { x: 14, y: -6 },
        { x: -4, y: 4 },
      ];
      return (
        <g>
          <path
            d="M 0 20 Q 1 68 0 114"
            fill="none"
            stroke="#7FA684"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {twigEnds.map((b, i) => (
            <line
              key={`twig-${i}`}
              x1="0"
              y1="20"
              x2={b.x}
              y2={b.y}
              stroke="#8EB392"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          ))}
        </g>
      );
    }

    case "hydrangea":
      return (
        <path
          d="M 0 28 Q -2 72 2 116"
          fill="none"
          stroke="#6C9772"
          strokeWidth="4.4"
          strokeLinecap="round"
        />
      );

    case "ranunculus":
      return (
        <path
          d="M 0 26 Q 3 70 -1 114"
          fill="none"
          stroke="#719B76"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );

    case "chamomile":
      return (
        <g>
          <path
            d="M 0 22 Q 0 68 2 112"
            fill="none"
            stroke="#79A37F"
            strokeWidth="3.4"
            strokeLinecap="round"
          />
          <line x1="0" y1="24" x2="-16" y2="-16" stroke="#79A37F" strokeWidth="2.4" />
          <line x1="0" y1="24" x2="15" y2="-20" stroke="#79A37F" strokeWidth="2.4" />
        </g>
      );

    case "orchid":
      return (
        <path
          d="M 0 24 Q -5 70 2 116"
          fill="none"
          stroke="#6C9672"
          strokeWidth="4"
          strokeLinecap="round"
        />
      );

    // -------------------------------------------------------------------------
    // GREENERY & FILLER LEAVES (7 Original Botanical Stems)
    // -------------------------------------------------------------------------
    case "eucalyptus": {
      const pairs = [-42, -22, -2, 18, 38];
      return (
        <g>
          <path
            d="M 0 -56 Q 3 28 -2 122"
            fill="none"
            stroke="#6C8F77"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <circle
            cx="0"
            cy="-56"
            r="11"
            fill="#A9C9B3"
            stroke="#648870"
            strokeWidth="1.5"
          />
          {pairs.map((y, idx) => (
            <g key={y}>
              <ellipse
                cx="-15"
                cy={y}
                rx="13.5"
                ry="11"
                transform={`rotate(-22 -15 ${y})`}
                fill={idx % 2 === 0 ? "#9EC1A9" : "#B3D1BC"}
                stroke="#648870"
                strokeWidth="1.5"
              />
              <ellipse
                cx="15"
                cy={y + 5}
                rx="13.5"
                ry="11"
                transform={`rotate(22 15 ${y + 5})`}
                fill={idx % 2 === 0 ? "#B3D1BC" : "#9EC1A9"}
                stroke="#648870"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </g>
      );
    }

    case "fern": {
      const fronds = [-46, -33, -20, -7, 6, 19, 32, 45];
      return (
        <g>
          <path
            d="M 0 -58 Q -2 30 2 122"
            fill="none"
            stroke="#5D8760"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {fronds.map((y, idx) => {
            const width = 10 + Math.sin(((idx + 1) / (fronds.length + 1)) * Math.PI) * 15;
            return (
              <g key={y}>
                <ellipse
                  cx={-width * 0.65}
                  cy={y}
                  rx={width * 0.65}
                  ry="4.5"
                  transform={`rotate(-24 ${-width * 0.65} ${y})`}
                  fill="#8FBC90"
                  stroke="#5A835C"
                  strokeWidth="1.3"
                />
                <ellipse
                  cx={width * 0.65}
                  cy={y + 2}
                  rx={width * 0.65}
                  ry="4.5"
                  transform={`rotate(24 ${width * 0.65} ${y + 2})`}
                  fill="#9CC69D"
                  stroke="#5A835C"
                  strokeWidth="1.3"
                />
              </g>
            );
          })}
        </g>
      );
    }

    case "ruscus": {
      const nodes = [-40, -18, 4, 26];
      return (
        <g>
          <path
            d="M 0 -56 Q 2 32 0 120"
            fill="none"
            stroke="#5A835E"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <path
            d="M 0 -64 C 7 -54, 7 -42, 0 -36 C -7 -42, -7 -54, 0 -64 Z"
            fill="#83B087"
            stroke="#527B56"
            strokeWidth="1.5"
          />
          {nodes.map((y) => (
            <g key={y}>
              <path
                d={`M -2 ${y + 10} C -22 ${y + 6}, -26 ${y - 10}, -18 ${y - 16} C -8 ${y - 12}, -2 ${y - 2}, -2 ${y + 10} Z`}
                fill="#7AA87E"
                stroke="#527B56"
                strokeWidth="1.5"
              />
              <path
                d={`M 2 ${y + 14} C 22 ${y + 10}, 26 ${y - 6}, 18 ${y - 12} C 8 ${y - 8}, 2 ${y + 2}, 2 ${y + 14} Z`}
                fill="#8DB991"
                stroke="#527B56"
                strokeWidth="1.5"
              />
            </g>
          ))}
        </g>
      );
    }

    case "olive_branch": {
      const leaves = [-38, -14, 10, 34];
      return (
        <g>
          <path
            d="M 0 -54 Q -3 30 2 120"
            fill="none"
            stroke="#788864"
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          {leaves.map((y, idx) => (
            <g key={y}>
              <ellipse
                cx="-16"
                cy={y}
                rx="15"
                ry="5"
                transform={`rotate(-32 -16 ${y})`}
                fill="#A8BA90"
                stroke="#6D7F58"
                strokeWidth="1.4"
              />
              <ellipse
                cx="16"
                cy={y + 4}
                rx="15"
                ry="5"
                transform={`rotate(32 16 ${y + 4})`}
                fill="#BCCCA6"
                stroke="#6D7F58"
                strokeWidth="1.4"
              />
              {idx === 1 && (
                <ellipse
                  cx="8"
                  cy={y + 12}
                  rx="4.2"
                  ry="5.5"
                  fill="#8B9E6B"
                  stroke="#5F7046"
                  strokeWidth="1.3"
                />
              )}
            </g>
          ))}
        </g>
      );
    }

    case "monstera_mini":
      return (
        <g>
          <path
            d="M 0 22 Q 2 70 0 118"
            fill="none"
            stroke="#5D8A6B"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 0 -38 C 28 -34, 36 -6, 28 14 L 12 8 L 24 20 C 16 30, 4 32, 0 28 C -4 32, -16 30, -24 20 L -12 8 L -28 14 C -36 -6, -28 -34, 0 -38 Z"
            fill="#8BB999"
            stroke="#537E61"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <line
            x1="0"
            y1="-30"
            x2="0"
            y2="24"
            stroke="#BCE0C6"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="-12"
            x2="-16"
            y2="-20"
            stroke="#BCE0C6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <line
            x1="0"
            y1="-12"
            x2="16"
            y2="-20"
            stroke="#BCE0C6"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </g>
      );

    case "ivy_trail": {
      const hearts = [
        { x: 0, y: -38, s: 0.78, rot: 0 },
        { x: -16, y: -14, s: 0.88, rot: -22 },
        { x: 15, y: 6, s: 0.92, rot: 20 },
        { x: -12, y: 28, s: 0.85, rot: -16 },
      ];
      return (
        <g>
          <path
            d="M 0 -42 C -14 -20, 14 0, -8 28 C -2 62, 2 90, 0 118"
            fill="none"
            stroke="#66906F"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {hearts.map((h, i) => (
            <g
              key={i}
              transform={`translate(${h.x}, ${h.y}) rotate(${h.rot}) scale(${h.s})`}
            >
              <path
                d="M 0 -14 L 14 -6 L 10 10 L 0 16 L -10 10 L -14 -6 Z"
                fill="#90BC98"
                stroke="#588260"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <line x1="0" y1="-10" x2="0" y2="12" stroke="#C5E3CA" strokeWidth="1.4" />
            </g>
          ))}
        </g>
      );
    }

    case "dusty_miller":
      return (
        <g>
          <path
            d="M 0 26 Q -2 72 1 118"
            fill="none"
            stroke="#8FA396"
            strokeWidth="3.8"
            strokeLinecap="round"
          />
          <path
            d="M 0 26 C -18 18, -28 2, -22 -10 C -14 -8, -14 -22, -6 -28 C -2 -22, -2 -38, 0 -40 C 2 -38, 2 -22, 6 -28 C 14 -22, 14 -8, 22 -10 C 28 2, 18 18, 0 26 Z"
            fill="#C9D8CE"
            stroke="#879C8F"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <line
            x1="0"
            y1="-28"
            x2="0"
            y2="22"
            stroke="#EEF5F0"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </g>
      );
  }
}

export interface BouquetFlowerHeadGraphicProps {
  type: BouquetElementType;
  petalsClassName?: string;
  petalsStyle?: React.CSSProperties;
  centerClassName?: string;
  centerStyle?: React.CSSProperties;
}

/**
 * Renders the flower head with distinct outer-petal and inner-center sub-layers
 * so petals can rotate/unfurl open while the center pops during the reveal bloom.
 * Returns `null` for greenery items (whose full foliage lives in `BouquetStemGraphic`).
 */
export function BouquetFlowerHeadGraphic({
  type,
  petalsClassName,
  petalsStyle,
  centerClassName,
  centerStyle,
}: BouquetFlowerHeadGraphicProps): React.ReactElement | null {
  if (getElementMeta(type).category === "greenery") {
    return null;
  }

  switch (type) {
    case "rose":
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            <ellipse
              cx="-16"
              cy="-2"
              rx="22"
              ry="24"
              transform="rotate(-18 -16 -2)"
              fill="#F9C5D3"
              stroke="#C96F89"
              strokeWidth="1.8"
            />
            <ellipse
              cx="16"
              cy="-2"
              rx="22"
              ry="24"
              transform="rotate(18 16 -2)"
              fill="#F9C5D3"
              stroke="#C96F89"
              strokeWidth="1.8"
            />
            <ellipse
              cx="0"
              cy="-14"
              rx="24"
              ry="20"
              fill="#FAD2DD"
              stroke="#C96F89"
              strokeWidth="1.8"
            />
            <ellipse
              cx="0"
              cy="10"
              rx="26"
              ry="20"
              fill="#F6B2C5"
              stroke="#C96F89"
              strokeWidth="1.8"
            />
          </g>
          <g className={centerClassName} style={centerStyle}>
            <circle
              cx="0"
              cy="-2"
              r="17"
              fill="#F39BB4"
              stroke="#BA5C78"
              strokeWidth="1.8"
            />
            <path
              d="M -10 -4 C -8 -14, 10 -14, 11 -3 C 12 7, -6 9, -8 0 C -9 -6, 4 -8, 5 -2 C 5 2, -2 3, -2 0"
              fill="none"
              stroke="#FFF2F6"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>
        </g>
      );

    case "tulip":
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            <path
              d="M 0 -36 C 16 -26, 18 8, 0 24 C -18 8, -16 -26, 0 -36 Z"
              fill="#F49580"
              stroke="#C46652"
              strokeWidth="1.8"
            />
            <path
              d="M -2 26 C -26 22, -30 -12, -16 -32 C -4 -22, 0 -2, -2 26 Z"
              fill="#F8B09F"
              stroke="#C46652"
              strokeWidth="1.8"
            />
            <path
              d="M 2 26 C 26 22, 30 -12, 16 -32 C 4 -22, 0 -2, 2 26 Z"
              fill="#FAC2B4"
              stroke="#C46652"
              strokeWidth="1.8"
            />
          </g>
          <g className={centerClassName} style={centerStyle}>
            <path
              d="M -8 -18 Q -12 -2 -6 14"
              fill="none"
              stroke="#FFE9E3"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>
      );

    case "sunflower": {
      const rayAngles = Array.from({ length: 16 }, (_, i) => i * 22.5);
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            {rayAngles.map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-27"
                rx="7.5"
                ry="16"
                transform={`rotate(${deg})`}
                fill={deg % 45 === 0 ? "#FBD977" : "#F6C854"}
                stroke="#C9962C"
                strokeWidth="1.4"
              />
            ))}
          </g>
          <g className={centerClassName} style={centerStyle}>
            <circle
              cx="0"
              cy="0"
              r="17"
              fill="#7D563C"
              stroke="#593B27"
              strokeWidth="2"
            />
            <circle cx="-5" cy="-5" r="1.8" fill="#B58867" />
            <circle cx="4" cy="-6" r="1.8" fill="#B58867" />
            <circle cx="0" cy="2" r="1.8" fill="#B58867" />
            <circle cx="-7" cy="4" r="1.8" fill="#B58867" />
            <circle cx="7" cy="3" r="1.8" fill="#B58867" />
            <circle cx="-2" cy="8" r="1.8" fill="#B58867" />
          </g>
        </g>
      );
    }

    case "daisy": {
      const petalAngles = Array.from({ length: 12 }, (_, i) => i * 30);
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            {petalAngles.map((deg) => (
              <ellipse
                key={deg}
                cx="0"
                cy="-21"
                rx="6.8"
                ry="15"
                transform={`rotate(${deg})`}
                fill="#FFFDF9"
                stroke="#D8CFC4"
                strokeWidth="1.4"
              />
            ))}
          </g>
          <g className={centerClassName} style={centerStyle}>
            <circle
              cx="0"
              cy="0"
              r="11.5"
              fill="#F9D56E"
              stroke="#CF9F34"
              strokeWidth="1.8"
            />
            <circle cx="-3" cy="-3" r="1.5" fill="#FFF3C4" />
          </g>
        </g>
      );
    }

    case "lily": {
      const tepalAngles = [0, 60, 120, 180, 240, 300];
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            {tepalAngles.map((deg, idx) => (
              <g key={deg} transform={`rotate(${deg})`}>
                <path
                  d="M 0 0 C -11 -12, -10 -34, 0 -42 C 10 -34, 11 -12, 0 0 Z"
                  fill={idx % 2 === 0 ? "#FAD4E2" : "#F6BDD2"}
                  stroke="#C96D8F"
                  strokeWidth="1.6"
                />
                <line
                  x1="0"
                  y1="-4"
                  x2="0"
                  y2="-28"
                  stroke="#E589AB"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
                <circle cx="-3" cy="-16" r="1.2" fill="#BA547A" />
                <circle cx="3" cy="-20" r="1.2" fill="#BA547A" />
              </g>
            ))}
          </g>
          <g className={centerClassName} style={centerStyle}>
            <line x1="0" y1="0" x2="-8" y2="-11" stroke="#88A87D" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="8" y2="-11" stroke="#88A87D" strokeWidth="1.5" />
            <line x1="0" y1="0" x2="0" y2="-13" stroke="#88A87D" strokeWidth="1.5" />
            <ellipse cx="-8" cy="-12" rx="2.6" ry="1.6" fill="#D57A4A" />
            <ellipse cx="8" cy="-12" rx="2.6" ry="1.6" fill="#D57A4A" />
            <ellipse cx="0" cy="-14" rx="2.6" ry="1.6" fill="#D57A4A" />
          </g>
        </g>
      );
    }

    case "peony":
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            <circle
              cx="-17"
              cy="2"
              r="19"
              fill="#FAD4E0"
              stroke="#CE7A95"
              strokeWidth="1.6"
            />
            <circle
              cx="17"
              cy="2"
              r="19"
              fill="#FAD4E0"
              stroke="#CE7A95"
              strokeWidth="1.6"
            />
            <circle
              cx="0"
              cy="-15"
              r="20"
              fill="#FCE0E9"
              stroke="#CE7A95"
              strokeWidth="1.6"
            />
            <circle
              cx="-11"
              cy="-10"
              r="16"
              fill="#F7BDD0"
              stroke="#CE7A95"
              strokeWidth="1.5"
            />
            <circle
              cx="11"
              cy="-10"
              r="16"
              fill="#F7BDD0"
              stroke="#CE7A95"
              strokeWidth="1.5"
            />
            <circle
              cx="0"
              cy="9"
              r="19"
              fill="#F5ABC2"
              stroke="#CE7A95"
              strokeWidth="1.6"
            />
          </g>
          <g className={centerClassName} style={centerStyle}>
            <circle
              cx="0"
              cy="-1"
              r="14"
              fill="#FDE8EF"
              stroke="#CE7A95"
              strokeWidth="1.5"
            />
            <circle cx="0" cy="-1" r="6.5" fill="#F8D97E" />
            <path
              d="M -9 2 Q 0 -7 9 2"
              fill="none"
              stroke="#F49CB8"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>
      );

    case "lavender": {
      const tiers = [-42, -31, -20, -9, 2, 13];
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            {tiers.map((y, idx) => (
              <g key={y}>
                <ellipse
                  cx="-7"
                  cy={y}
                  rx="6.2"
                  ry="4.2"
                  transform={`rotate(-28 -7 ${y})`}
                  fill={idx % 2 === 0 ? "#C3AEE8" : "#B095DF"}
                  stroke="#8568BA"
                  strokeWidth="1.3"
                />
                <ellipse
                  cx="7"
                  cy={y + 2}
                  rx="6.2"
                  ry="4.2"
                  transform={`rotate(28 7 ${y + 2})`}
                  fill={idx % 2 === 0 ? "#B095DF" : "#D2C2F0"}
                  stroke="#8568BA"
                  strokeWidth="1.3"
                />
              </g>
            ))}
          </g>
          <g className={centerClassName} style={centerStyle}>
            {tiers.map((y) => (
              <ellipse
                key={y}
                cx="0"
                cy={y - 3}
                rx="4.8"
                ry="5.8"
                fill="#D6C7F2"
                stroke="#8568BA"
                strokeWidth="1.3"
              />
            ))}
          </g>
        </g>
      );
    }

    case "babys_breath": {
      const outerBuds = [
        { x: -24, y: -18, r: 6.5 },
        { x: -12, y: -32, r: 6 },
        { x: 4, y: -36, r: 6.8 },
        { x: 20, y: -26, r: 6.2 },
        { x: 26, y: -10, r: 5.8 },
        { x: -18, y: 0, r: 5.8 },
      ];
      const innerBuds = [
        { x: 0, y: -16, r: 6.5 },
        { x: 14, y: -6, r: 6 },
        { x: -4, y: 4, r: 5.5 },
      ];
      const renderBud = (b: { x: number; y: number; r: number }, key: string) => (
        <g key={key} transform={`translate(${b.x}, ${b.y})`}>
          <circle
            cx="-2.5"
            cy="-2"
            r={b.r * 0.62}
            fill="#FFFFFF"
            stroke="#D8D2C9"
            strokeWidth="1.1"
          />
          <circle
            cx="2.5"
            cy="-2"
            r={b.r * 0.62}
            fill="#FFFFFF"
            stroke="#D8D2C9"
            strokeWidth="1.1"
          />
          <circle
            cx="0"
            cy="2.2"
            r={b.r * 0.62}
            fill="#FFFDF8"
            stroke="#D8D2C9"
            strokeWidth="1.1"
          />
          <circle cx="0" cy="-0.5" r="1.8" fill="#F6DF8E" />
        </g>
      );
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            {outerBuds.map((b, i) => renderBud(b, `ob-${i}`))}
          </g>
          <g className={centerClassName} style={centerStyle}>
            {innerBuds.map((b, i) => renderBud(b, `ib-${i}`))}
          </g>
        </g>
      );
    }

    case "hydrangea": {
      const outerFlorets = [
        { x: -16, y: -14, fill: "#C5D8F6" },
        { x: 4, y: -18, fill: "#D4E3FA" },
        { x: 18, y: -6, fill: "#B8CEF2" },
        { x: -18, y: 6, fill: "#D4E3FA" },
        { x: 2, y: 12, fill: "#C5D8F6" },
      ];
      const renderFloret = (f: { x: number; y: number; fill: string }, key: string) => (
        <g key={key} transform={`translate(${f.x}, ${f.y})`}>
          <circle
            cx="-7"
            cy="0"
            r="7.5"
            fill={f.fill}
            stroke="#7E9FD4"
            strokeWidth="1.3"
          />
          <circle
            cx="7"
            cy="0"
            r="7.5"
            fill={f.fill}
            stroke="#7E9FD4"
            strokeWidth="1.3"
          />
          <circle
            cx="0"
            cy="-7"
            r="7.5"
            fill={f.fill}
            stroke="#7E9FD4"
            strokeWidth="1.3"
          />
          <circle
            cx="0"
            cy="7"
            r="7.5"
            fill={f.fill}
            stroke="#7E9FD4"
            strokeWidth="1.3"
          />
          <circle cx="0" cy="0" r="2.4" fill="#FFF6C9" />
        </g>
      );
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            {outerFlorets.map((f, idx) => renderFloret(f, `hf-${idx}`))}
          </g>
          <g className={centerClassName} style={centerStyle}>
            {renderFloret({ x: 0, y: -2, fill: "#E1ECFC" }, "hf-center")}
          </g>
        </g>
      );
    }

    case "ranunculus":
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            <circle
              cx="0"
              cy="0"
              r="26"
              fill="#FCD8C2"
              stroke="#D18862"
              strokeWidth="1.7"
            />
            <circle
              cx="-2"
              cy="-1"
              r="21"
              fill="#FAC5A6"
              stroke="#D18862"
              strokeWidth="1.6"
            />
            <circle
              cx="2"
              cy="1"
              r="16"
              fill="#F8B38E"
              stroke="#C77952"
              strokeWidth="1.6"
            />
          </g>
          <g className={centerClassName} style={centerStyle}>
            <circle
              cx="0"
              cy="0"
              r="11"
              fill="#FAD0B6"
              stroke="#C77952"
              strokeWidth="1.5"
            />
            <circle
              cx="0"
              cy="0"
              r="5.5"
              fill="#DCE8B8"
              stroke="#8FA868"
              strokeWidth="1.4"
            />
          </g>
        </g>
      );

    case "chamomile": {
      const heads = [
        { x: -16, y: -16, s: 0.85 },
        { x: 15, y: -20, s: 0.9 },
        { x: 2, y: 4, s: 1.0 },
      ];
      const angles = [0, 45, 90, 135, 180, 225, 270, 315];
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            {heads.map((h, idx) => (
              <g key={`p-${idx}`} transform={`translate(${h.x}, ${h.y}) scale(${h.s})`}>
                {angles.map((deg) => (
                  <ellipse
                    key={deg}
                    cx="0"
                    cy="-12"
                    rx="4.4"
                    ry="8.5"
                    transform={`rotate(${deg})`}
                    fill="#FFFDF8"
                    stroke="#D8CFC4"
                    strokeWidth="1.2"
                  />
                ))}
              </g>
            ))}
          </g>
          <g className={centerClassName} style={centerStyle}>
            {heads.map((h, idx) => (
              <g key={`c-${idx}`} transform={`translate(${h.x}, ${h.y}) scale(${h.s})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="7.5"
                  fill="#F7D35C"
                  stroke="#C99D2B"
                  strokeWidth="1.4"
                />
              </g>
            ))}
          </g>
        </g>
      );
    }

    case "orchid":
      return (
        <g>
          <g className={petalsClassName} style={petalsStyle}>
            <ellipse
              cx="0"
              cy="-20"
              rx="13"
              ry="18"
              fill="#ECD4F4"
              stroke="#A876BA"
              strokeWidth="1.6"
            />
            <ellipse
              cx="-13"
              cy="12"
              rx="10"
              ry="16"
              transform="rotate(28 -13 12)"
              fill="#E5C6F0"
              stroke="#A876BA"
              strokeWidth="1.6"
            />
            <ellipse
              cx="13"
              cy="12"
              rx="10"
              ry="16"
              transform="rotate(-28 13 12)"
              fill="#E5C6F0"
              stroke="#A876BA"
              strokeWidth="1.6"
            />
            <ellipse
              cx="-20"
              cy="-4"
              rx="18"
              ry="15"
              transform="rotate(-12 -20 -4)"
              fill="#F4E3FA"
              stroke="#A876BA"
              strokeWidth="1.7"
            />
            <ellipse
              cx="20"
              cy="-4"
              rx="18"
              ry="15"
              transform="rotate(12 20 -4)"
              fill="#F4E3FA"
              stroke="#A876BA"
              strokeWidth="1.7"
            />
          </g>
          <g className={centerClassName} style={centerStyle}>
            <path
              d="M 0 -4 C -11 -2, -12 14, 0 18 C 12 14, 11 -2, 0 -4 Z"
              fill="#D474A8"
              stroke="#9B4675"
              strokeWidth="1.6"
            />
            <circle cx="0" cy="2" r="4.2" fill="#FBE38E" />
          </g>
        </g>
      );

    default:
      return null;
  }
}

/**
 * Combined single-element illustration (stem + flower head) used by palette
 * thumbnails and static decorative previews.
 */
export function BouquetElementGraphic({
  type,
}: {
  type: BouquetElementType;
}): React.ReactElement {
  return (
    <g>
      <BouquetStemGraphic type={type} />
      <BouquetFlowerHeadGraphic type={type} />
    </g>
  );
}

/**
 * SVG pattern definitions used by wrapping paper styles.
 */
export function WrappingPaperDefs({
  paper,
  idPrefix,
}: {
  paper: PaperType;
  idPrefix: string;
}): React.ReactElement {
  const meta = getPaperMeta(paper);

  return (
    <defs>
      <filter id={`${idPrefix}-soft-shadow`} x="-12%" y="-12%" width="124%" height="124%">
        <feDropShadow
          dx="0"
          dy="8"
          stdDeviation="10"
          floodColor="#6B4A4A"
          floodOpacity="0.12"
        />
      </filter>

      {meta.pattern === "dots" && (
        <pattern
          id={`${idPrefix}-paper-pattern`}
          width="22"
          height="22"
          patternUnits="userSpaceOnUse"
        >
          <rect width="22" height="22" fill={meta.frontFill} />
          <circle cx="6" cy="6" r="2" fill="#FFFFFF" fillOpacity="0.65" />
          <circle cx="17" cy="17" r="2" fill="#FFFFFF" fillOpacity="0.65" />
        </pattern>
      )}

      {meta.pattern === "linen" && (
        <pattern
          id={`${idPrefix}-paper-pattern`}
          width="16"
          height="16"
          patternUnits="userSpaceOnUse"
        >
          <rect width="16" height="16" fill={meta.frontFill} />
          <line
            x1="0"
            y1="8"
            x2="16"
            y2="8"
            stroke={meta.stroke}
            strokeOpacity="0.28"
            strokeWidth="1"
          />
          <line
            x1="8"
            y1="0"
            x2="8"
            y2="16"
            stroke={meta.stroke}
            strokeOpacity="0.22"
            strokeWidth="1"
          />
        </pattern>
      )}

      {meta.pattern === "stripes" && (
        <pattern
          id={`${idPrefix}-paper-pattern`}
          width="18"
          height="18"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(25)"
        >
          <rect width="18" height="18" fill={meta.frontFill} />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="18"
            stroke="#FFFFFF"
            strokeOpacity="0.55"
            strokeWidth="5"
          />
        </pattern>
      )}

      {meta.pattern === "gingham" && (
        <pattern
          id={`${idPrefix}-paper-pattern`}
          width="24"
          height="24"
          patternUnits="userSpaceOnUse"
        >
          <rect width="24" height="24" fill={meta.frontFill} />
          <rect width="12" height="24" fill="#FFFFFF" fillOpacity="0.35" />
          <rect width="24" height="12" fill="#FFFFFF" fillOpacity="0.35" />
        </pattern>
      )}

      {meta.pattern === "plain" && (
        <pattern
          id={`${idPrefix}-paper-pattern`}
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <rect width="10" height="10" fill={meta.frontFill} />
        </pattern>
      )}
    </defs>
  );
}

/**
 * Back sheet & inner tissue collar of the bouquet wrapping paper (rendered BEHIND flowers).
 */
export function WrappingPaperBack({
  paper,
  idPrefix,
}: {
  paper: PaperType;
  idPrefix: string;
}): React.ReactElement {
  const meta = getPaperMeta(paper);

  return (
    <g filter={`url(#${idPrefix}-soft-shadow)`}>
      {/* Wide back paper cone */}
      <path
        d="M 300 500 L 78 212 Q 124 128 214 148 Q 300 96 386 148 Q 476 128 522 212 Z"
        fill={meta.backFill}
        stroke={meta.stroke}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Crisp white/pastel inner tissue paper pleat behind blooms */}
      <path
        d="M 300 475 L 116 226 Q 176 168 242 184 Q 300 142 358 184 Q 424 168 484 226 Z"
        fill={meta.innerFoldFill}
        stroke={meta.stroke}
        strokeOpacity="0.55"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Front overlapping wrapping paper flaps & lower skirt (rendered IN FRONT OF flower stems).
 */
export function WrappingPaperFront({
  paper,
  idPrefix,
}: {
  paper: PaperType;
  idPrefix: string;
}): React.ReactElement {
  const meta = getPaperMeta(paper);
  const patternUrl = `url(#${idPrefix}-paper-pattern)`;

  return (
    <g>
      {/* Lower flared skirt below ribbon waist */}
      <path
        d="M 264 492 L 214 622 Q 300 646 386 622 L 336 492 Z"
        fill={patternUrl}
        stroke={meta.stroke}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Left front diagonal wrap flap */}
      <path
        d="M 102 252 L 318 492 L 264 496 L 198 588 L 154 446 Z"
        fill={patternUrl}
        stroke={meta.stroke}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Right front overlapping diagonal wrap flap */}
      <path
        d="M 498 252 L 282 492 L 338 496 L 402 588 L 446 446 Z"
        fill={patternUrl}
        stroke={meta.stroke}
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Left & Right folded inner lapels */}
      <path
        d="M 102 252 L 222 365 L 178 392 Z"
        fill={meta.innerFoldFill}
        stroke={meta.stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M 498 252 L 378 365 L 422 392 Z"
        fill={meta.innerFoldFill}
        stroke={meta.stroke}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </g>
  );
}

/**
 * Bow geometry centered at local origin (0, 0) so animations can scale from the knot.
 */
export function BouquetRibbonBowShapes({
  ribbon,
}: {
  ribbon: RibbonType;
}): React.ReactElement {
  const meta = getRibbonMeta(ribbon);

  return (
    <g>
      {/* Trailing ribbon tails */}
      <path
        d="M -8 6 Q -32 54 -48 94 L -24 88 L -14 104 Q -4 58 0 10 Z"
        fill={meta.primary}
        stroke={meta.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M 8 6 Q 32 54 48 94 L 24 88 L 14 104 Q 4 58 0 10 Z"
        fill={meta.primary}
        stroke={meta.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Waist band */}
      <rect
        x="-44"
        y="-10"
        width="88"
        height="20"
        rx="8"
        fill={meta.primary}
        stroke={meta.stroke}
        strokeWidth="2"
      />
      {/* Left bow loop */}
      <path
        d="M -6 -2 C -46 -36, -74 -2, -52 18 C -36 30, -14 12, -4 4 Z"
        fill={meta.secondary}
        stroke={meta.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Right bow loop */}
      <path
        d="M 6 -2 C 46 -36, 74 -2, 52 18 C 36 30, 14 12, 4 4 Z"
        fill={meta.secondary}
        stroke={meta.stroke}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Center bow creases */}
      <path
        d="M -16 -2 Q -34 -6 -44 4"
        fill="none"
        stroke={meta.stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M 16 -2 Q 34 -6 44 4"
        fill="none"
        stroke={meta.stroke}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Center knot */}
      <rect
        x="-12"
        y="-12"
        width="24"
        height="24"
        rx="8"
        fill={meta.primary}
        stroke={meta.stroke}
        strokeWidth="2"
      />
    </g>
  );
}

/**
 * Decorative bow tied at the bouquet waist (x=300, y=492).
 */
export function BouquetRibbonBow({ ribbon }: { ribbon: RibbonType }): React.ReactElement {
  return (
    <g transform="translate(300, 492)">
      <BouquetRibbonBowShapes ribbon={ribbon} />
    </g>
  );
}
