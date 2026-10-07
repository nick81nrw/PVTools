<template>
  <StepCard
    step="04"
    title="Kosten & Tarife"
    subtitle="Für Ersparnis und Amortisation"
  >
    <div class="grid grid-cols-2 gap-3">
      <NumberField
        v-model="input.consumptionCosts"
        label="Strompreis"
        unit="ct/kWh"
        :factor="100"
        :min="0"
        :step="0.1"
      />
      <NumberField
        v-model="input.feedInCompensation"
        label="Einspeisevergütung"
        unit="ct/kWh"
        :factor="100"
        :min="0"
        :step="0.01"
        hint="Ohne Vergütung einfach 0 eintragen"
      />
      <NumberField
        v-model="input.installationCostsWithoutBattery"
        label="PV-Anlage ohne Speicher"
        unit="€"
        :min="0"
        :step="100"
      />
      <NumberField
        v-model="input.batteryCostsPerKwh"
        label="Speicherkosten"
        unit="€/kWh"
        :min="0"
        :step="10"
      />
    </div>
  </StepCard>
</template>

<script setup>
import { useCalculator } from '../../composables/useCalculator.js'
import NumberField from '../ui/NumberField.vue'
import StepCard from '../ui/StepCard.vue'

const { input } = useCalculator()
</script>
