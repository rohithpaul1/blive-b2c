import { useState } from "react";
import { franchiseHome } from "../config/franchiseHome";
import { applyTheme } from "../config/theme";

// Demo-only accent picker: shown with ?swatches=1 (kept for the session) on a
// franchise that has accentOptions. Picks live-repaint the whole site.
const readSession = (key) => {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeSession = (key, value) => {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
};

export const savedAccent = () => readSession(`accent:${franchiseHome.slug}`);

const AccentSwatches = () => {
  const options = franchiseHome.accentOptions ?? [];
  const params = new URLSearchParams(window.location.search);
  if (params.get("swatches") === "1") writeSession("swatches", "1");
  const visible = readSession("swatches") === "1" && options.length > 1;
  const [current, setCurrent] = useState(savedAccent() ?? franchiseHome.accent);
  if (!visible) return null;

  const pick = (hex) => {
    setCurrent(hex);
    writeSession(`accent:${franchiseHome.slug}`, hex);
    applyTheme(franchiseHome, hex);
  };

  return (
    <div className="fixed bottom-[88px] right-4 z-[1000] rounded-[14px] bg-white p-3 shadow-[0_8px_30px_rgba(0,0,0,0.18)] md:bottom-6">
      <p className="m-0 mb-2 text-[12px] font-semibold text-[#5a5562]">Accent (demo)</p>
      <div className="flex gap-2">
        {options.map((o) => (
          <button
            key={o.hex}
            type="button"
            title={`${o.name} ${o.hex}`}
            aria-label={o.name}
            aria-pressed={current === o.hex}
            onClick={() => pick(o.hex)}
            className={`size-9 cursor-pointer rounded-full border-2 ${current === o.hex ? "border-[#1c1a22]" : "border-transparent"}`}
            style={{ background: o.hex }}
          />
        ))}
      </div>
      <p className="m-0 mt-2 text-[11px] text-[#716c75]">
        {options.find((o) => o.hex === current)?.name ?? current}
      </p>
    </div>
  );
};

export default AccentSwatches;
