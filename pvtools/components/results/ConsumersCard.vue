<template>
  <section class="card p-4 sm:p-5">
    <div class="mb-4 flex items-center gap-2">
      <h3 class="font-display text-base font-semibold">
        Verbrauch nach Verbraucher
      </h3>
      <BetaBadge />
      <span class="ml-auto font-mono text-xs text-muted">{{
        batteryLabel(item.size)
      }}</span>
    </div>

    <div class="space-y-4">
      <div v-for="row in rows" :key="row.label">
        <div class="flex items-baseline justify-between gap-3 text-sm">
          <span class="flex items-center gap-2 font-medium">
            <component :is="row.icon" class="h-4 w-4" :class="row.color" />
            {{ row.label }}
          </span>
          <span class="num text-muted">
            {{ kwh(row.consumption) }} ·
            <span class="text-ink">{{ pct(row.share, 0) }}</span> aus PV &amp;
            Speicher
          </span>
        </div>
        <div class="mt-1.5 h-2 overflow-hidden rounded-full bg-grid/25">
          <div
            class="h-full rounded-full bg-battery"
            :style="{ width: `${Math.min(row.share, 100)}%` }"
          ></div>
        </div>
        <p v-if="row.note" class="mt-1 text-xs text-muted">{{ row.note }}</p>
      </div>
    </div>
    <p class="mt-4 text-xs text-muted">
      Grün = Anteil aus eigener PV-Anlage und Speicher, rot = Netzbezug.
    </p>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { Car, Heater, House } from 'lucide-vue-next'

import { batteryLabel, kwh, pct } from '../../lib/format.js'
import BetaBadge from '../ui/BetaBadge.vue'

const props = defineProps({
  item: { type: Object, required: true },
})

const share = (part) =>
  part.consumption > 0 ? (part.selfUsed / part.consumption) * 100 : 0

const rows = computed(() => {
  const { household, heatPump, ev } = props.item.consumers
  const list = [
    {
      label: 'Haushalt',
      icon: House,
      color: 'text-pv',
      consumption: household.consumption,
      share: share(household),
    },
  ]
  if (heatPump.consumption > 0)
    list.push({
      label: 'Wärmepumpe',
      icon: Heater,
      color: 'text-grid',
      consumption: heatPump.consumption,
      share: share(heatPump),
    })
  if (ev.consumption > 0)
    list.push({
      label: 'E-Auto',
      icon: Car,
      color: 'text-feedin',
      consumption: ev.consumption,
      share: share(ev),
      note:
        ev.fromSurplus > 0
          ? `davon ${kwh(ev.fromSurplus)} mit PV-Überschuss geladen`
          : 'Der Hausspeicher lädt das Auto nicht.',
    })
  return list
})
</script>
