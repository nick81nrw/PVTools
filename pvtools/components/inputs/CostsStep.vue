<template>
  <StepCard
    step="05"
    title="Kosten & Tarife"
    subtitle="Vorbelegt mit Richtwerten – gern anpassen"
  >
    <div class="grid grid-cols-2 gap-3">
      <NumberField
        v-model="input.consumptionCosts"
        label="Strompreis"
        unit="ct/kWh"
        :factor="100"
        :min="0"
        :step="0.1"
        hint="Arbeitspreis laut deiner Stromrechnung (ohne Grundgebühr)"
      />
      <NumberField
        v-model="input.feedInCompensation"
        label="Einspeisevergütung"
        unit="ct/kWh"
        :factor="100"
        :min="0"
        :step="0.01"
        hint="Was du für eingespeisten Strom bekommst. Ohne Vergütung einfach 0 eintragen"
      />
      <NumberField
        v-model="input.installationCostsWithoutBattery"
        class="col-span-2"
        label="PV-Anlage ohne Speicher"
        unit="€"
        :min="0"
        :step="100"
        hint="Gesamtpreis der PV-Anlage inklusive Montage, aber ohne Speicher"
      />
    </div>

    <div class="mt-5">
      <div class="mb-2 flex items-center gap-1 text-xs font-medium text-muted">
        Speicherpreis
        <span
          class="cursor-help"
          title="Mit eigenen Angeboten werden genau diese Speichergrößen verglichen"
          ><Info class="h-3.5 w-3.5"
        /></span>
      </div>
      <SegmentedControl
        v-model="input.batteryPriceMode"
        :options="[
          { value: 'perKwh', label: 'Richtwert' },
          { value: 'offers', label: 'Eigene Angebote' },
        ]"
      />

      <div v-if="input.batteryPriceMode === 'perKwh'" class="mt-3">
        <div class="grid grid-cols-2 gap-3">
          <NumberField
            v-model="input.batteryCostsPerKwh"
            label="Preis je kWh"
            unit="€/kWh"
            :min="0"
            :step="10"
            hint="Kosten für jede kWh Speicherkapazität"
          />
          <NumberField
            v-model="input.batteryBaseCosts"
            label="Grundkosten"
            unit="€"
            :min="0"
            :step="100"
            hint="Fallen einmal an, egal wie groß der Speicher ist, z. B. Installation oder Batterie-Wechselrichter"
          />
        </div>
        <p class="mt-2 font-mono text-xs text-muted">= {{ examples }}</p>
      </div>

      <div v-else class="mt-3">
        <p class="mb-2 text-xs text-muted">
          Trage die Angebote ein, die du vergleichen möchtest. Genau diese
          Größen werden berechnet.
        </p>
        <div class="space-y-2">
          <div
            v-for="(offer, index) in input.batteryOffers"
            :key="index"
            class="flex items-end gap-2"
          >
            <NumberField
              v-model="offer.kwh"
              class="flex-1"
              :label="index === 0 ? 'Größe' : ''"
              unit="kWh"
              :min="0.1"
              :step="0.1"
            />
            <NumberField
              v-model="offer.price"
              class="flex-1"
              :label="index === 0 ? 'Preis' : ''"
              unit="€"
              :min="0"
              :step="100"
            />
            <button
              type="button"
              class="btn-ghost mb-px px-2.5"
              :title="`Angebot ${index + 1} entfernen`"
              :disabled="input.batteryOffers.length <= 1"
              @click="removeOffer(index)"
            >
              <X class="h-4 w-4" />
            </button>
          </div>
        </div>
        <button type="button" class="btn-ghost mt-2 w-full" @click="addOffer">
          <Plus class="h-4 w-4" />
          Angebot hinzufügen
        </button>
      </div>
    </div>
  </StepCard>
</template>

<script setup>
import { computed } from 'vue'
import { Info, Plus, X } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { batteryPrice } from '../../functions/batteryEconomics.js'
import { eur } from '../../lib/format.js'
import NumberField from '../ui/NumberField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import StepCard from '../ui/StepCard.vue'

const { input } = useCalculator()

// prices of a few sizes, so the two values are easy to check
const examples = computed(() =>
  [5, 10, 15]
    .map(
      (kwh) =>
        `${kwh} kWh: ${eur(batteryPrice(kwh * 1000, { ...input, batteryPriceMode: 'perKwh' }))}`,
    )
    .join(' · '),
)

const addOffer = () => {
  const last = input.batteryOffers.at(-1)
  const kwh = last ? Number(last.kwh) + 5 : 5
  input.batteryOffers.push({
    kwh,
    price: Math.round(
      batteryPrice(kwh * 1000, { ...input, batteryPriceMode: 'perKwh' }),
    ),
  })
}

const removeOffer = (index) => {
  input.batteryOffers.splice(index, 1)
}
</script>
