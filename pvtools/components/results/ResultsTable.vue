<template>
  <div class="overflow-x-auto">
    <table class="w-full min-w-[640px] text-sm">
      <thead>
        <tr class="border-b border-line text-left">
          <th
            v-for="col in columns"
            :key="col.key"
            class="label-mono px-3 py-2 font-normal whitespace-nowrap"
            :class="col.key === 'size' ? '' : 'text-right'"
          >
            {{ col.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="item in sizes"
          :key="item.size"
          class="cursor-pointer border-b border-line/60 transition last:border-0"
          :class="
            item.size === selected ? 'bg-brand-soft' : 'hover:bg-surface-2'
          "
          @click="$emit('select', item.size)"
        >
          <td class="px-3 py-2 font-mono font-medium whitespace-nowrap">
            {{ batteryLabel(item.size) }}
            <Sparkles
              v-if="item.size === recommended"
              class="ml-1 inline h-3.5 w-3.5 text-pv"
              aria-label="Empfehlung"
            />
          </td>
          <td
            v-for="col in columns.slice(1)"
            :key="col.key"
            class="num px-3 py-2 text-right whitespace-nowrap"
          >
            {{
              col.batteryOnly && item.size <= 1
                ? '–'
                : col.format(item[col.key])
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { Sparkles } from 'lucide-vue-next'

import { batteryLabel, eur, kwh, pct, years } from '../../lib/format.js'

defineProps({
  sizes: { type: Array, required: true },
  selected: { type: Number, default: null },
  recommended: { type: Number, default: null },
})
defineEmits(['select'])

const columns = [
  { key: 'size', label: 'Speicher' },
  { key: 'selfSufficiencyRate', label: 'Autarkie', format: (v) => pct(v) },
  { key: 'selfUseRate', label: 'Eigenverbr.', format: (v) => pct(v) },
  { key: 'selfUsedEnergy', label: 'Selbst genutzt', format: (v) => kwh(v) },
  { key: 'fedInPower', label: 'Eingespeist', format: (v) => kwh(v) },
  { key: 'costSavings', label: 'Ersparnis/a', format: (v) => eur(v) },
  {
    key: 'costSavingsBattery',
    label: 'davon Speicher',
    format: (v) => eur(v),
    batteryOnly: true,
  },
  { key: 'amortization', label: 'Amort. Anlage', format: (v) => years(v) },
  {
    key: 'batteryAmortization',
    label: 'Amort. Speicher',
    format: (v) => years(v),
    batteryOnly: true,
  },
]
</script>
