<template>
  <section class="card p-4 sm:p-5">
    <SectionTitle title="Lohnt sich ein größerer Speicher?" />
    <p class="-mt-2 mb-3 text-sm text-muted">
      Jeder Balken zeigt, wie viel Strom aus dem Netz die nächste Speicherstufe
      zusätzlich einspart. Je größer der Speicher, desto weniger bringt jede
      weitere kWh.
    </p>

    <div class="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
      <span
        v-for="(rating, key) in RATINGS"
        :key="key"
        class="inline-flex items-center gap-1.5"
      >
        <span
          class="h-2.5 w-2.5 rounded-full"
          :style="{ background: rating.color }"
        ></span>
        {{ rating.long }}
      </span>
    </div>

    <StepsChart
      :steps="economics.steps"
      :selected="selected"
      @select="$emit('select', $event)"
    />

    <div class="mt-4 overflow-x-auto">
      <table class="w-full min-w-[560px] text-sm">
        <thead>
          <tr class="border-b border-line text-left">
            <th
              v-for="col in columns"
              :key="col.label"
              class="label-mono px-3 py-2 font-normal whitespace-nowrap"
              :class="col.align"
            >
              {{ col.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="step in economics.steps"
            :key="step.to"
            class="cursor-pointer border-b border-line/60 transition last:border-0"
            :class="
              step.to === selected ? 'bg-brand-soft' : 'hover:bg-surface-2'
            "
            @click="$emit('select', step.to)"
          >
            <td class="px-3 py-2 font-mono whitespace-nowrap">
              {{ stepLabel(step) }}
            </td>
            <td class="num px-3 py-2 text-right whitespace-nowrap">
              {{ kwh(step.lessGrid) }}
            </td>
            <td class="num px-3 py-2 text-right whitespace-nowrap">
              {{ eur(step.extraCosts) }}
            </td>
            <td class="num px-3 py-2 text-right whitespace-nowrap">
              {{ eur(step.extraSavings) }}
            </td>
            <td class="num px-3 py-2 text-right whitespace-nowrap">
              {{ payback(step.payback) }}
            </td>
            <td class="px-3 py-2 whitespace-nowrap">
              <span class="inline-flex items-center gap-1.5">
                <span
                  class="h-2.5 w-2.5 rounded-full"
                  :style="{ background: RATINGS[step.rating].color }"
                ></span>
                {{ RATINGS[step.rating].label }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <details class="group mt-3 text-sm">
      <summary
        class="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-brand select-none"
      >
        <ChevronRight class="h-3.5 w-3.5 transition group-open:rotate-90" />
        So wird bewertet
      </summary>
      <div class="mt-2 space-y-2 text-xs text-muted">
        <p>
          Jede Zeile vergleicht einen Speicher mit der nächstkleineren Größe.
          Gezählt werden nur die <b>Mehrkosten</b> der Erweiterung und ihr
          <b>Mehrnutzen</b>:
        </p>
        <p class="font-mono">
          Mehrnutzen/Jahr = weniger Netzbezug × {{ ct(prices.electricity) }} −
          weniger Einspeisung × {{ ct(prices.feedIn) }}<br />
          Amortisation = Mehrkosten ÷ Mehrnutzen/Jahr
        </p>
        <p>
          <b>Ja</b>, wenn sich die Erweiterung in höchstens
          {{ num(limits.yes, 1) }} Jahren bezahlt macht (zwei Drittel der
          Lebensdauer), <b>Grenzfall</b> bis {{ num(limits.borderline) }} Jahre
          (Lebensdauer des Speichers), sonst <b>Nein</b>. Die Lebensdauer lässt
          sich in den Experten-Einstellungen ändern.
        </p>
        <p>
          Die Empfehlung geht vom kleinsten Speicher aus so lange eine Stufe
          weiter, wie sich die Erweiterung lohnt.
        </p>
      </div>
    </details>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'

import { ratingLimits } from '../../functions/batteryEconomics.js'
import { eur, kwh, num, years } from '../../lib/format.js'
import { RATINGS } from '../../lib/rating.js'
import SectionTitle from '../ui/SectionTitle.vue'
import StepsChart from './StepsChart.vue'
import { stepLabel } from './stepLabel.js'

const props = defineProps({
  economics: { type: Object, required: true },
  selected: { type: Number, default: null },
})
defineEmits(['select'])

const limits = computed(() => ratingLimits(props.economics.lifetime))
const prices = computed(() => props.economics.prices)

const ct = (euro) => `${num(euro * 100, 1)} ct`

// compact: "nie" instead of "nicht amortisierbar"
const payback = (value) =>
  value === 0
    ? 'sofort'
    : Number.isFinite(value) && value > 0
      ? years(value)
      : 'nie'

const columns = [
  { label: 'Speicher', align: '' },
  { label: 'Weniger Netzbezug/a', align: 'text-right' },
  { label: 'Mehrkosten', align: 'text-right' },
  { label: 'Mehrnutzen/a', align: 'text-right' },
  { label: 'Amortisation', align: 'text-right' },
  { label: 'Lohnt sich?', align: '' },
]
</script>
