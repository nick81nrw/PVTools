<template>
  <div class="space-y-4">
    <div
      class="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs text-muted"
    >
      <span class="text-brand">●</span>
      <span>{{ results.meta.location }}</span>
      <span>·</span>
      <span>{{ num(results.meta.peakPower / 1000, 1) }} kWp</span>
      <span>·</span>
      <span>{{ kwh(results.meta.consumption) }}/a</span>
      <span>·</span>
      <span>wetterjahr {{ results.meta.year }}</span>
      <template v-if="results.meta.hourModel.id !== DEFAULT_HOUR_MODEL">
        <span>·</span>
        <span class="text-pv">modell: {{ results.meta.hourModel.label }}</span>
      </template>
    </div>

    <div
      v-if="isStale"
      class="flex items-center gap-2 rounded-lg border border-pv/40 bg-pv/10 px-3 py-2 text-sm"
    >
      <RefreshCw class="h-4 w-4 text-pv" />
      Eingaben geändert – die Ergebnisse sind veraltet.
      <button
        type="button"
        class="ml-auto font-medium text-brand hover:underline"
        :disabled="!canCalculate"
        @click="calculate"
      >
        Neu berechnen
      </button>
    </div>

    <!-- recommendation + size picker -->
    <div class="card p-4 sm:p-5">
      <div class="flex flex-wrap items-start gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft"
        >
          <Sparkles class="h-5 w-5 text-brand" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="label-mono">unsere empfehlung</div>
          <div class="font-display text-xl font-semibold sm:text-2xl">
            <template v-if="recommendedItem.size > 1">
              {{ batteryLabel(recommendedItem.size) }} Speicher
            </template>
            <template v-else>Kein Speicher</template>
          </div>
          <ul class="mt-2 space-y-1.5 text-sm">
            <li
              v-for="(sentence, index) in results.economics.sentences"
              :key="index"
              class="flex gap-2"
            >
              <span
                class="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                :style="{ background: sentenceColor(index) }"
              ></span>
              <span>{{ sentence }}</span>
            </li>
          </ul>
          <dl
            v-if="recommendedItem.size > 1"
            class="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3 sm:grid-cols-4"
          >
            <div v-for="stat in recommendationStats" :key="stat.label">
              <dt class="label-mono">{{ stat.label }}</dt>
              <dd class="num mt-0.5 text-sm font-semibold">
                {{ stat.value }}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div class="mt-4">
        <div class="label-mono mb-2">andere größe ansehen</div>
        <div class="flex flex-wrap gap-1.5">
          <button
            v-for="item in results.sizes"
            :key="item.size"
            type="button"
            class="relative rounded-md border px-2.5 py-1 font-mono text-xs transition"
            :class="
              item.size === selectedSize
                ? 'border-brand bg-brand text-white dark:text-[#06210f]'
                : 'border-line bg-surface-2 hover:border-brand/60'
            "
            @click="selectedSize = item.size"
          >
            {{ batteryLabel(item.size) }}
            <span
              v-if="item.size === recommendedSize"
              class="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-pv"
            ></span>
          </button>
        </div>
      </div>
    </div>

    <BatteryStepsCard
      v-if="results.economics.steps.length"
      :economics="results.economics"
      :selected="selectedSize"
      @select="selectedSize = $event"
    />

    <KpiGrid v-if="selected" :item="selected" :baseline="baseline" />

    <div v-if="selected" class="grid gap-4 xl:grid-cols-2">
      <section class="card p-4 sm:p-5">
        <SectionTitle
          title="Energiebilanz"
          :note="batteryLabel(selected.size)"
        />
        <EnergySplit :item="selected" />
        <dl class="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-4">
          <div v-for="stat in stats" :key="stat.label">
            <dt class="label-mono">{{ stat.label }}</dt>
            <dd class="num mt-0.5 text-sm font-semibold">{{ stat.value }}</dd>
          </div>
        </dl>
      </section>
      <section class="card p-4 sm:p-5">
        <SectionTitle
          title="Monatsverlauf"
          :note="batteryLabel(selected.size)"
        />
        <MonthlyChart :monthly-data="selected.monthlyData" />
      </section>
    </div>

    <button
      type="button"
      class="btn-ghost w-full"
      :aria-expanded="showDetails"
      @click="showDetails = !showDetails"
    >
      <ChevronDown
        class="h-4 w-4 transition"
        :class="showDetails ? 'rotate-180' : ''"
      />
      {{ showDetails ? 'Weniger anzeigen' : 'Alle Zahlen und Diagramme' }}
    </button>

    <template v-if="showDetails">
      <section class="card p-4 sm:p-5">
        <SectionTitle
          title="Kennzahlen je Speichergröße"
          hint="Punkt anklicken zum Auswählen"
        />
        <SizeChart
          :sizes="results.sizes"
          :selected="selectedSize"
          @select="selectedSize = $event"
        />
      </section>

      <section class="card p-4 sm:p-5">
        <SectionTitle
          title="Alle Speichergrößen"
          hint="Zeile anklicken zum Auswählen"
        />
        <ResultsTable
          :sizes="results.sizes"
          :selected="selectedSize"
          :recommended="recommendedSize"
          @select="selectedSize = $event"
        />
      </section>

      <section v-if="selected" class="card p-4 sm:p-5">
        <SectionTitle title="Details" :note="batteryLabel(selected.size)" />
        <DetailsCard :item="selected" :roofs="results.roofsData" />
      </section>
    </template>

    <p class="font-mono text-[11px] text-muted">
      $ pvgis v5.3 · sarah3 · modell {{ results.meta.hourModel.id }} · profil
      {{ results.meta.consumptionProfile?.id ?? 'csv' }} ·
      {{ num(results.meta.hours) }} h simuliert ·
      {{ results.sizes.length }} speichergrößen ·
      {{ num(results.meta.duration / 1000, 1) }} s
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ChevronDown, RefreshCw, Sparkles } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { DEFAULT_HOUR_MODEL } from '../../functions/hourModels/index.js'
import { batteryLabel, eur, kwh, num, years } from '../../lib/format.js'
import { RATINGS } from '../../lib/rating.js'
import BatteryStepsCard from './BatteryStepsCard.vue'
import SectionTitle from '../ui/SectionTitle.vue'
import DetailsCard from './DetailsCard.vue'
import EnergySplit from './EnergySplit.vue'
import KpiGrid from './KpiGrid.vue'
import MonthlyChart from './MonthlyChart.vue'
import ResultsTable from './ResultsTable.vue'
import SizeChart from './SizeChart.vue'

const {
  results,
  selected,
  selectedSize,
  baseline,
  recommendedSize,
  isStale,
  canCalculate,
  calculate,
} = useCalculator()

const showDetails = ref(false)

const recommendedItem = computed(() =>
  results.value.sizes.find((item) => item.size === recommendedSize.value),
)

/** dot color of a sentence: the steps of the path, then the next step */
const sentenceColor = (index) => {
  const { path, next } = results.value.economics.recommendation
  const step = index < path.length ? path[index] : next
  return RATINGS[step?.rating ?? 'no'].color
}

const recommendationStats = computed(() => {
  const item = recommendedItem.value
  return [
    { label: 'Speicherpreis', value: eur(item.batteryPrice) },
    {
      label: 'Ersparnis Speicher',
      value: `${eur(item.costSavingsBattery)}/Jahr`,
    },
    {
      label: 'Amortisation Speicher',
      value: years(item.batteryAmortization),
    },
    {
      label: 'Autarkie',
      value: `${num(item.selfSufficiencyRate, 0)} % statt ${num(baseline.value.selfSufficiencyRate, 0)} %`,
    },
  ]
})

const stats = computed(() => [
  { label: 'PV-Erzeugung', value: kwh(selected.value.generationYear) },
  { label: 'Verbrauch', value: kwh(selected.value.consumptionYear) },
  { label: 'Netzbezug', value: kwh(selected.value.gridUsedEnergy) },
  { label: 'Einspeisung', value: kwh(selected.value.fedInPower) },
])
</script>
