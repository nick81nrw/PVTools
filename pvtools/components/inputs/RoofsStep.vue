<template>
  <StepCard
    step="02"
    title="Dachflächen"
    subtitle="Jede Ausrichtung wird einzeln bei PVGIS berechnet"
  >
    <template #aside>
      <span v-if="input.roofs.length" class="num text-sm font-semibold">
        Σ {{ num(totalPeakPower / 1000, 1) }} kWp
      </span>
    </template>

    <ul v-if="input.roofs.length" class="mb-4 space-y-2">
      <li
        v-for="(roof, index) in input.roofs"
        :key="index"
        class="flex items-center gap-3 rounded-lg border border-line bg-surface-2 px-3 py-2"
      >
        <CompassBadge :aspect="roof.aspect" :size="38" />
        <div class="min-w-0 flex-1">
          <div class="text-sm font-medium">
            {{ azimuthName(roof.aspect) }}
            <span class="num text-muted">({{ roof.aspect }}°)</span>
          </div>
          <div class="num text-xs text-muted">
            Neigung {{ roof.angle }}° · {{ num(roof.peakpower / 1000, 2) }} kWp
          </div>
        </div>
        <button
          type="button"
          class="rounded-md p-1.5 text-muted hover:bg-surface hover:text-ink"
          title="Bearbeiten"
          @click="editRoof(index)"
        >
          <Pencil class="h-4 w-4" />
        </button>
        <button
          type="button"
          class="rounded-md p-1.5 text-muted hover:bg-surface hover:text-grid"
          title="Entfernen"
          @click="input.roofs.splice(index, 1)"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </li>
    </ul>

    <form
      class="rounded-lg border border-dashed border-line p-3"
      @submit.prevent="addRoof"
    >
      <div class="mb-3 flex items-center gap-3">
        <CompassBadge :aspect="draft.aspect" :size="52" />
        <div class="flex flex-wrap gap-1">
          <button
            v-for="preset in presets"
            :key="preset.label"
            type="button"
            class="rounded-md border px-2 py-1 font-mono text-xs transition"
            :class="
              draft.aspect === preset.aspect
                ? 'border-brand bg-brand-soft text-brand'
                : 'border-line text-muted hover:text-ink'
            "
            @click="draft.aspect = preset.aspect"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
      <div class="grid grid-cols-3 gap-2">
        <NumberField
          v-model="draft.aspect"
          label="Azimut"
          unit="°"
          :min="-180"
          :max="180"
          :step="1"
          hint="0° = Süden, -90° = Osten, 90° = Westen, ±180° = Norden"
        />
        <NumberField
          v-model="draft.angle"
          label="Neigung"
          unit="°"
          :min="0"
          :max="90"
          :step="1"
          hint="0° = waagerecht, 90° = senkrecht"
        />
        <NumberField
          v-model="draft.peakpower"
          label="Leistung"
          unit="kWp"
          :factor="0.001"
          :min="0.1"
          :step="0.1"
        />
      </div>
      <button
        type="submit"
        class="btn-ghost mt-3 w-full"
        :disabled="!(draft.peakpower > 0)"
      >
        <Plus class="h-4 w-4" />
        {{ editing ? 'Dachfläche übernehmen' : 'Dachfläche hinzufügen' }}
      </button>
    </form>
  </StepCard>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Pencil, Plus, Trash2 } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { azimuthName, num } from '../../lib/format.js'
import CompassBadge from '../ui/CompassBadge.vue'
import NumberField from '../ui/NumberField.vue'
import StepCard from '../ui/StepCard.vue'

const { input, totalPeakPower } = useCalculator()

const presets = [
  { label: 'O', aspect: -90 },
  { label: 'SO', aspect: -45 },
  { label: 'S', aspect: 0 },
  { label: 'SW', aspect: 45 },
  { label: 'W', aspect: 90 },
]

const emptyDraft = () => ({ aspect: 0, angle: 30, peakpower: 0 })
const draft = reactive(emptyDraft())
const editing = ref(false)

const addRoof = () => {
  input.roofs.push({
    aspect: draft.aspect,
    angle: draft.angle,
    peakpower: draft.peakpower, // Wp
  })
  Object.assign(draft, emptyDraft())
  editing.value = false
}

const editRoof = (index) => {
  const [roof] = input.roofs.splice(index, 1)
  Object.assign(draft, roof)
  editing.value = true
}
</script>
