import type { CSSProperties } from "react";

// The decorative book shelf from the original hero. Pure markup + CSS animation.
const SPINES: [number, number, string, string, boolean?, boolean?][] = [
  [32, 120, "#2B3A8C", "Calculus"], [42, 154, "#D9A441", "Physics"], [26, 124, "#A63A4E", "Ədəbiyyat"],
  [44, 182, "#17706E", "Algorithms"], [32, 136, "#16215B", "Mechanics"], [34, 204, "#6B4FA3", "English", true],
  [34, 114, "#3A4BA8", "Circuits"], [44, 200, "#E9B857", "Bookal", false, true], [38, 146, "#D9A441", "Chemistry"],
  [28, 190, "#A63A4E", "Materials"], [38, 164, "#2B3A8C", "Statistics"], [30, 176, "#17706E", "Thermo"],
  [34, 130, "#6B4FA3", "Design"], [32, 226, "#3A4BA8", "Networks"], [38, 140, "#D9A441", "Robotics"],
  [32, 120, "#2B3A8C", "Calculus"], [36, 168, "#D9A441", "Physics"], [30, 124, "#A63A4E", "Ədəbiyyat"],
  [40, 182, "#17706E", "Algorithms"], [32, 172, "#16215B", "Mechanics"], [40, 192, "#6B4FA3", "English"],
  [34, 150, "#3A4BA8", "Circuits", true], [46, 224, "#101848", "Bookal"], [34, 160, "#D9A441", "Chemistry"],
  [30, 176, "#A63A4E", "Materials"], [42, 164, "#2B3A8C", "Statistics"], [34, 198, "#17706E", "Thermo"],
  [38, 116, "#6B4FA3", "Design"], [28, 226, "#3A4BA8", "Networks"], [38, 164, "#D9A441", "Robotics"],
];

export function Shelf() {
  return (
    <div className="shelf" aria-hidden="true">
      {SPINES.map(([w, h, c, label, lean, out], i) => (
        <i
          key={i}
          className={`sp${lean ? " lean" : ""}${out ? " out" : ""}`}
          style={{ "--w": `${w}px`, "--h": `${h}px`, "--c": c, "--i": i } as CSSProperties}
        >
          <b>{label}</b>
        </i>
      ))}
    </div>
  );
}
