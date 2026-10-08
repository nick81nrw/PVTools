<template>
  <StepCard
    step="03"
    title="Stromverbrauch"
    subtitle="Lastprofil H0 oder deine stündlichen Messwerte"
  >
    <SegmentedControl
      v-model="consumptionMode"
      :options="[
        { value: 'profile', label: 'Jahresverbrauch' },
        { value: 'csv', label: 'Eigene Messwerte' },
      ]"
    />

    <div v-if="consumptionMode === 'profile'" class="mt-4">
      <NumberField
        v-model="input.yearlyConsumption"
        :label="
          input.heatPumpEnabled || input.evEnabled
            ? 'Haushaltsstrom pro Jahr (ohne WP/Auto)'
            : 'Jährlicher Stromverbrauch'
        "
        unit="kWh/a"
        :min="0"
        :step="100"
        :disabled="monthlyActive"
        :hint="`Wird mit dem Lastprofil „${profileLabel}“ auf die Stunden des Jahres verteilt (abhängig vom Rechenmodell)`"
      />

      <div v-if="monthlyActive" class="mt-3">
        <p class="mb-2 text-xs text-muted">
          Verbrauch je Monat, z. B. von deinen Zählerständen. Vorbelegt mit der
          Verteilung des Lastprofils; die Summe ist der Jahresverbrauch.
        </p>
        <div class="grid grid-cols-3 gap-2">
          <NumberField
            v-for="(month, index) in MONTHS"
            :key="month"
            v-model="input.monthlyConsumption[index]"
            :label="month"
            unit="kWh"
            :min="0"
            :step="10"
          />
        </div>
        <button
          type="button"
          class="mt-2 text-xs font-medium text-brand hover:underline"
          @click="disableMonthly"
        >
          Nur Jahresverbrauch verwenden
        </button>
      </div>
      <button
        v-else
        type="button"
        class="mt-2 text-xs font-medium text-brand hover:underline"
        @click="enableMonthly"
      >
        Verbrauch je Monat eingeben (optional)
      </button>
    </div>

    <div v-else class="mt-4 space-y-3">
      <p class="text-xs text-muted">
        Stündlicher Verbrauch in Wh, Spalten <code>Datetime</code> und
        <code>Power</code>. Die Werte können aus einem beliebigen Jahr stammen
        und werden auf das Wetterjahr übertragen.
      </p>
      <button type="button" class="btn-ghost w-full" @click="downloadTemplate">
        <Download class="h-4 w-4" />
        Vorlage {{ input.year }} herunterladen
      </button>
      <label
        class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm transition hover:border-brand"
        :class="{ 'border-brand bg-brand-soft': dragging }"
        @dragover.prevent="dragging = true"
        @dragleave="dragging = false"
        @drop.prevent="onDrop"
      >
        <Upload class="h-5 w-5 text-muted" />
        <span v-if="csvImport" class="font-medium">{{
          csvImport.fileName
        }}</span>
        <span v-else>CSV-Datei auswählen oder hier ablegen</span>
        <span class="font-mono text-xs text-muted">Datetime;Power</span>
        <input
          type="file"
          accept=".csv,text/csv"
          class="sr-only"
          @change="onFile"
        />
      </label>

      <template v-if="analysis">
        <div
          v-for="message in analysis.errors"
          :key="message"
          class="flex items-start gap-2 text-sm text-grid"
          role="alert"
        >
          <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0" /> {{ message }}
        </div>

        <dl
          v-if="analysis.stats"
          class="grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg border border-line bg-surface-2 p-3"
        >
          <div v-for="stat in stats" :key="stat.label">
            <dt class="label-mono">{{ stat.label }}</dt>
            <dd class="num text-sm" :class="stat.warn ? 'text-pv' : ''">
              {{ stat.value }}
            </dd>
          </div>
        </dl>

        <div
          v-if="!analysis.errors.length && analysis.gaps.length"
          class="space-y-2 rounded-lg border border-pv/40 bg-pv/10 p-3 text-sm"
        >
          <p class="flex items-start gap-2">
            <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0 text-pv" />
            {{ analysis.warnings[0] }}
          </p>
          <label class="block">
            <span class="mb-1 block text-xs text-muted"
              >Fehlende Stunden …</span
            >
            <select v-model="fillMethod" class="input font-sans">
              <option
                v-for="(label, value) in FILL_METHODS"
                :key="value"
                :value="value"
              >
                {{ label }}
              </option>
            </select>
          </label>
        </div>

        <p
          v-if="importedConsumption"
          class="flex items-start gap-2 text-sm text-brand"
        >
          <Check class="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Messwerte aus {{ importedConsumption.year }} werden
            verwendet<template v-if="importedConsumption.year !== input.year">
              (übertragen auf das Wetterjahr {{ input.year }})</template
            >.
          </span>
        </p>
        <button
          type="button"
          class="text-xs text-muted hover:text-grid"
          @click="discardCsv"
        >
          Datei verwerfen
        </button>
      </template>
    </div>
  </StepCard>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Check, Download, TriangleAlert, Upload } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import {
  getConsumptionProfile,
  monthlySums,
} from '../../functions/consumptionProfiles.js'
import { getHourModel } from '../../functions/hourModels/index.js'
import {
  FILL_METHODS,
  formatDatetime,
} from '../../functions/consumptionImport.js'
import { createTemplateCsv } from '../../functions/convertConsumptionUploads.js'
import { downloadText } from '../../lib/download.js'
import { kwh, num } from '../../lib/format.js'
import NumberField from '../ui/NumberField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import StepCard from '../ui/StepCard.vue'

const {
  input,
  consumptionMode,
  csvImport,
  fillMethod,
  importedConsumption,
  importCsv,
  discardCsv,
} = useCalculator()

const profileLabel = computed(
  () =>
    getConsumptionProfile(getHourModel(input.hourModel).consumptionProfile)
      .label,
)

const monthlyActive = computed(
  () =>
    input.monthlyConsumptionEnabled &&
    Array.isArray(input.monthlyConsumption) &&
    input.monthlyConsumption.length === 12,
)

const MONTHS = [
  'Jan',
  'Feb',
  'Mär',
  'Apr',
  'Mai',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dez',
]

/** monthly values with the shape of the load profile and the yearly value */
const enableMonthly = () => {
  const profile = getConsumptionProfile('h0').build({
    year: input.year,
    consumptionYear: 1,
  })
  const shares = monthlySums(profile)
  const total = shares.reduce((sum, value) => sum + value, 0)
  input.monthlyConsumption = shares.map((share) =>
    Math.round((input.yearlyConsumption * share) / total),
  )
  input.monthlyConsumptionEnabled = true
}

const disableMonthly = () => {
  input.monthlyConsumptionEnabled = false
}

// the yearly value is the sum of the months while they are used
watch(
  () => monthlyActive.value && [...input.monthlyConsumption],
  (monthly) => {
    if (monthly) {
      input.yearlyConsumption = monthly.reduce(
        (sum, value) => sum + (Number(value) || 0),
        0,
      )
    }
  },
)

const dragging = ref(false)
const analysis = computed(() => csvImport.value?.analysis)

const stats = computed(() => {
  const s = analysis.value.stats
  return [
    { label: 'zeitraum von', value: formatDatetime(s.first) },
    { label: 'bis', value: formatDatetime(s.last) },
    {
      label: 'datensätze',
      value: `${num(s.records)} / ${num(s.expectedHours)}`,
      warn: s.missingHours > 0,
    },
    { label: 'jahresverbrauch', value: kwh(s.totalKwh) },
    { label: 'min / max', value: `${num(s.min)} / ${num(s.max)} Wh` },
    { label: 'durchschnitt', value: `${num(s.mean)} Wh` },
    { label: 'nullwerte', value: num(s.zeroValues) },
    {
      label: 'fehlend',
      value: num(s.missingHours),
      warn: s.missingHours > 0,
    },
  ]
})

const load = (file) => {
  if (file) importCsv(file)
}
const onFile = (event) => {
  load(event.target.files[0])
  event.target.value = ''
}
const onDrop = (event) => {
  dragging.value = false
  load(event.dataTransfer.files[0])
}

const downloadTemplate = () =>
  downloadText(createTemplateCsv(input.year), `verbrauch_${input.year}.csv`)
</script>
