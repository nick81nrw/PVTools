<template>
  <StepCard
    step="01"
    title="Standort"
    subtitle="Für die Sonneneinstrahlung am Standort"
  >
    <form class="flex gap-2" @submit.prevent="searchAddress">
      <label class="relative flex-1">
        <span class="sr-only">Adresse</span>
        <MapPin
          class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted"
        />
        <input
          v-model="addressQuery"
          class="input pl-9 font-sans"
          placeholder="z.B. 50667 Köln"
          autocomplete="postal-code street-address"
        />
      </label>
      <button
        type="submit"
        class="btn-ghost"
        :disabled="!addressQuery.trim() || status !== 'idle'"
      >
        <LoaderCircle
          v-if="status === 'geocoding'"
          class="h-4 w-4 animate-spin"
        />
        <Search v-else class="h-4 w-4" />
        <span>Suchen</span>
      </button>
    </form>

    <div
      v-if="address"
      class="mt-3 flex items-start gap-3 rounded-lg border border-brand/30 bg-brand-soft px-3 py-2"
    >
      <Check class="mt-0.5 h-4 w-4 shrink-0 text-brand" />
      <div class="min-w-0 text-sm">
        <div class="truncate font-medium" :title="address.display_name">
          {{ address.shortName || address.display_name }}
        </div>
        <div class="font-mono text-xs text-muted">
          {{ Number(address.lat).toFixed(4) }}° N ·
          {{ Number(address.lon).toFixed(4) }}° O
        </div>
      </div>
    </div>
    <p
      v-if="addressNotFound"
      class="mt-3 flex items-center gap-2 text-sm text-grid"
    >
      <TriangleAlert class="h-4 w-4" />
      Adresse nicht gefunden – versuche es mit mehr Angaben.
    </p>

    <label class="mt-4 block">
      <span class="mb-1 flex items-center gap-1 text-xs font-medium text-muted">
        Wetterjahr
        <span
          class="cursor-help"
          title="Die Sonneneinstrahlung dieses Jahres wird simuliert. Vergleiche ruhig mehrere Jahre."
          ><Info class="h-3.5 w-3.5"
        /></span>
      </span>
      <select v-model.number="input.year" class="input">
        <option v-for="year in years" :key="year" :value="year">
          {{ year }}
        </option>
      </select>
    </label>
  </StepCard>
</template>

<script setup>
import {
  Check,
  Info,
  LoaderCircle,
  MapPin,
  Search,
  TriangleAlert,
} from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { PVGIS_FIRST_YEAR, PVGIS_LAST_YEAR } from '../../lib/api.js'
import StepCard from '../ui/StepCard.vue'

const { input, address, addressQuery, addressNotFound, status, searchAddress } =
  useCalculator()

const years = Array.from(
  { length: PVGIS_LAST_YEAR - PVGIS_FIRST_YEAR + 1 },
  (_, i) => PVGIS_LAST_YEAR - i,
)
</script>
