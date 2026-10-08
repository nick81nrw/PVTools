<template>
  <div class="h-56 sm:h-64">
    <Bar
      :key="isDark"
      :data="chartData"
      :options="options"
      aria-label="Weniger Netzbezug je Speicherstufe"
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
  LinearScale,
  Tooltip,
} from 'chart.js'

import { useTheme } from '../../composables/useTheme.js'
import { axis, baseOptions, themeColors } from '../../lib/chartTheme.js'
import { eur, kwh, years } from '../../lib/format.js'
import { RATINGS } from '../../lib/rating.js'
import { stepLabel } from './stepLabel.js'

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip)

const props = defineProps({
  steps: { type: Array, required: true },
  selected: { type: Number, default: null },
})
const emit = defineEmits(['select'])

const { isDark } = useTheme()

const chartData = computed(() => ({
  labels: props.steps.map((step) => stepLabel(step)),
  datasets: [
    {
      label: 'Weniger Netzbezug',
      data: props.steps.map((step) => Math.max(step.lessGrid, 0)),
      backgroundColor: props.steps.map(
        (step) =>
          RATINGS[step.rating].color +
          (step.to === props.selected ? 'ff' : 'b3'),
      ),
      borderColor: props.steps.map((step) => RATINGS[step.rating].color),
      borderWidth: props.steps.map((step) =>
        step.to === props.selected ? 2 : 0,
      ),
      borderRadius: 4,
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
    onClick: (_event, elements) => {
      if (elements.length) emit('select', props.steps[elements[0].index].to)
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
      legend: { display: false },
      tooltip: {
        ...base.plugins.tooltip,
        callbacks: {
          title: (items) => `Speicher ${items[0].label}`,
          label: (ctx) => {
            const step = props.steps[ctx.dataIndex]
            return [
              ` weniger Netzbezug: ${kwh(step.lessGrid)}/Jahr`,
              ` Mehrkosten: ${eur(step.extraCosts)}`,
              ` Mehrnutzen: ${eur(step.extraSavings)}/Jahr`,
              ` Amortisation: ${years(step.payback)}`,
              ` lohnt sich: ${RATINGS[step.rating].label}`,
            ]
          },
        },
      },
    },
    scales: {
      x: axis(colors, { grid: { display: false } }),
      y: axis(colors, {
        beginAtZero: true,
        ticks: { ...axis(colors).ticks, callback: (v) => `${v} kWh` },
      }),
    },
  }
})
</script>
