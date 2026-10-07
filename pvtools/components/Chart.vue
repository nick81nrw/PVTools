<template>
  <Line :id="chartId" :data="chartData" :options="chartOptions" />
</template>

<script>
import { Line } from 'vue-chartjs'
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

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
)

export default {
  name: 'Chart',
  components: { Line },
  props: {
    chartId: {
      type: String,
      default: 'line-chart',
    },
    labels: {
      type: Array,
      default: () => [],
    },
    datasets: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      chartOptions: {
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
      },
    }
  },
  computed: {
    chartData() {
      return {
        labels: this.labels,
        datasets: this.datasets,
      }
    },
  },
}
</script>
