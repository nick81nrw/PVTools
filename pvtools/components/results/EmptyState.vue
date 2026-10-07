<template>
  <div class="card overflow-hidden">
    <div
      class="flex items-center gap-1.5 border-b border-line bg-surface-2 px-4 py-2"
    >
      <span class="h-2.5 w-2.5 rounded-full bg-grid/70"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-pv/70"></span>
      <span class="h-2.5 w-2.5 rounded-full bg-battery/70"></span>
      <span class="ml-2 font-mono text-xs text-muted"
        >pvtools — simulation</span
      >
    </div>
    <div class="p-5 font-mono text-sm leading-relaxed sm:p-6">
      <p class="text-muted">$ pvtools simulate --hours 8760</p>
      <ul class="mt-3 space-y-1">
        <li v-for="item in checklist" :key="item.label" class="flex gap-2">
          <span :class="item.done ? 'text-brand' : 'text-muted'">
            [{{ item.done ? 'x' : ' ' }}]
          </span>
          <span :class="item.done ? '' : 'text-muted'">{{ item.label }}</span>
        </li>
      </ul>
      <p class="mt-4">
        <template v-if="missing.length">
          <span class="text-pv">warten auf eingaben</span>
        </template>
        <template v-else>
          <span class="text-brand">bereit</span>
          <span class="text-muted"> – klicke auf „Berechnen“</span>
        </template>
        <span class="cursor-blink">_</span>
      </p>
    </div>
    <div class="grid gap-px border-t border-line bg-line sm:grid-cols-3">
      <div v-for="fact in facts" :key="fact.title" class="bg-surface p-4">
        <component :is="fact.icon" class="h-5 w-5 text-brand" />
        <div class="mt-2 text-sm font-semibold">{{ fact.title }}</div>
        <p class="mt-1 text-xs text-muted">{{ fact.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { BatteryCharging, Clock, SolarPanel } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'

const { address, input, consumptionMode, importedConsumption, missing } =
  useCalculator()

const checklist = computed(() => [
  { label: 'standort gesetzt', done: Boolean(address.value) },
  { label: 'dachfläche angelegt', done: input.roofs.length > 0 },
  {
    label: 'verbrauch definiert',
    done:
      consumptionMode.value === 'profile' || Boolean(importedConsumption.value),
  },
])

const facts = [
  {
    icon: Clock,
    title: 'Stündliche Simulation',
    text: 'Jede Stunde des Jahres wird mit Erzeugung, Verbrauch und Ladezustand durchgerechnet.',
  },
  {
    icon: SolarPanel,
    title: 'Echte Wetterdaten',
    text: 'Die Einstrahlung kommt von PVGIS (EU-Kommission) für deinen Standort.',
  },
  {
    icon: BatteryCharging,
    title: 'Alle Größen im Vergleich',
    text: 'Von ohne Speicher bis 30 kWh – mit Autarkie, Ersparnis und Amortisation.',
  },
]
</script>
