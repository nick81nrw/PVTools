<template>
  <main class="mx-auto max-w-7xl px-4 sm:px-6">
    <section class="py-8 sm:py-12">
      <div class="label-mono text-brand">// pv-speicher-simulation</div>
      <h1
        class="mt-2 max-w-3xl font-display text-3xl leading-tight font-bold tracking-tight sm:text-5xl"
      >
        Wie groß sollte dein
        <span class="text-brand">Batteriespeicher</span> sein?
      </h1>
      <p class="mt-4 max-w-2xl text-muted sm:text-lg">
        Simuliere jede Stunde eines Jahres mit echten Wetterdaten für deinen
        Standort und vergleiche Autarkie, Ersparnis und Amortisation für
        verschiedene Speichergrößen.
      </p>
      <div class="mt-5 flex flex-wrap gap-2 font-mono text-xs">
        <span
          v-for="tag in tags"
          :key="tag"
          class="rounded-md border border-line bg-surface px-2 py-1 text-muted"
          >{{ tag }}</span
        >
      </div>
    </section>

    <div
      class="grid items-start gap-6 lg:grid-cols-[minmax(340px,400px)_minmax(0,1fr)]"
    >
      <div class="space-y-4">
        <LocationStep />
        <RoofsStep />
        <ConsumptionStep />
        <LoadsStep />
        <CostsStep />
        <AdvancedSettings />

        <div class="sticky bottom-4 z-20">
          <button
            type="button"
            class="btn-primary w-full py-3 text-base shadow-lg shadow-brand/20"
            :disabled="!canCalculate"
            @click="calculate"
          >
            <LoaderCircle v-if="busy" class="h-5 w-5 animate-spin" />
            <Zap v-else class="h-5 w-5" />
            {{ buttonLabel }}
          </button>
          <p
            v-if="missing.length && !busy"
            class="mt-2 text-center font-mono text-xs text-muted"
          >
            fehlt: {{ missing.join(', ').toLowerCase() }}
          </p>
        </div>
      </div>

      <div class="min-w-0 space-y-4">
        <div
          v-if="error"
          class="flex items-start gap-3 rounded-lg border border-grid/40 bg-grid/10 px-4 py-3 text-sm"
          role="alert"
        >
          <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-grid" />
          <span class="flex-1">{{ error }}</span>
          <button
            type="button"
            class="text-muted hover:text-ink"
            aria-label="Schließen"
            @click="error = null"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div ref="resultsEl" class="relative scroll-mt-20">
          <ResultsView v-if="results" />
          <EmptyState v-else />
          <div
            v-if="busy && status !== 'geocoding'"
            class="absolute inset-0 z-10 flex items-start justify-center rounded-xl bg-canvas/70 pt-24 backdrop-blur-[2px]"
          >
            <div
              class="card flex items-center gap-3 px-5 py-4 font-mono text-sm"
            >
              <LoaderCircle class="h-5 w-5 animate-spin text-brand" />
              {{ busyText }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-20">
      <FaqSection />
    </div>
  </main>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { LoaderCircle, TriangleAlert, X, Zap } from 'lucide-vue-next'

import FaqSection from '../components/FaqSection.vue'
import AdvancedSettings from '../components/inputs/AdvancedSettings.vue'
import ConsumptionStep from '../components/inputs/ConsumptionStep.vue'
import CostsStep from '../components/inputs/CostsStep.vue'
import LoadsStep from '../components/inputs/LoadsStep.vue'
import LocationStep from '../components/inputs/LocationStep.vue'
import RoofsStep from '../components/inputs/RoofsStep.vue'
import EmptyState from '../components/results/EmptyState.vue'
import ResultsView from '../components/results/ResultsView.vue'
import { useCalculator } from '../composables/useCalculator.js'

const { status, error, results, missing, canCalculate, calculate } =
  useCalculator()

const tags = [
  '8.760 h / jahr',
  'pvgis 5.3',
  'bdew h0 lastprofil',
  'open source',
]

const resultsEl = ref(null)

// on small screens the results are below all inputs, so jump to them
watch(results, async (value) => {
  if (value && window.innerWidth < 1024) {
    await nextTick()
    resultsEl.value?.scrollIntoView({ behavior: 'smooth' })
  }
})

const busy = computed(() => status.value !== 'idle')

const busyText = computed(
  () =>
    ({
      fetching: 'lade PV-Daten von PVGIS …',
      simulating: 'simuliere Speichergrößen …',
    })[status.value],
)

const buttonLabel = computed(() =>
  busy.value && status.value !== 'geocoding'
    ? 'Berechne …'
    : results.value
      ? 'Neu berechnen'
      : 'Berechnen',
)
</script>
