<template>
  <details id="expert-settings" class="card group">
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
        <p
          v-if="input.batteryPriceMode === 'offers'"
          class="font-mono text-xs text-muted"
        >
          Es werden die Größen deiner Angebote verglichen (Kosten &amp; Tarife).
        </p>
        <div v-else class="flex flex-wrap gap-1.5">
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
        <form
          v-if="input.batteryPriceMode !== 'offers'"
          class="mt-2 flex gap-2"
          @submit.prevent="addSize"
        >
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

      <div>
        <NumberField
          v-model="input.batteryLifetime"
          label="Lebensdauer Speicher"
          unit="Jahre"
          :min="1"
          :max="40"
          hint="Bestimmt, ab wann sich ein Speicher oder eine Erweiterung lohnt"
        />
        <p class="mt-1.5 text-xs text-muted">
          Bewertung: lohnt sich bei Amortisation bis
          {{ num(ratingLimits(input.batteryLifetime).yes, 1) }} Jahre, Grenzfall
          bis {{ num(input.batteryLifetime) }} Jahre, sonst nicht.
        </p>
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

      <div>
        <label class="block">
          <span
            class="mb-1 flex items-center gap-1 text-xs font-medium text-muted"
          >
            Rechenmodell
          </span>
          <select v-model="input.hourModel" class="input font-sans">
            <option
              v-for="model in HOUR_MODELS"
              :key="model.id"
              :value="model.id"
            >
              {{ model.label }}
            </option>
          </select>
        </label>
        <p class="mt-1.5 text-xs text-muted">
          {{ getHourModel(input.hourModel).description }}
        </p>
      </div>

      <div id="inverter-settings" class="scroll-mt-24">
        <div
          class="mb-2 flex items-center gap-1 text-xs font-medium text-muted"
        >
          Wechselrichter (AC-Leistung)
          <span
            class="cursor-help"
            title="Begrenzt die PV-Leistung und bestimmt den Wirkungsgrad des Wechselrichters bei Teillast"
            ><Info class="h-3.5 w-3.5"
          /></span>
        </div>
        <SegmentedControl
          v-model="input.inverterMode"
          :options="[
            { value: 'auto', label: 'wie PV' },
            { value: 'manual', label: 'eigener Wert' },
            { value: 'none', label: 'keine Grenze' },
          ]"
        />
        <NumberField
          v-if="input.inverterMode === 'manual'"
          v-model="input.maxPowerGenerationInverter"
          class="mt-2"
          label="Maximale AC-Leistung"
          unit="W"
          :min="100"
          :step="100"
        />
        <p v-else class="mt-2 font-mono text-xs text-muted">
          {{
            input.inverterMode === 'auto'
              ? `= installierte PV-Leistung (${num(limits.inverterPower)} W)`
              : 'keine Begrenzung, fester Wirkungsgrad'
          }}
        </p>
      </div>

      <div>
        <div
          class="mb-2 flex items-center gap-1 text-xs font-medium text-muted"
        >
          Einspeisebegrenzung
          <span
            class="cursor-help"
            title="Nicht eingespeiste Energie wird als Abregelung in den Details angezeigt"
            ><Info class="h-3.5 w-3.5"
          /></span>
        </div>
        <SegmentedControl
          v-model="input.feedInMode"
          :options="[
            { value: 'none', label: 'keine' },
            { value: 'watt', label: 'Watt' },
            { value: 'percent', label: '% PV' },
            { value: 'zero', label: 'Null' },
          ]"
        />
        <NumberField
          v-if="input.feedInMode === 'watt'"
          v-model="input.maxPowerFeedIn"
          class="mt-2"
          label="Maximale Einspeisung"
          unit="W"
          :min="0"
          :step="100"
          hint="z.B. 800 W für ein Balkonkraftwerk"
        />
        <NumberField
          v-else-if="input.feedInMode === 'percent'"
          v-model="input.feedInPercent"
          class="mt-2"
          label="Anteil der PV-Leistung"
          unit="%"
          :min="0"
          :max="100"
          hint="z.B. 60 % (Solarspitzengesetz) oder 70 %"
        />
        <p
          v-if="input.feedInMode === 'percent'"
          class="mt-2 font-mono text-xs text-muted"
        >
          = {{ num(limits.feedInLimit) }} W
        </p>
        <p
          v-else-if="input.feedInMode === 'zero'"
          class="mt-2 font-mono text-xs text-muted"
        >
          Nulleinspeisung: Überschuss wird nur gespeichert oder abgeregelt
        </p>
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
import {
  ChevronDown,
  Info,
  Plus,
  RotateCcw,
  Settings2,
  X,
} from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { ratingLimits } from '../../functions/batteryEconomics.js'
import { getHourModel, HOUR_MODELS } from '../../functions/hourModels/index.js'
import { batteryLabel, num } from '../../lib/format.js'
import NumberField from '../ui/NumberField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'

const { input, batterySizes, limits, reset } = useCalculator()

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
