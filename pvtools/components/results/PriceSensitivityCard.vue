<template>
  <section class="card p-4 sm:p-5">
    <SectionTitle title="Was wäre, wenn sich die Preise ändern?" />
    <p class="-mt-2 mb-4 text-sm text-muted">
      Verschiebe die Regler: Die Empfehlung wird sofort neu bewertet. Die
      Energiemengen bleiben gleich, es ändern sich nur die Preise.
    </p>

    <div class="grid gap-4 sm:grid-cols-3">
      <label v-for="slider in sliders" :key="slider.key" class="block">
        <span class="flex items-baseline justify-between text-xs">
          <span class="font-medium text-muted">{{ slider.label }}</span>
          <span class="num font-semibold">{{ slider.text }}</span>
        </span>
        <input
          v-model.number="prices[slider.key]"
          type="range"
          class="mt-2 w-full accent-brand"
          :min="slider.min"
          :max="slider.max"
          :step="slider.step"
          :aria-label="slider.label"
        />
        <span class="flex justify-between font-mono text-[10px] text-muted">
          <span>{{ slider.minText }}</span>
          <span>{{ slider.maxText }}</span>
        </span>
      </label>
    </div>

    <div class="mt-4 rounded-lg border border-line bg-surface-2 p-3 sm:p-4">
      <div class="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span class="label-mono">empfehlung bei diesen preisen</span>
        <span class="font-display text-lg font-semibold">
          {{ sizeText(scenario.recommendation.size) }}
        </span>
        <span
          v-if="scenario.recommendation.size !== currentSize"
          class="text-xs text-muted"
        >
          statt {{ sizeText(currentSize) }}
        </span>
      </div>
      <ul class="mt-2 space-y-1 text-sm">
        <li v-for="(sentence, index) in scenario.sentences" :key="index">
          {{ sentence }}
        </li>
      </ul>
      <button
        v-if="changed"
        type="button"
        class="mt-2 text-xs font-medium text-brand hover:underline"
        @click="reset"
      >
        Auf meine Preise zurücksetzen
      </button>
    </div>

    <div class="mt-5">
      <div class="mb-2 text-xs font-medium text-muted">
        Empfohlene Speichergröße je Strompreis und Speicherpreis
        <span class="text-muted/80"
          >(Einspeisevergütung {{ ct(prices.feedIn) }})</span
        >
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[480px] table-fixed text-center text-sm">
          <colgroup>
            <col class="w-20" />
          </colgroup>
          <thead>
            <tr>
              <th class="label-mono px-2 py-1.5 text-left font-normal">
                Strom \ Speicher
              </th>
              <th
                v-for="factor in FACTORS"
                :key="factor"
                class="label-mono px-2 py-1.5 font-normal"
              >
                {{ num(factor * 100) }} %
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(row, r) in grid"
              :key="electricityRows[r]"
              class="border-t border-line/60"
            >
              <td class="num px-2 py-1.5 text-left text-muted">
                {{ ct(electricityRows[r]) }}
              </td>
              <td v-for="(size, c) in row" :key="c" class="p-0.5">
                <button
                  type="button"
                  class="num w-full rounded-md px-2 py-1.5 transition"
                  :class="
                    isCurrent(r, c)
                      ? 'bg-brand text-white dark:text-[#06210f]'
                      : size > 1
                        ? 'bg-battery/15 hover:bg-battery/25'
                        : 'text-muted hover:bg-surface-2'
                  "
                  :title="`Strompreis ${ct(electricityRows[r])}, Speicherpreis ${num(FACTORS[c] * 100)} %`"
                  @click="pick(r, c)"
                >
                  {{ size > 1 ? sizeText(size) : '–' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="mt-2 text-xs text-muted">
        100 % = dein eingegebener Speicherpreis, – = kein Speicher. Feld
        anklicken, um die Werte zu übernehmen.
      </p>
    </div>
  </section>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

import {
  economicsFor,
  recommendationGrid,
} from '../../functions/priceSensitivity.js'
import { num } from '../../lib/format.js'
import SectionTitle from '../ui/SectionTitle.vue'

const props = defineProps({
  sizes: { type: Array, required: true },
  input: { type: Object, required: true },
  currentSize: { type: Number, required: true },
})

const FACTORS = [0.6, 0.8, 1, 1.2, 1.4]

const initial = () => ({
  electricity: props.input.consumptionCosts,
  feedIn: props.input.feedInCompensation,
  batteryFactor: 1,
})
const prices = reactive(initial())
const reset = () => Object.assign(prices, initial())
// new results: start again from the entered prices
watch(() => props.input, reset)

const changed = computed(() =>
  Object.entries(initial()).some(
    ([key, value]) => Math.abs(prices[key] - value) > 1e-9,
  ),
)

const ct = (euro) => `${num(euro * 100, euro * 100 < 10 ? 1 : 0)} ct`
const sizeText = (size) =>
  size > 1 ? `${num(size / 1000, size % 1000 ? 1 : 0)} kWh` : 'kein Speicher'

const sliders = computed(() => [
  {
    key: 'electricity',
    label: 'Strompreis',
    text: `${num(prices.electricity * 100, 1)} ct/kWh`,
    min: 0.15,
    max: 0.6,
    step: 0.005,
    minText: '15 ct',
    maxText: '60 ct',
  },
  {
    key: 'feedIn',
    label: 'Einspeisevergütung',
    text: `${num(prices.feedIn * 100, 1)} ct/kWh`,
    min: 0,
    max: 0.2,
    step: 0.005,
    minText: '0 ct',
    maxText: '20 ct',
  },
  {
    key: 'batteryFactor',
    label: 'Speicherpreis',
    text: `${num(prices.batteryFactor * 100)} %`,
    min: 0.4,
    max: 1.6,
    step: 0.05,
    minText: '40 %',
    maxText: '160 %',
  },
])

const scenario = computed(() =>
  economicsFor(props.sizes, props.input, { ...prices }),
)

// rows around the electricity price on the slider, in 5 ct steps
const electricityRows = computed(() =>
  [-0.1, -0.05, 0, 0.05, 0.1]
    .map((delta) => Math.round((prices.electricity + delta) * 1000) / 1000)
    .filter((value) => value > 0),
)

const grid = computed(() =>
  recommendationGrid(
    props.sizes,
    props.input,
    electricityRows.value,
    FACTORS,
    prices.feedIn,
  ),
)

const isCurrent = (r, c) =>
  Math.abs(electricityRows.value[r] - prices.electricity) < 1e-9 &&
  Math.abs(FACTORS[c] - prices.batteryFactor) < 1e-9

const pick = (r, c) => {
  prices.electricity = electricityRows.value[r]
  prices.batteryFactor = FACTORS[c]
}
</script>
