<template>
  <div class="space-y-5">
    <div v-for="bar in bars" :key="bar.title">
      <div class="mb-2 flex items-baseline justify-between gap-2">
        <span class="text-sm font-medium">{{ bar.title }}</span>
        <span class="num text-xs text-muted">{{ kwh(bar.total) }}</span>
      </div>
      <div class="flex h-3 overflow-hidden rounded-full bg-surface-2">
        <div
          v-for="part in bar.parts"
          :key="part.label"
          class="h-full transition-all"
          :style="{
            width: `${(100 * part.value) / bar.total}%`,
            background: part.color,
          }"
          :title="`${part.label}: ${kwh(part.value)}`"
        ></div>
      </div>
      <div class="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        <span
          v-for="part in bar.parts"
          :key="part.label"
          class="flex items-center gap-1.5 text-xs"
        >
          <span
            class="h-2 w-2 rounded-sm"
            :style="{ background: part.color }"
          ></span>
          <span class="text-muted">{{ part.label }}</span>
          <span class="num">{{ pct((100 * part.value) / bar.total, 0) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

import { ENERGY_COLORS } from '../../lib/chartTheme.js'
import { kwh, pct } from '../../lib/format.js'

const props = defineProps({
  item: { type: Object, required: true },
})

const sum = (key) =>
  props.item.monthlyData.reduce((total, m) => total + m[key], 0) / 1000

const bars = computed(() => {
  const { item } = props
  const pvDirect = sum('selfUsedEnergyPV')
  const fromBattery = sum('selfUsedEnergyBattery')
  const grid = item.gridUsedEnergy
  const rest = Math.max(
    item.generationYear - item.selfUsedEnergy - item.fedInPower,
    0,
  )
  return [
    {
      title: 'Woher kommt dein Strom?',
      total: pvDirect + fromBattery + grid,
      parts: [
        { label: 'PV direkt', value: pvDirect, color: ENERGY_COLORS.pv },
        { label: 'Speicher', value: fromBattery, color: ENERGY_COLORS.battery },
        { label: 'Netz', value: grid, color: ENERGY_COLORS.grid },
      ],
    },
    {
      title: 'Wohin geht dein Solarstrom?',
      total: item.selfUsedEnergy + item.fedInPower + rest,
      parts: [
        {
          label: 'Selbst genutzt',
          value: item.selfUsedEnergy,
          color: ENERGY_COLORS.battery,
        },
        {
          label: 'Eingespeist',
          value: item.fedInPower,
          color: ENERGY_COLORS.feedin,
        },
        { label: 'Verluste', value: rest, color: ENERGY_COLORS.loss },
      ],
    },
  ]
})
</script>
