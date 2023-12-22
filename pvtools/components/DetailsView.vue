<script setup lang="ts">
import { stringifyQuery } from 'vue-router'

interface Props {
  columns: any
  item: any
  roofsData: any
}
const props = defineProps<Props>()

function downloadDataCsv({ array, filename }) {
  const data = createDataCsv(array)
  downloadCsv({ data, filename })
}

function downloadCsv({ data, filename, type = 'text/plan' }) {
  const file = new File([data], filename, { type })
  const blobUrl = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)

  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  )

  document.body.removeChild(link)
}

function colFormatter(text: number): string {
  return text.toFixed(1) + ' kWh'
}
</script>
<template>
  <v-table>
    <thead>
      <tr>
        <th>PV Erzeugung</th>
        <th>Stromverbrauch</th>
        <th>Netzbezug</th>
        <th>Fehlende Netzeinspeisung</th>
        <th>Verluste Wirkungsgrad Wechselrichter</th>
        <th>Verluste PV-Leistung > Wechelrichter Leistung</th>
        <th>Verluste Speicher</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ colFormatter(item.generationYear) }}</td>
        <td>{{ colFormatter(item.consumptionYear) }}</td>
        <td>{{ colFormatter(item.gridUsedEnergy) }}</td>
        <td>{{ colFormatter(item.missedFeedInPowerGrid) }}</td>
        <td>{{ colFormatter(item.lossesPvGeneration) }}</td>
        <td>{{ colFormatter(item.missedInverterPower) }}</td>
        <td>{{ colFormatter(item.missedBatteryPower) }}</td>
      </tr>
    </tbody>
  </v-table>
  <h4>Einzelne Erträge der Ausrichtungen</h4>
  <v-table>
    <thead>
      <tr>
        <th>Ausrichtung</th>
        <th>Neigung</th>
        <th>Leistung</th>
        <th>PV-Ertrag</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(roof, index) in roofsData" :key="index">
        <td>{{ `${roof.aspect.toFixed(1)} °` }}</td>
        <td>{{ `${roof.angle.toFixed(1)} °` }}</td>
        <td>{{ `${(roof.peakpower / 1000).toFixed(1)} kWp` }}</td>
        <td>{{ `${roof.generationYear.toFixed(1)} kWh` }}</td>
      </tr>
    </tbody>
  </v-table>
  <div
    :items="roofsData"
    :fields="[
      {
        key: 'aspect',
        label: 'Ausrichtung',
        formatter: (val) => val.toFixed(1) + '°',
      },
      {
        key: 'angle',
        label: 'Neigung',
        formatter: (val) => val.toFixed(1) + '°',
      },
      {
        key: 'peakpower',
        label: 'Leistung',
        formatter: (val) => (val / 1000).toFixed(1) + ' kWp',
      },
      {
        key: 'generationYear',
        label: 'PV-Ertrag',
        formatter: (val) => val.toFixed(1) + ' kWh',
      },
    ]"
    small
    responsive="sm"
  ></div>
  <v-btn
    @click="
      downloadDataCsv({
        array: props.item.energyFlow,
        filename: 'daten_' + props.item.size + '.csv',
      })
    "
  >
    Daten herunterladen
  </v-btn>
  <div>
    <h4>Monatsverlauf</h4>
    <BarChart
      :datasets="[
        {
          data: props.item.monthlyData.map(
            (i) => (i.feedInEnergyGrid * -1) / 1000
          ),
          label: 'Einspeisung',
          backgroundColor: 'orange',
          stack: 'Stack 0',
        },
        {
          data: props.item.monthlyData.map((i) => i.selfUsedEnergyPV / 1000),
          label: 'Selbstverbrauch PV',
          backgroundColor: 'green',
          stack: 'Stack 0',
        },
        {
          data: props.item.monthlyData.map(
            (i) => i.selfUsedEnergyBattery / 1000
          ),
          label: 'Selbstverbrauch Speicher',
          backgroundColor: 'blue',
          stack: 'Stack 0',
        },
        {
          data: props.item.monthlyData.map((i) => i.gridUsedEnergy / 1000),
          label: 'Netzverbrauch',
          backgroundColor: 'red',
          stack: 'Stack 0',
        },
        // {data: props.item.monthlyData.map(i=>(i.gridUsedEnergy+i.selfUsedEnergyBattery+i.selfUsedEnergyPV)/1000),label:'Gesamtverbrauch', backgroundColor: 'black', stack: 'Stack 2'},
      ]"
      :labels="[
        'Jan',
        'Feb',
        'Mar',
        'Apr',
        'Mai',
        'Jun',
        'Jul',
        'Aug',
        'Sep',
        'Okt',
        'Nov',
        'Dez',
      ]"
    />
  </div>
</template>
