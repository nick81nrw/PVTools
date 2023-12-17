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

<script>
import { Line as LineChartGenerator } from 'vue-chartjs/legacy'
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
  components: { LineChartGenerator },
  props: {
    chartId: {
      type: String,
      default: 'line-chart',
    },
    datasetIdKey: {
      type: String,
      default: 'label',
    },
    width: {
      type: Number,
      default: 400,
    },
    height: {
      type: Number,
      default: 100,
    },
    cssClasses: {
      default: '',
      type: String,
    } /*
    styles: {
      type: Object,
      default: () => {}
    },*/,
    plugins: {
      type: Object,
      default: () => {},
    },
    labels: {
      type: Array,
      default: [],
    },
    datasets: {
      type: Array,
      default: [],
    },
  },
  data() {
    return {
      /*chartData: {
        labels: [ 'January', 'February', 'March' ],
        datasets: [ { data: [40, 20, 12] } ]
      },*/
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

<style scoped></style>
