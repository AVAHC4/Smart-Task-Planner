"use client"

import { useEffect, useMemo, useState } from "react"
import { applyTheme, persistTheme, loadAndApplyTheme } from "../lib/theme"
import { Button } from "@/components/ui/button"

type Preset = {
  name: string
  vars: {
    "--primary": string
    "--secondary": string
    "--accent": string
    "--background": string
    "--foreground": string
    "--shadow-color": string
  }
}

const PRESETS: Preset[] = [
  {
    name: "Primary (Default)",
    vars: {
      "--primary": "#ff3b30",
      "--secondary": "#ffcc00",
      "--accent": "#0057ff",
      "--background": "#fffbe6",
      "--foreground": "#111111",
      "--shadow-color": "#111111",
    },
  },
  {
    name: "Teal / Amber / Ink",
    vars: {
      "--primary": "#14b8a6",
      "--secondary": "#f59e0b",
      "--accent": "#0f172a",
      "--background": "#f7fee7",
      "--foreground": "#111111",
      "--shadow-color": "#0f172a",
    },
  },
  {
    name: "Indigo / Lime / Charcoal",
    vars: {
      "--primary": "#4f46e5",
      "--secondary": "#84cc16",
      "--accent": "#1f2937",
      "--background": "#f8fafc",
      "--foreground": "#111111",
      "--shadow-color": "#1f2937",
    },
  },
]

export default function ThemeCustomizer() {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(PRESETS[0].vars)
  const [flatShadow, setFlatShadow] = useState(false)

  useEffect(() => {
    loadAndApplyTheme()
  }, [])

  const containerClass = useMemo(
    () => "fixed right-4 top-20 z-50 w-80 border-4 rounded-lg p-4 neo-card " + (open ? "block" : "hidden"),
    [open],
  )

  return (
    <>
      <Button variant="default" className="neo-btn" onClick={() => setOpen(!open)} aria-expanded={open}>
        Theme
      </Button>

      <div className={containerClass} role="dialog" aria-label="Theme Customizer">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Theme Customizer</h3>
          <button className="neo-btn px-2" onClick={() => setOpen(false)} aria-label="Close">
            Close
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm mb-2">Presets</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.name}
                  className="neo-btn"
                  onClick={() => {
                    setCustom(p.vars)
                    applyTheme(p.vars)
                    persistTheme(p.vars)
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {Object.entries(custom).map(([k, v]) => (
              <label key={k} className="flex flex-col text-xs gap-1">
                <span>{k}</span>
                <input
                  type="color"
                  value={v}
                  onChange={(e) => {
                    const nv = { ...custom, [k]: e.target.value }
                    setCustom(nv)
                    applyTheme({ [k]: e.target.value })
                    persistTheme({ [k]: e.target.value })
                  }}
                />
              </label>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              id="flatShadow"
              type="checkbox"
              checked={flatShadow}
              onChange={(e) => {
                setFlatShadow(e.target.checked)
                const v = e.target.checked ? "0px 0px 0 0 var(--shadow-color)" : "4px 4px 0 0 var(--shadow-color)"
                document.documentElement.style.setProperty("--neo-shadow", v)
              }}
            />
            <label htmlFor="flatShadow" className="text-sm">
              Flat shadow
            </label>
          </div>

          <div className="flex gap-2">
            <button
              className="neo-btn"
              onClick={() => {
                const def = PRESETS[0].vars
                setCustom(def)
                applyTheme(def)
                persistTheme(def)
                document.documentElement.style.setProperty("--neo-shadow", "4px 4px 0 0 var(--shadow-color)")
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
