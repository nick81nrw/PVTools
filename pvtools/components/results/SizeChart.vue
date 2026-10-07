<template>
  <div class="h-72 sm:h-80">
    <Line
      :key="isDark"
      :data="chartData"
      :options="options"
      aria-label="Kennzahlen je Speichergröße"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js'

import { useTheme } from '../../composables/useTheme.js'
import {
  axis,
  baseOptions,
  ENERGY_COLORS,
  themeColors,
} from '../../lib/chartTheme.js'
import { batteryLabel, num } from '../../lib/format.js'

ChartJS.register(
  CategoryScale,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
)

const props = defineProps({
  sizes: { type: Array, required: true },
  selected: { type: Number, default: null },
})
const emit = defineEmits(['select'])

const { isDark } = useTheme()

const pointStyle = (color) => ({
  pointRadius: props.sizes.map((s) => (s.size === props.selected ? 6 : 3)),
  pointBackgroundColor: props.sizes.map((s) =>
    s.size === props.selected ? color : 'transparent',
  ),
  pointBorderColor: color,
  borderColor: color,
  borderWidth: 2,
  tension: 0.3,
})

const chartData = computed(() => ({
  labels: props.sizes.map((s) => batteryLabel(s.size)),
  datasets: [
    {
      label: 'Autarkiegrad',
      data: props.sizes.map((s) => s.selfSufficiencyRate),
      yAxisID: 'percent',
      ...pointStyle(ENERGY_COLORS.battery),
      fill: { target: 'origin', above: 'rgba(60, 207, 98, 0.08)' },
    },
    {
      label: 'Eigenverbrauchsquote',
      data: props.sizes.map((s) => s.selfUseRate),
      yAxisID: 'percent',
      ...pointStyle(ENERGY_COLORS.pv),
    },
    {
      label: 'Amortisation Anlage',
      data: props.sizes.map((s) =>
        Number.isFinite(s.amortization) && s.amortization > 0
          ? s.amortization
          : null,
      ),
      yAxisID: 'years',
      ...pointStyle(ENERGY_COLORS.grid),
      borderDash: [5, 4],
    },
  ],
}))

const options = computed(() => {
  // depends on the theme, the chart is re-created via :key
  void isDark.value
  const colors = themeColors()
  const base = baseOptions(colors)
  return {
    ...base,
    interaction: { mode: 'index', intersect: false },
    onClick: (_event, elements) => {
      if (elements.length) emit('select', props.sizes[elements[0].index].size)
    },
    onHover: (event, elements) => {
      if (event.native?.target) {
        event.native.target.style.cursor = elements.length
          ? 'pointer'
          : 'default'
      }
    },
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: {
          title: (items) => `Speicher: ${items[0].label}`,
          label: (ctx) =>
            ctx.dataset.yAxisID === 'years'
              ? ` ${ctx.dataset.label}: ${num(ctx.parsed.y, 1)} Jahre`
              : ` ${ctx.dataset.label}: ${num(ctx.parsed.y, 1)} %`,
        },
      },
    },
    scales: {
      x: axis(colors, { grid: { display: false } }),
      percent: axis(colors, {
        position: 'left',
        min: 0,
        max: 100,
        ticks: { ...axis(colors).ticks, callback: (v) => `${v} %` },
      }),
      years: axis(colors, {
        position: 'right',
        grid: { display: false },
        ticks: { ...axis(colors).ticks, callback: (v) => `${v} J.` },
      }),
    },
  }
})
</script>
