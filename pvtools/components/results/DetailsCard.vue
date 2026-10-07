<template>
  <div class="grid gap-6 md:grid-cols-2">
    <div>
      <div class="label-mono mb-2">// verluste &amp; begrenzungen</div>
      <dl class="divide-y divide-line/60 text-sm">
        <div
          v-for="row in losses"
          :key="row.label"
          class="flex justify-between gap-4 py-1.5"
        >
          <dt class="text-muted" :title="row.hint">{{ row.label }}</dt>
          <dd class="num">{{ kwh(row.value, 1) }}</dd>
        </div>
      </dl>
    </div>
    <div>
      <div class="label-mono mb-2">// ertrag je dachfläche</div>
      <dl class="divide-y divide-line/60 text-sm">
        <div
          v-for="(roof, index) in roofs"
          :key="index"
          class="flex items-center justify-between gap-4 py-1.5"
        >
          <dt class="flex items-center gap-2 text-muted">
            <CompassBadge :aspect="roof.aspect" :size="22" />
            <span class="num"
              >{{ azimuthName(roof.aspect) }} · {{ roof.angle }}° ·
              {{ num(roof.peakpower / 1000, 1) }} kWp</span
            >
          </dt>
          <dd class="num">
            {{ kwh(roof.generationYear) }}
            <span class="text-xs text-muted"
              >({{
                num(roof.generationYear / (roof.peakpower / 1000), 0)
              }}
              kWh/kWp)</span
            >
          </dd>
        </div>
      </dl>
      <button type="button" class="btn-ghost mt-4 w-full" @click="download">
        <Download class="h-4 w-4" />
        Stundenwerte als CSV ({{ batteryLabel(item.size) }})
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Download } from 'lucide-vue-next'

import { createDataCsv } from '../../functions/convertConsumptionUploads.js'
import { downloadText } from '../../lib/download.js'
import { azimuthName, batteryLabel, kwh, num } from '../../lib/format.js'
import CompassBadge from '../ui/CompassBadge.vue'

const props = defineProps({
  item: { type: Object, required: true },
  roofs: { type: Array, required: true },
})

const losses = computed(() => [
  {
    label: 'Wirkungsgrad Wechselrichter',
    value: props.item.lossesPvGeneration,
    hint: 'Verluste durch die Wirkungsgrad-Kennlinie des Wechselrichters',
  },
  {
    label: 'Abregelung Wechselrichter',
    value: props.item.missedInverterPower,
    hint: 'PV-Leistung oberhalb der maximalen Wechselrichterleistung',
  },
  {
    label: 'Einspeisebegrenzung',
    value: props.item.missedFeedInPowerGrid,
    hint: 'Nicht eingespeiste Energie durch die maximale Einspeiseleistung',
  },
  {
    label: 'Speicherverluste',
    value: props.item.missedBatteryPower,
    hint: 'Lade- und Entladeverluste des Speichers',
  },
  {
    label: 'Netzbezug',
    value: props.item.gridUsedEnergy,
    hint: 'Strom, der weiterhin aus dem Netz bezogen wird',
  },
])

const download = () =>
  downloadText(
    createDataCsv(props.item.energyFlow),
    `pvtools_${props.item.size}Wh.csv`,
  )
</script>
