<template>
  <StepCard
    step="03"
    title="Stromverbrauch"
    subtitle="Standardlastprofil H0 oder deine stündlichen Messwerte"
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
        label="Jährlicher Stromverbrauch"
        unit="kWh/a"
        :min="0"
        :step="100"
        hint="Wird mit dem BDEW-Standardlastprofil H0 auf die Stunden des Jahres verteilt"
      />
    </div>

    <div v-else class="mt-4 space-y-3">
      <p class="text-xs text-muted">
        Lade die Vorlage für das Wetterjahr {{ input.year }} herunter und trage
        in Spalte B deinen stündlichen Verbrauch in Wh ein.
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
        <span v-if="importedConsumption" class="font-medium">
          {{ importedConsumption.fileName }}
        </span>
        <span v-else>CSV-Datei auswählen oder hier ablegen</span>
        <span class="font-mono text-xs text-muted">Datetime;Power</span>
        <input type="file" accept=".csv" class="sr-only" @change="onFile" />
      </label>
      <p
        v-if="importError"
        class="flex items-start gap-2 text-sm text-grid"
        role="alert"
      >
        <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0" /> {{ importError }}
      </p>
      <p
        v-else-if="csvYearMismatch"
        class="flex items-start gap-2 text-sm text-grid"
        role="alert"
      >
        <TriangleAlert class="mt-0.5 h-4 w-4 shrink-0" />
        Die Datei enthält das Jahr {{ importedConsumption.year }}, eingestellt
        ist {{ input.year }}. Bitte Datei oder Wetterjahr anpassen.
      </p>
      <p
        v-else-if="importedConsumption"
        class="flex items-center gap-2 text-sm text-brand"
      >
        <Check class="h-4 w-4" /> Messwerte für {{ importedConsumption.year }}
        geladen
      </p>
    </div>
  </StepCard>
</template>

<script setup>
import { ref } from 'vue'
import { Check, Download, TriangleAlert, Upload } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { createTemplateCsv } from '../../functions/convertConsumptionUploads.js'
import { downloadText } from '../../lib/download.js'
import NumberField from '../ui/NumberField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import StepCard from '../ui/StepCard.vue'

const {
  input,
  consumptionMode,
  importedConsumption,
  csvYearMismatch,
  importCsv,
} = useCalculator()

const importError = ref(null)
const dragging = ref(false)

const load = async (file) => {
  if (file) importError.value = await importCsv(file)
}
const onFile = (event) => load(event.target.files[0])
const onDrop = (event) => {
  dragging.value = false
  load(event.dataTransfer.files[0])
}

const downloadTemplate = () =>
  downloadText(createTemplateCsv(input.year), `verbrauch_${input.year}.csv`)
</script>
