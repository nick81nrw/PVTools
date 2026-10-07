<template>
  <details class="card group">
    <summary
      class="flex cursor-pointer list-none items-center gap-3 p-4 select-none sm:px-5"
    >
      <Settings2 class="h-4 w-4 text-brand" />
      <span class="font-display text-base font-semibold">
        Experten-Einstellungen
      </span>
      <span class="ml-auto"></span>
      <ChevronDown
        class="h-4 w-4 text-muted transition group-open:rotate-180"
      />
    </summary>

    <div class="space-y-5 border-t border-line p-4 sm:p-5">
      <div>
        <div class="mb-2 text-xs font-medium text-muted">
          Zu vergleichende Speichergrößen
        </div>
        <div class="flex flex-wrap gap-1.5">
          <span
            v-for="size in batterySizes"
            :key="size"
            class="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 py-0.5 pr-1 pl-2 font-mono text-xs"
          >
            {{ batteryLabel(size) }}
            <button
              type="button"
              class="rounded p-0.5 text-muted hover:text-grid"
              :title="`${batteryLabel(size)} entfernen`"
              @click="removeSize(size)"
            >
              <X class="h-3 w-3" />
            </button>
          </span>
        </div>
        <form class="mt-2 flex gap-2" @submit.prevent="addSize">
          <input
            v-model.number="newSize"
            class="input"
            type="number"
            min="0.2"
            max="2000"
            step="0.1"
            placeholder="Größe in kWh"
          />
          <button type="submit" class="btn-ghost" :disabled="!validNewSize">
            <Plus class="h-4 w-4" />
          </button>
        </form>
      </div>

      <div class="grid grid-cols-2 gap-3">
        <NumberField
          v-model="input.systemloss"
          label="Systemverluste PV"
          unit="%"
          :min="0"
          :max="100"
          hint="Pauschale Verluste (Kabel, Verschmutzung, …), von PVGIS berücksichtigt"
        />
        <NumberField
          v-model="input.batterySocMinPercent"
          label="Min. Ladezustand"
          unit="%"
          :min="0"
          :max="100"
          hint="Der Speicher wird nicht tiefer entladen"
        />
        <NumberField
          v-model="input.batteryLoadEfficiency"
          label="Ladeeffizienz"
          unit="%"
          :min="1"
          :max="100"
        />
        <NumberField
          v-model="input.batteryUnloadEfficiency"
          label="Entladeeffizienz"
          unit="%"
          :min="1"
          :max="100"
        />
        <NumberField
          v-model="input.maxPowerGenerationInverter"
          label="Max. Leistung WR"
          unit="W"
          :min="0"
          :step="100"
          hint="Begrenzt die PV-Leistung und bestimmt den Wirkungsgrad des Wechselrichters. 0 = keine Begrenzung"
        />
        <NumberField
          v-model="input.maxPowerFeedIn"
          label="Max. Einspeisung"
          unit="W"
          :min="0"
          :step="100"
          hint="z.B. für die 70-%-Regel. 0 = keine Begrenzung"
        />
        <NumberField
          v-model="input.maxPowerLoadBattery"
          label="Max. Ladeleistung"
          unit="W"
          :min="0"
          :step="100"
          hint="Maximale Ladeleistung des Speichers. 0 = keine Begrenzung"
        />
        <NumberField
          v-model="input.maxPowerGenerationBattery"
          label="Max. Entladeleistung"
          unit="W"
          :min="0"
          :step="100"
          hint="Maximale Entladeleistung des Speichers. 0 = keine Begrenzung"
        />
      </div>

      <button
        type="button"
        class="btn-ghost w-full text-grid"
        @click="confirmReset"
      >
        <RotateCcw class="h-4 w-4" />
        Alle Eingaben zurücksetzen
      </button>
    </div>
  </details>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ChevronDown, Plus, RotateCcw, Settings2, X } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { batteryLabel } from '../../lib/format.js'
import NumberField from '../ui/NumberField.vue'

const { input, batterySizes, reset } = useCalculator()

const newSize = ref(null)
const validNewSize = computed(
  () => newSize.value >= 0.2 && newSize.value <= 2000,
)

const addSize = () => {
  const wh = Math.round(newSize.value * 1000)
  if (!batterySizes.value.includes(wh)) {
    batterySizes.value = [...batterySizes.value, wh].sort((a, b) => a - b)
  }
  newSize.value = null
}

const removeSize = (size) => {
  batterySizes.value = batterySizes.value.filter((s) => s !== size)
}

const confirmReset = () => {
  if (window.confirm('Alle Eingaben löschen und neu starten?')) reset()
}
</script>
