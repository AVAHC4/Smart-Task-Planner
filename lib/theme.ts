"use client"

type ThemeVars = {
  "--primary": string
  "--secondary": string
  "--accent": string
  "--background": string
  "--foreground": string
  "--shadow-color"?: string
}

const THEME_KEY = "ai-planner:theme"

export function applyTheme(vars: Partial<ThemeVars>) {
  if (typeof document === "undefined") return
  const root = document.documentElement
  for (const [k, v] of Object.entries(vars)) {
    if (!v) continue
    root.style.setProperty(k, v)
  }
  // Ensure readable contrast for text vs background if customized
  const bg = getVar("--background") || "#fffbe6"
  const fg = getVar("--foreground") || bestForeground(bg)
  if (vars["--background"] && !vars["--foreground"]) {
    root.style.setProperty("--foreground", bestForeground(bg))
  } else if (!vars["--foreground"]) {
    root.style.setProperty("--foreground", fg)
  }
}

export function persistTheme(vars: Partial<ThemeVars>) {
  if (typeof window === "undefined") return
  const saved = getSavedTheme()
  const merged = { ...saved, ...vars }
  window.localStorage.setItem(THEME_KEY, JSON.stringify(merged))
}

export function getSavedTheme(): Partial<ThemeVars> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(THEME_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

export function loadAndApplyTheme() {
  const saved = getSavedTheme()
  applyTheme(saved)
}

export function getVar(name: string): string | null {
  if (typeof window === "undefined") return null
  const v = getComputedStyle(document.documentElement).getPropertyValue(name)
  return v?.trim() || null
}

// Simple luminance-based foreground chooser
export function bestForeground(bgHex: string): string {
  const { r, g, b } = hexToRgb(bgHex)
  const L = 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b)
  return L > 0.5 ? "#111111" : "#ffffff"
}

function srgb(c: number) {
  c /= 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "")
  const bigint = Number.parseInt(
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h,
    16,
  )
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
}
