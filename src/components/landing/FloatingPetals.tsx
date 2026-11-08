import * as React from "react";

const PETALS = [
  {
    left: "6%",
    top: "14%",
    delay: "0s",
    duration: "7.5s",
    size: 22,
    color: "#FAD2DD",
    rot: 18,
  },
  {
    left: "18%",
    top: "68%",
    delay: "1.4s",
    duration: "8.2s",
    size: 18,
    color: "#E3EFE4",
    rot: -25,
  },
  {
    left: "34%",
    top: "10%",
    delay: "2.2s",
    duration: "6.8s",
    size: 16,
    color: "#ECE6F8",
    rot: 40,
  },
  {
    left: "72%",
    top: "16%",
    delay: "0.7s",
    duration: "7.9s",
    size: 20,
    color: "#FCD8C2",
    rot: -15,
  },
  {
    left: "88%",
    top: "36%",
    delay: "1.8s",
    duration: "8.6s",
    size: 24,
    color: "#FAD2DD",
    rot: 32,
  },
  {
    left: "80%",
    top: "74%",
    delay: "2.8s",
    duration: "7.2s",
    size: 17,
    color: "#FCF2D4",
    rot: -35,
  },
] as const;

export function FloatingPetals(): React.ReactElement {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden"
    >
      {PETALS.map((petal, idx) => (
        <div
          key={idx}
          className="absolute animate-float-petal opacity-75"
          style={{
            left: petal.left,
            top: petal.top,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        >
          <svg
            width={petal.size}
            height={petal.size}
            viewBox="0 0 24 24"
            style={{ transform: `rotate(${petal.rot}deg)` }}
          >
            <path
              d="M12 2C7 6 5 13 12 22C19 13 17 6 12 2Z"
              fill={petal.color}
              stroke="#E5B4C2"
              strokeOpacity="0.6"
              strokeWidth="1"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
