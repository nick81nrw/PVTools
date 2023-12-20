<template>
  <LineChartGenerator
    :chart-options="chartOptions"
    :chart-data="chartData"
    :chart-id="chartId"
    :dataset-id-key="datasetIdKey"
    :plugins="plugins"
    :css-classes="cssClasses"
  />
</template>

<script setup lang="ts">
import { Line as LineChartGenerator } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from 'chart.js'
import type { ChartOptions } from 'chart.js'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement
)

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
  chartId: 'line-chart',
  datasetIdKey: 'label',
  width: 400,
  height: 100,
  cssClasses: '',
  plugins: {},
  labels: [],
  datasets: [],
})

const chartOptions = ref<ChartOptions>({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y1: {
      type: 'linear',
      display: true,
      position: 'left',
      ticks: {
        callback(value) {
          return value + ' %'
        },
      },
    },
    y2: {
      type: 'linear',
      display: true,
      position: 'right',
      ticks: {
        callback(value) {
          return value + ' Jahre'
        },
      },
    },
    x: {
      title: {
        text: 'Speichergröße',
        display: true,
      },
    },
  },
})

const chartData = computed(() => {
  return {
    labels: labels.value,
    datasets: datasets.value,
  }
})
</script>

<style scoped></style>
