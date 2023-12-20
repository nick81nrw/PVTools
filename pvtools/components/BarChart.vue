<template>
  <Bar
    :chart-options="chartOptions"
    :chart-data="chartData"
    :chart-id="chartId"
    :dataset-id-key="datasetIdKey"
    :plugins="plugins"
    :css-classes="cssClasses"
    :styles="styles"
    :width="width"
    :height="height"
  />
</template>

<script setup lang="ts">
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
} from 'chart.js'

import type { ChartOptions } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale)

interface Props {
  chartId: string
  datasetIdKey: string
  width: number
  height: number
  cssClasses: string
  plugins: any
  labels: string[]
  datasets: string[]
}

const props = withDefaults(defineProps<Props>(), {
  chartId: 'bar-chart',
  datasetIdKey: 'label',
  width: 400,
  height: 400,
  cssClasses: '',
  plugins: {},
  labels: [],
  datasets: [],
})

const chartData = computed(() => {
  return {
    labels: labels.value,
    datasets: datasets.value,
  }
})

const chartOptions = ref<ChartOptions>({
  responsive: true,
  scales: {
    x: {
      stacked: true,
    },
    y: {
      stacked: true,
    },
  },
})
</script>
