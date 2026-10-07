<template>
  <div class="h-72">
    <Bar
      :key="isDark"
      :data="chartData"
      :options="options"
      aria-label="Monatlicher Energiefluss"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from 'chart.js'

import { useTheme } from '../../composables/useTheme.js'
import {
  axis,
  baseOptions,
  ENERGY_COLORS,
  themeColors,
} from '../../lib/chartTheme.js'
import { num } from '../../lib/format.js'

ChartJS.register(BarElement, CategoryScale, Legend, LinearScale, Tooltip)

const props = defineProps({
  monthlyData: { type: Array, required: true },
})

const { isDark } = useTheme()

const MONTHS = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
]

const series = (label, key, color, sign = 1) => ({
  label,
  data: props.monthlyData.map((m) => (sign * m[key]) / 1000),
  backgroundColor: color,
  borderRadius: 3,
  stack: 'energy',
  maxBarThickness: 34,
})

const chartData = computed(() => ({
  labels: MONTHS,
  datasets: [
    series('PV direkt', 'selfUsedEnergyPV', ENERGY_COLORS.pv),
    series('Aus Speicher', 'selfUsedEnergyBattery', ENERGY_COLORS.battery),
    series('Netzbezug', 'gridUsedEnergy', ENERGY_COLORS.grid),
    series('Einspeisung', 'feedInEnergyGrid', ENERGY_COLORS.feedin, -1),
  ],
}))

const options = computed(() => {
  void isDark.value
  const colors = themeColors()
  const base = baseOptions(colors)
  return {
    ...base,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      ...base.plugins,
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: {
          label: (ctx) =>
            ` ${ctx.dataset.label}: ${num(Math.abs(ctx.parsed.y), 0)} kWh`,
        },
      },
    },
    scales: {
      x: axis(colors, { stacked: true, grid: { display: false } }),
      y: axis(colors, {
        stacked: true,
        ticks: { ...axis(colors).ticks, callback: (v) => `${v} kWh` },
      }),
    },
  }
})
</script>
