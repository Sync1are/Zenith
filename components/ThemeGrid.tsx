// src/components/ThemeGrid.tsx
import React, { useCallback, useMemo, useRef } from "react";
import { useSettingsStore } from "../store/useSettingsStore";

/**
 * Minimal Squares Theme Picker (Option A)
 *
 * - Hover previews theme (temporarily sets document.documentElement.dataset.theme)
 * - Click sets theme via useSettingsStore.setTheme
 * - Does not change layout or app structure
 */

/* Theme metadata + color map (keeps in sync with your global CSS) */
const THEMES: Array<{ key: string; label: string }> = [
  { key: "system", label: "System" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
  { key: "midnight", label: "Midnight" },
  { key: "contrast", label: "Contrast" },

  /* Pack A */
  { key: "lunar", label: "Lunar" },
  { key: "nebula", label: "Nebula" },
  { key: "graphite", label: "Graphite" },
  { key: "pearl", label: "Pearl" },
  { key: "obsidian", label: "Obsidian" },

  /* Pack B */
  { key: "cyber-azure", label: "Cyber Azure" },
  { key: "hex-red", label: "Hex Red" },
  { key: "toxic-lime", label: "Toxic Lime" },
  { key: "solar-flare", label: "Solar Flare" },
  { key: "cyber-purple", label: "Cyber Purple" },

  /* Pack C */
  { key: "pastel-blue", label: "Pastel Blue" },
  { key: "pastel-rose", label: "Pastel Rose" },
  { key: "mint-frost", label: "Mint Frost" },
  { key: "sandstone", label: "Sandstone" },
  { key: "lavender", label: "Lavender" },

  /* Pack D */
  { key: "shadow", label: "Shadow" },
  { key: "nightfall", label: "Nightfall" },
  { key: "chrome-dark", label: "Chrome Dark" },
  { key: "royal-midnight", label: "Royal Midnight" },
  { key: "obsidian-dark", label: "Obsidian Dark" },

  /* Pack E */
  { key: "gold-noir", label: "Gold Noir" },
  { key: "ivory-gold", label: "Ivory Gold" },
  { key: "monarch", label: "Monarch" },
  { key: "amber-stone", label: "Amber Stone" },

  /* Ultra Pack */
  { key: "cyberpunk", label: "Cyberpunk" },
  { key: "sunset", label: "Sunset" },
  { key: "oceanic", label: "Oceanic" },
  { key: "forest", label: "Forest" },
  { key: "royal", label: "Royal" },
];

/**
 * colorMap is used for preview tiles so they show accurate colors without changing the active theme.
 * Keep this in sync with your global CSS (the values provided here match the theme CSS previously added).
 *
 * Each entry: { bg, card, text, accent, subtle, border }
 */
const colorMap: Record<
  string,
  { bg: string; card: string; text: string; accent: string; subtle: string; border: string; gradient?: string }
> = {
  system: { bg: "var(--bg)", card: "var(--card)", text: "var(--text)", accent: "var(--accent)", subtle: "var(--subtle)", border: "var(--border)" },

  light: { bg: "#e9eaed", card: "#f3f4f6", text: "#1b1c20", accent: "#4f67ff", subtle: "#555", border: "#c7c7c7" },
  dark: { bg: "#111215", card: "#17181c", text: "#e2e2e2", accent: "#6366f1", subtle: "#7f7f7f", border: "#292a2e" },
  midnight: { bg: "#08080a", card: "#111114", text: "#d4d4d4", accent: "#7c3aed", subtle: "#6a6a6a", border: "#1d1d20" },
  contrast: { bg: "#0b0b0c", card: "#161616", text: "#ffffff", accent: "#ffcc00", subtle: "#bababa", border: "#2a2a2a" },

  /* Pack A */
  lunar: { bg: "#1b1c1f", card: "#222327", text: "#e8e8e8", accent: "#73b3ff", subtle: "#9a9a9a", border: "#2e2f33" },
  nebula: { bg: "#131220", card: "#1a182b", text: "#dcd2ff", accent: "#a970ff", subtle: "#9283c6", border: "#2d2a49" },
  graphite: { bg: "#18191b", card: "#202123", text: "#e3e3e3", accent: "#8ba3c7", subtle: "#777", border: "#2a2b2d" },
  pearl: { bg: "#f1f2f4", card: "#ffffff", text: "#1e1f22", accent: "#6c84ff", subtle: "#555", border: "#d8d8d8" },
  obsidian: { bg: "#000000", card: "#0b0b0b", text: "#eaeaea", accent: "#00d0ff", subtle: "#848484", border: "#111111" },

  /* Pack B */
  "cyber-azure": { bg: "#060b14", card: "#0c121e", text: "#d8f6ff", accent: "#19c3ff", subtle: "#75b5cc", border: "#1a2738" },
  "hex-red": { bg: "#0a0202", card: "#130404", text: "#ffdada", accent: "#ff3b3b", subtle: "#d06f6f", border: "#2c0c0c" },
  "toxic-lime": { bg: "#0b1208", card: "#121c0f", text: "#e9ffe4", accent: "#88ff00", subtle: "#74a766", border: "#1d2d14" },
  "solar-flare": { bg: "#0f0903", card: "#1a1209", text: "#ffe7c0", accent: "#ffa133", subtle: "#d29c66", border: "#2c1e11" },
  "cyber-purple": { bg: "#0d0712", card: "#1a0f24", text: "#f6d9ff", accent: "#d451ff", subtle: "#b58bcc", border: "#2a1b3d" },

  /* Pack C */
  "pastel-blue": { bg: "#eef5ff", card: "#ffffff", text: "#1c2330", accent: "#6f9dff", subtle: "#7f8ba3", border: "#d8e3ff" },
  "pastel-rose": { bg: "#f8eef1", card: "#ffffff", text: "#2e1e23", accent: "#ff7ca3", subtle: "#a2747f", border: "#e8d9dd" },
  "mint-frost": { bg: "#e8fff2", card: "#ffffff", text: "#1d2b22", accent: "#6affb3", subtle: "#6f9180", border: "#d2eedc" },
  sandstone: { bg: "#f2eee8", card: "#ffffff", text: "#2f2b26", accent: "#d7a064", subtle: "#8c7f73", border: "#e4ddd4" },
  lavender: { bg: "#f3f0fa", card: "#ffffff", text: "#241f2c", accent: "#b18cff", subtle: "#91849e", border: "#ded8ef" },

  /* Pack D */
  shadow: { bg: "#0d0d0e", card: "#151516", text: "#d8d8d8", accent: "#4f6cff", subtle: "#757575", border: "#222222" },
  nightfall: { bg: "#0b0b0c", card: "#141415", text: "#cfe7e9", accent: "#47d6cc", subtle: "#6fa7a2", border: "#1f1f20" },
  "chrome-dark": { bg: "#111213", card: "#18191b", text: "#dcdcdc", accent: "#b5c7d9", subtle: "#9ca6ad", border: "#242628" },
  "royal-midnight": { bg: "#070a14", card: "#0f1523", text: "#e8e6f4", accent: "#e3b341", subtle: "#a99a6a", border: "#1c2539" },
  "obsidian-dark": { bg: "#000000", card: "#0b0b0b", text: "#ededed", accent: "#a855f7", subtle: "#8f8f8f", border: "#1b1b1b" },

  /* Pack E */
  "gold-noir": { bg: "#0c0c0c", card: "#151515", text: "#f6f6f6", accent: "#ffd700", subtle: "#c1a96f", border: "#262626" },
  "ivory-gold": { bg: "#f7f5ef", card: "#ffffff", text: "#1d1b18", accent: "#e1b450", subtle: "#947d59", border: "#dfd9ce" },
  monarch: { bg: "#0a0a0a", card: "#141414", text: "#fdf6d1", accent: "#ffcc33", subtle: "#c9b36f", border: "#242424" },
  "amber-stone": { bg: "#1d1813", card: "#261f18", text: "#ffe7cc", accent: "#ffb55a", subtle: "#c79a72", border: "#3a2f26" },

  /* Ultra Pack */
  cyberpunk: { bg: "#050505", card: "rgba(10, 10, 15, 0.6)", text: "#e0f7ff", accent: "#ff0055", subtle: "#00b8ff", border: "rgba(0, 255, 157, 0.2)", gradient: "linear-gradient(135deg, #0b0014 0%, #000614 100%)" },
  sunset: { bg: "#1a0b0b", card: "rgba(40, 20, 20, 0.4)", text: "#ffecd1", accent: "#ff6b6b", subtle: "#ffb8b8", border: "rgba(255, 107, 107, 0.2)", gradient: "linear-gradient(to bottom right, #2b0f0f, #1a0b14)" },
  oceanic: { bg: "#001219", card: "rgba(0, 40, 50, 0.4)", text: "#e0fbfc", accent: "#00d4ff", subtle: "#98c1d9", border: "rgba(0, 212, 255, 0.15)", gradient: "radial-gradient(circle at top right, #002b36, #001219)" },
  forest: { bg: "#051405", card: "rgba(10, 30, 10, 0.4)", text: "#e8f5e9", accent: "#4ade80", subtle: "#86efac", border: "rgba(74, 222, 128, 0.2)", gradient: "linear-gradient(180deg, #0a1f0a 0%, #020a02 100%)" },
  royal: { bg: "#1a0b2e", card: "rgba(45, 27, 78, 0.5)", text: "#f3e8ff", accent: "#d8b4fe", subtle: "#c084fc", border: "rgba(216, 180, 254, 0.2)", gradient: "radial-gradient(circle at center, #2d1b4e, #1a0b2e)" },
};

export default function ThemeGrid() {
  const currentTheme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);

  // store the theme that was active before preview so we can restore
  const previewBackup = useRef<string | null>(null);

  // compute list (we keep the order in THEMES)
  const list = useMemo(() => THEMES, []);

  const applyPreview = useCallback((themeKey: string | undefined) => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    // backup current theme if not backed up
    if (previewBackup.current === null) previewBackup.current = root.dataset.theme ?? "";

    // special-case: preview 'system' by applying computed preference
    if (themeKey === "system") {
      const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
      root.dataset.theme = prefersDark ? "dark" : "light";
      return;
    }

    // set dataset to themeKey
    root.dataset.theme = themeKey ?? previewBackup.current ?? "";
  }, []);

  const clearPreview = useCallback(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    // restore backup
    if (previewBackup.current !== null) {
      root.dataset.theme = previewBackup.current;
      previewBackup.current = null;
    }
  }, []);

  const onTileClick = useCallback(
    (key: string) => {
      setTheme(key as any);
      // ensure preview backup is cleared (we made theme persistent)
      previewBackup.current = null;
    },
    [setTheme]
  );

  return (
    <div>
      <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10">
        {list.map((t) => {
          const map = colorMap[t.key] ?? colorMap["dark"];
          const isActive = currentTheme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => onTileClick(t.key)}
              onMouseEnter={() => applyPreview(t.key)}
              onFocus={() => applyPreview(t.key)}
              onMouseLeave={() => clearPreview()}
              onBlur={() => clearPreview()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onTileClick(t.key);
                }
              }}
              className={[
                "flex cursor-pointer flex-col items-stretch gap-2 rounded-md border p-2 text-left transition-all",
                isActive ? "ring-2 ring-offset-1 ring-[var(--accent)] border-[var(--accent)]" : "border-[rgba(255,255,255,0.04)]",
              ].join(" ")}
              style={{
                background: "transparent",
                // keep the tile subtle but visible on the active theme
              }}
            >
              {/* color stripes */}
              <div className="flex h-10 w-full overflow-hidden rounded-sm relative">
                {map.gradient ? (
                  <div className="absolute inset-0" style={{ background: map.gradient }} />
                ) : (
                  <div style={{ width: "50%", background: map.bg }} />
                )}
                {!map.gradient && <div style={{ width: "30%", background: map.card }} />}
                <div className="relative z-10" style={{ width: map.gradient ? "100%" : "20%", background: map.gradient ? "transparent" : map.accent }} />
              </div>

              {/* name */}
              <div className="flex items-center justify-between">
                <div className="truncate text-sm font-medium" style={{ color: map.text }}>
                  {t.label}
                </div>
                {/* small current marker */}
                {isActive ? (
                  <div
                    className="ml-2 h-3 w-3 shrink-0 rounded-full"
                    style={{ background: "var(--accent)" }}
                    aria-hidden
                  />
                ) : null}
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-sm text-[var(--subtle)]">
        Hover to preview — click to apply. Use keyboard (Tab + Enter) to select.
      </p>
    </div>
  );
}
