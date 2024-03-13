<script setup lang="ts">
import { stringifyQuery } from 'vue-router'

interface Props {
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
  <q-table
    :rows="[item]"
    :columns="[
      {
        name: 'generationYear',
        label: 'PV Erzeugung',
        field: 'generationYear',
        format: (val) => val.toFixed(1) + ' kWh',
      },
      {
        name: 'consumptionYear',
        label: 'Stromverbrauch',
        field: 'consumptionYear',
        format: (val) => val.toFixed(1) + ' kWh',
      },
      {
        name: 'gridUsedEnergy',
        label: 'Netzbezug',
        field: 'gridUsedEnergy',
        format: (val) => val.toFixed(1) + ' kWh',
      },
      {
        name: 'missedFeedInPowerGrid',
        label: 'Fehlende Netzeinspeisung',
        field: 'missedFeedInPowerGrid',
        format: (val) => val.toFixed(1) + ' kWh',
      },
      {
        name: 'lossesPvGeneration',
        label: 'Verluste Wirkungsgrad Wechselrichter',
        field: 'lossesPvGeneration',
        format: (val) => val.toFixed(1) + ' kWh',
      },
      {
        name: 'missedInverterPower',
        label: 'Verluste PV-Leistung > Wechelrichter Leistung',
        field: 'missedInverterPower',
        format: (val) => val.toFixed(1) + ' kWh',
      },
      {
        name: 'missedBatteryPower',
        label: 'Verluste Speicher',
        field: 'missedBatteryPower',
        format: (val) => val.toFixed(1) + ' kWh',
      },
    ]"
    small
    responsive="sm"
  />
  <h4>Einzelne Erträge der Ausrichtungen</h4>
  <q-table
    :rows="roofsData"
    :columns="[
      {
        name: 'aspect',
        label: 'Ausrichtung',
        field: 'aspect',
        format: (val) => val.toFixed(1) + '°',
      },
      {
        name: 'angle',
        label: 'Neigung',
        field: 'angle',
        format: (val) => val.toFixed(1) + '°',
      },
      {
        name: 'peakpower',
        label: 'Leistung',
        field: 'peakpower',
        format: (val) => (val / 1000).toFixed(1) + ' kWp',
      },
      {
        name: 'generationYear',
        label: 'PV-Ertrag',
        field: 'generationYear',
        format: (val) => val.toFixed(1) + ' kWh',
      },
    ]"
    small
    responsive="sm"
  ></q-table>
  <q-btn
    @click="
      downloadDataCsv({
        array: props.item.energyFlow,
        filename: 'daten_' + props.item.size + '.csv',
      })
    "
  >
    Daten herunterladen
  </q-btn>
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
