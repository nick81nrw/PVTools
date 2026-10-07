import { Chart } from 'chart.js'

export const ENERGY_COLORS = {
  pv: '#f5a524',
  battery: '#3ccf62',
  grid: '#ef5b5b',
  feedin: '#3a9fe0',
  loss: '#8a94a6',
}

/** colors of the current theme, read from the CSS variables */
export function themeColors() {
  const style = getComputedStyle(document.documentElement)
  const v = (name) => style.getPropertyValue(name).trim()
  return {
    ink: v('--ink'),
    muted: v('--muted'),
    line: v('--line'),
    surface: v('--surface'),
    brand: v('--brand'),
    accent: v('--accent'),
  }
}

/** shared Chart.js options matching the app design */
export function baseOptions(colors) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 300 },
    font: { family: "'JetBrains Mono Variable', monospace" },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: colors.muted,
          boxWidth: 10,
          boxHeight: 10,
          useBorderRadius: true,
          borderRadius: 2,
          font: { family: "'Inter Variable', sans-serif", size: 12 },
        },
      },
      tooltip: {
        backgroundColor: colors.surface,
        titleColor: colors.ink,
        bodyColor: colors.ink,
        borderColor: colors.line,
        borderWidth: 1,
        padding: 10,
        titleFont: { family: "'JetBrains Mono Variable', monospace" },
        bodyFont: { family: "'JetBrains Mono Variable', monospace" },
      },
    },
  }
}

export const axis = (colors, extra = {}) => ({
  grid: { color: colors.line, drawTicks: false },
  border: { display: false },
  ticks: {
    color: colors.muted,
    padding: 6,
    font: { family: "'JetBrains Mono Variable', monospace", size: 11 },
  },
  ...extra,
})

Chart.defaults.font.family = "'Inter Variable', sans-serif"
