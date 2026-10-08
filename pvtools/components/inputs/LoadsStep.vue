<template>
  <StepCard
    step="04"
    title="Wärmepumpe & E-Auto"
    subtitle="Optional – große Verbraucher zusätzlich zum Haushaltsstrom"
  >
    <template #aside><BetaBadge /></template>

    <div class="space-y-3">
      <!-- heat pump -->
      <div class="rounded-lg border border-line p-3">
        <label class="flex cursor-pointer items-center gap-2.5">
          <input
            v-model="input.heatPumpEnabled"
            type="checkbox"
            class="h-4 w-4 accent-brand"
          />
          <Heater class="h-4 w-4 text-grid" />
          <span class="text-sm font-medium">Wärmepumpe</span>
        </label>

        <div v-if="input.heatPumpEnabled" class="mt-3 space-y-3">
          <SegmentedControl
            v-model="input.heatPumpMode"
            :options="[
              { value: 'building', label: 'Haus beschreiben' },
              { value: 'consumption', label: 'Verbrauch bekannt' },
            ]"
          />
          <template v-if="input.heatPumpMode === 'building'">
            <div class="grid grid-cols-2 gap-3">
              <NumberField
                v-model="input.heatPumpArea"
                label="Wohnfläche"
                unit="m²"
                :min="0"
                :step="10"
              />
              <NumberField
                v-model="input.heatPumpPersons"
                label="Personen"
                unit=""
                :min="0"
                :step="1"
                hint="Für den Warmwasserbedarf"
              />
            </div>
            <SegmentedControl
              v-model="input.heatPumpBuilding"
              :options="buildingOptions"
            />
          </template>
          <NumberField
            v-else
            v-model="input.heatPumpConsumption"
            label="Stromverbrauch der Wärmepumpe"
            unit="kWh/a"
            :min="0"
            :step="100"
            hint="z. B. vom Wärmepumpen-Zähler"
          />
          <p class="font-mono text-xs text-muted">
            ≈ {{ kwh(heatPumpKwh) }} Strom im Jahr, verteilt nach der
            Außentemperatur am Standort
          </p>

          <details class="group text-sm">
            <summary
              class="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-brand select-none"
            >
              <ChevronRight
                class="h-3.5 w-3.5 transition group-open:rotate-90"
              />
              mehr Einstellungen
            </summary>
            <div class="mt-2 grid grid-cols-2 gap-3">
              <NumberField
                v-model="input.heatPumpJaz"
                label="Jahresarbeitszahl"
                unit=""
                :min="1"
                :max="7"
                :step="0.1"
                hint="Wie viel Wärme die Wärmepumpe im Jahresmittel aus 1 kWh Strom macht. Typisch 3 bis 4,5"
              />
              <NumberField
                v-model="input.heatPumpHeatingLimit"
                label="Heizgrenze"
                unit="°C"
                :min="5"
                :max="22"
                :step="1"
                hint="Ab dieser Außentemperatur (Tagesmittel) wird nicht mehr geheizt"
              />
            </div>
          </details>
        </div>
      </div>

      <!-- electric car -->
      <div class="rounded-lg border border-line p-3">
        <label class="flex cursor-pointer items-center gap-2.5">
          <input
            v-model="input.evEnabled"
            type="checkbox"
            class="h-4 w-4 accent-brand"
          />
          <Car class="h-4 w-4 text-feedin" />
          <span class="text-sm font-medium">E-Auto</span>
        </label>

        <div v-if="input.evEnabled" class="mt-3 space-y-3">
          <NumberField
            v-model="input.evKmPerYear"
            label="Fahrleistung"
            unit="km/a"
            :min="0"
            :step="1000"
          />
          <div>
            <div class="mb-1 text-xs font-medium text-muted">
              Wann steht das Auto zu Hause?
            </div>
            <SegmentedControl
              v-model="input.evPresence"
              :options="[
                { value: 'commuter', label: 'Abends (Pendler)' },
                { value: 'home', label: 'Auch tagsüber' },
              ]"
            />
          </div>
          <div>
            <div
              class="mb-1 flex items-center gap-1 text-xs font-medium text-muted"
            >
              Wie wird geladen?
              <span
                class="cursor-help"
                title="Mit PV-Überschuss wird nur geladen, wenn Solarstrom übrig ist. Wird der Akku knapp, lädt das Auto aus dem Netz nach. Der Hausspeicher lädt das Auto nie."
                ><Info class="h-3.5 w-3.5"
              /></span>
            </div>
            <SegmentedControl
              v-model="input.evChargingMode"
              :options="[
                { value: 'immediate', label: 'Sofort' },
                { value: 'surplus', label: 'Mit PV-Überschuss' },
              ]"
            />
          </div>
          <p class="font-mono text-xs text-muted">
            ≈ {{ kwh(evKwh) }} im Jahr an der Wallbox
          </p>

          <details class="group text-sm">
            <summary
              class="inline-flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-brand select-none"
            >
              <ChevronRight
                class="h-3.5 w-3.5 transition group-open:rotate-90"
              />
              mehr Einstellungen
            </summary>
            <div class="mt-2 grid grid-cols-2 gap-3">
              <NumberField
                v-model="input.evConsumption"
                label="Verbrauch"
                unit="kWh/100km"
                :min="5"
                :max="50"
                :step="0.5"
              />
              <NumberField
                v-model="input.evHomeShare"
                label="Zu Hause geladen"
                unit="%"
                :min="0"
                :max="100"
                hint="Der Rest wird unterwegs oder beim Arbeitgeber geladen"
              />
              <NumberField
                v-model="input.evPower"
                label="Ladeleistung"
                unit="kW"
                :factor="0.001"
                :min="1.4"
                :max="22"
                :step="0.1"
              />
              <NumberField
                v-model="input.evBatteryKwh"
                label="Akku des Autos"
                unit="kWh"
                :min="10"
                :max="150"
                :step="5"
              />
            </div>
          </details>
        </div>
      </div>

      <p
        v-if="
          (input.heatPumpEnabled || input.evEnabled) &&
          consumptionMode === 'csv'
        "
        class="rounded-lg border border-pv/40 bg-pv/10 px-3 py-2 text-xs"
      >
        Deine Messwerte dürfen Wärmepumpe und E-Auto nicht schon enthalten,
        sonst werden sie doppelt gezählt.
      </p>
      <p
        v-if="input.heatPumpEnabled || input.evEnabled"
        class="text-xs text-muted"
      >
        Beta: vereinfachte Modelle, noch nicht an Messdaten geprüft. Wie
        gerechnet wird, steht in den FAQ.
      </p>
    </div>
  </StepCard>
</template>

<script setup>
import { computed } from 'vue'
import { Car, ChevronRight, Heater, Info } from 'lucide-vue-next'

import { useCalculator } from '../../composables/useCalculator.js'
import { evDailyEnergy } from '../../functions/loads/electricVehicle.js'
import {
  BUILDING_STANDARDS,
  heatDemand,
} from '../../functions/loads/heatPump.js'
import { kwh } from '../../lib/format.js'
import BetaBadge from '../ui/BetaBadge.vue'
import NumberField from '../ui/NumberField.vue'
import SegmentedControl from '../ui/SegmentedControl.vue'
import StepCard from '../ui/StepCard.vue'

const { input, consumptionMode } = useCalculator()

const buildingOptions = Object.entries(BUILDING_STANDARDS).map(
  ([value, { label }]) => ({ value, label }),
)

const heatPumpKwh = computed(() => {
  if (input.heatPumpMode === 'consumption') return input.heatPumpConsumption
  const demand = heatDemand(input)
  return (demand.space + demand.hotWater) / (input.heatPumpJaz || 3.5)
})

const evKwh = computed(() => (evDailyEnergy(input) * 365) / 1000)
</script>
