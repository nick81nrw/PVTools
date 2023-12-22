<template>
  <div fluid>
    <div>
      <div>
        <h1>PVTools</h1>
      </div>
      <div>
        <!-- <iframe
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          width="200"
          height="100"
          type="text/html"
          src="https://www.youtube.com/embed/FKSDynkXchY?autoplay=0&fs=1&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0"
        ></iframe> -->
      </div>
      <div align-v="baseline" cols="auto">
        <q-form
          action="https://www.paypal.me/akkudoktor"
          method="post"
          target="_blank"
          class="paypal"
        >
          <input type="hidden" name="hosted_button_id" value="RTXEPF475DBVA" />
          <input
            type="image"
            src="/btn_support_LG.gif"
            name="submit"
            title="Unterstütze unsere Arbeit!"
            alt="Spenden mit dem PayPal-Button"
          />
          <!-- <img alt="" border="0" src="https://www.paypal.com/de_DE/i/scr/pixel.gif" width="1" height="1" /> -->
        </q-form>
        <p>Nutze als Grund: "PV-Tool"</p>
      </div>
    </div>

    <q-list cols="1" cols-md="2">
      <q-expansion-item label="Daten eingeben">
        <q-form>
          <q-input
            v-model="inputAddressSearchString"
            placeholder="z.B. 50667 Köln"
            v-b-tooltip.hover
            title="Beim verlassen des Feldes wird der Standort gesucht"
            label="Adresse"
          />
          <label>
            <q-btn @click="getCoordinatesByAddress"> Suche nach Adresse </q-btn>
          </label>

          <fieldset
            label="Koordinaten:"
            v-if="adressData.lon && adressData.lat"
          >
            <div>
              <input readonly v-model="adressData.lat" />
              <input readonly v-model="adressData.lon" />
            </div>
          </fieldset>
          <q-tooltip v-show="adressData == 'no_address'" variant="danger">
            Die eingegebende Adresse konnte nicht gefunden werden. Bitte
            versuchen Sie es erneut.
          </q-tooltip>

          <q-input
            v-model.number="input.yearlyConsumption"
            min="0"
            type="number"
            step="1"
            suffix="kWh"
            label="Jährlicher Stromverbrauch"
          />
          <div variant="danger" :show="useImportData">
            Es wird ein individueller Verbrauch genutzt
          </div>

          <q-input
            v-model.number="input.consumptionCosts"
            type="number"
            min="0"
            step="0.01"
            suffix="€ / kWh"
            label="Stromkosten"
          />
          <q-input
            v-model.number="input.feedInCompensation"
            min="0"
            type="number"
            step="0.001"
            suffix="€ / kWh"
            label="Einspeisevergütung"
          />

          <q-input
            v-model.number="input.installationCostsWithoutBattery"
            min="0"
            type="number"
            step="1"
            suffix="€"
            label="Installationskosten ohne Akku"
          />

          <q-input
            v-model.number="input.batteryCostsPerKwh"
            min="0"
            type="number"
            step="1"
            suffix="€"
            label="Speicherkosten pro kWh"
          />
        </q-form>

        <q-form @submit="addRoof" @submit.stop.prevent>
          <div bg-variant="light">
            <q-input
              v-model.number="roofInput.aspect"
              type="number"
              min="-180"
              max="180"
              required
              v-b-tooltip.hover
              title="0 = Süden, 90 = Westen, -90 = Osten"
              suffix="° Grad Azimuth"
              label="Ausrichtung"
            />

            <q-input
              v-model.number="roofInput.angle"
              type="number"
              min="0"
              max="90"
              required
              v-b-tooltip.hover
              title="0 = waargerecht, 90 = senkrecht"
              suffix="° Grad"
              label="Neigung"
            />

            <q-input
              v-model.number="roofInput.peakpower"
              min="1"
              type="number"
              step="1"
              required
              v-b-tooltip.hover
              title='Bei 10kWp muss "10000" eingetragen werden'
              suffix="Wp"
              label="Installierte Leistung"
            />

            <q-btn type="submit"> Ausrichtung zur Berechnung hinzufügen </q-btn>
          </div>
        </q-form>
        <div class="mt-3">
          <div
            v-for="roof in input.roofs"
            :key="roof.aspect + roof.angle + roof.peakpower"
          >
            <div
              button
              :v-b-toggle="'roof' + roof.aspect + roof.angle + roof.peakpower"
            >
              Ausrichtung {{ roof.aspect }}° - Neigung: {{ roof.angle }}° -
              {{ roof.peakpower }} Wp
              <div>
                <q-btn
                  variant="outlined"
                  @click="editRoof(roof.aspect, roof.angle, roof.peakpower)"
                >
                  <IconsEditSolid />
                </q-btn>
                <q-btn variant="flat" @click="removeRoof(roof)">
                  <IconsTrashSolid />
                </q-btn>
              </div>
            </div>
            <!-- <div
                :id="'roof' + roof.aspect + roof.angle + roof.peakpower"
                accordion="roofs"
                visible
              >
                {{'roof' + roof.aspect + roof.angle + roof.peakpower}}
              </div> -->
          </div>
        </div>

        <div class="mt-3">
          <q-btn
            @click="generateData"
            :disabled="
              (!adressData.lat && !adressData.lon) || input.roofs.length == 0
            "
            :title="
              (!adressData.lat && !adressData.lon) || input.roofs.length == 0
                ? 'Füge eine Adresse und mindestens eine PV Ausrichtung hinzu'
                : ''
            "
            v-b-toggle.inputCollapse
          >
            Berechnen
          </q-btn>
          <q-btn @click="resetValues">Zurücksetzen</q-btn>
        </div>
        <q-expansion-item label="Erweiterte Einstellungen">
          <q-select
            filled
            input-id="tags-basic"
            v-model="inputBatterySizes"
            multiple
            use-chips
            use-input
            new-value-mode="add"
            :tag-validator="tagValidator"
            title="Zwischen 0,2 und 2000 kWh"
            :input-attrs="{ 'aria-describedby': 'tags-validation-help' }"
            suffix="Wh"
            label="Speichergrößen"
          />
          <q-select
            v-model="input.year"
            :options="years.map((x) => x.value)"
            label="Vergleichsjahr"
          />

          <fieldset label="Import individueller stündlicher Verbauch:">
            <q-btn size="sm" @click="downloadCsvTemplate">
              {{
                'Vorlage herunterladen für das o.g. Vergleichsjahr ' +
                input.year
              }}
            </q-btn>
            <q-file
              v-model="csvFile"
              :state="Boolean(csvFile)"
              placeholder="Lade deinen Verbrauch für das Jahr XXX hoch"
              drop-placeholder="Drop file here..."
              accept=".csv"
              plain
            >
            </q-file>
            <div
              show
              :show="!!importCsvErrorMessage"
              dismissible
              variant="danger"
            >
              {{ importCsvErrorMessage }}
            </div>
            <q-btn size="sm" :disabled="useImportData" @click="uploadCsvData">
              Aktiviere CSV Datei
            </q-btn>
            <q-btn size="sm" :disabled="!useImportData" @click="deleteCsvFile">
              Deaktiviere Datei
            </q-btn>
          </fieldset>
          <q-input
            v-model.number="input.systemloss"
            type="number"
            min="0"
            max="100"
            suffix="%"
            label="Systemverluste PV"
          />

          <q-input
            v-model.number="input.batterySocMinPercent"
            type="number"
            min="0"
            max="100"
            suffix="%"
            label="Minimaler Ladezustand Speicher"
          />

          <q-input
            v-model.number="input.batteryLoadEfficiency"
            type="number"
            min="0"
            max="100"
            suffix="%"
            label="Ladeeffizenz Speicher Laden"
          />
          <q-input
            v-model.number="input.batteryUnloadEfficiency"
            type="number"
            min="0"
            max="100"
            suffix="%"
            label="Ladeeffizenz Speicher Entladen"
          />
          <q-input
            v-model.number="input.maxPowerGenerationInverter"
            type="number"
            min="0"
            max="100000"
            suffix="W"
            label="Maximalleistung Wechelrichter (0 = keine Prüfung)"
          />
          <!-- <fieldset label="Maximale Ladeleistung Speicher (0 = keine Prüfung):">
              <div append="W">
                <input v-model.number="input.maxPowerLoadBattery" type="number" min="0" max="100000" />
              </div>
            </fieldset>-->

          <q-input
            v-model.number="input.maxPowerGenerationBattery"
            type="number"
            min="0"
            max="100000"
            suffix="W"
            label="Maximale Lade/Entladeleistung Speicher (0 = keine Prüfung)"
          />
          <q-input
            v-model.number="input.maxPowerFeedIn"
            type="number"
            min="0"
            max="100000"
            suffix="W"
            label="Maximale Netzeinspeisung z.B. für 70% Regel (0 = keine Prüfung)"
          />
          <!-- <fieldset label="Lineare Degradation der PV-Module pro Jahr:">
              <div append="%">
                <input v-model.number="input.linearDegrationModules" type="number" min="0" max="10" />
              </div>
            </fieldset>
            <fieldset label="Lineare Veränderung des Strombedarfs pro Jahr (auch negativ erlaubt z.B. -1%):">
              <div append="%">
                <input v-model.number="input.linearConsumptionChange" type="number" min="-20" max="20" />
              </div>
            </fieldset>
            <fieldset label="Lineare Veränderung des Strompreises pro Jahr (auch negativ erlaubt z.B. -1%):">
              <div append="%">
                <input v-model.number="input.linearConsumptionCostsChange" type="number" min="-20" max="20" />
              </div>
            </fieldset>
            <fieldset label="Lineare Veränderung der Eigenverbrauchsrate pro Jahr (auch negativ erlaubt z.B. -1%):">
              <div append="%">
                <input v-model.number="input.linearSelfUseRateChange" type="number" min="-10" max="10" />
              </div>
            </fieldset> -->
        </q-expansion-item>
      </q-expansion-item>
    </q-list>
    <div :show="isCalculating" rounded="sm">
      <div>
        <div>
          <div id="chartContainer">
            <Chart
              id="chart"
              v-if="displayData.length > 0"
              :labels="displayData.map((item) => item.size)"
              :datasets="[
                {
                  data: displayData.map((item) => item.selfUseRate),
                  yAxisID: 'y1',
                  label: 'Eigenverbrauchsquote',
                  borderColor: 'blue',
                },
                {
                  data: displayData.map((item) => item.selfSufficiencyRate),
                  yAxisID: 'y1',
                  label: 'Autarkiegrad',
                  borderColor: 'green',
                },
                {
                  data: displayData.map((item) => item.amortization),
                  yAxisID: 'y2',
                  label: 'Amortisation',
                  borderColor: 'red',
                },
              ]"
            />
          </div>
        </div>
      </div>

      <q-table
        v-if="displayData.length > 0"
        :rows="displayData"
        :columns="tableFields"
        row-key="size"
        :rows-per-page-options="[0]"
      >
        <template v-slot:body="props">
          <q-tr :props="props">
            <q-td v-for="col in props.cols" :key="col.name" :props="props">
              {{ col.value }}
            </q-td>
            <q-td auto-width>
              <q-btn
                size="sm"
                color="accent"
                round
                dense
                @click="props.expand = !props.expand"
                :icon="props.expand ? 'remove' : 'add'"
              />
            </q-td>
          </q-tr>
          <q-tr v-show="props.expand" :props="props">
            <q-td colspan="100%">
              <DetailsView :item="props.row" :roofs-data="roofsData" />
            </q-td>
          </q-tr>
        </template>

        <template v-slot:bottom>
          <!-- hide page select   -->
        </template>
      </q-table>
    </div>
    <FAQ />
    <NuxtLink to="/impress">Impressum / Datenschutz</NuxtLink>
  </div>
</template>

<script setup lang="ts">
// import Chart from '../components/Chart'
// import BarChart from '../components/BarChart'
// import FAQ from '../components/FAQ'
// import axios from "axios";
// import {
//   calculateConsumption,
//   generateDayTimeValues,
//   mergePowerGeneration,
//   normalizeHourlyRadiation,
//   energyFlow,
// } from '@/functions/energyFlow'
// import { factorFunction, PROFILEBASE, SLPH0 } from '@/functions/SLP'
// import {
//   convertConsumptionCSV,
//   createTemplateCsv,
//   createDataCsv,
// } from '@/functions/convertConsumptionUploads'
// import regressionDb from '@/functions/regression.json'
// import { ref, computed, onMounted, watch } from 'vue'

// const localStorage = {
//   getItem(name) {
//     return null
//   },
//   setItem(name, value) {
//     return null
//   },
// }

const displayData = ref([])
const expandedData = ref([])
const returnedData = ref({})
const tableFields = ref([
  {
    name: 'size',
    label: 'Speichergröße',
    field: 'size',
    format: (val, row) => val.toFixed(1) + ' kWh',
  },
  {
    name: 'selfUsedEnergy',
    label: 'Selbstgenutzter Strom / Jahr',
    field: 'selfUsedEnergy',
    format: (val, row) => val.toFixed(2) + ' kWh',
  },
  {
    name: 'fedInPower',
    label: 'Eingespeister Strom / Jahr',
    field: 'fedInPower',
    format: (val, row) => val.toFixed(2) + ' kWh',
  },
  {
    name: 'selfUseRate',
    label: 'Eigenverbrauchsquote',
    field: 'selfUseRate',
    format: (val, row) => val.toFixed(2) + ' %',
  },
  {
    name: 'selfSufficiencyRate',
    label: 'Autarkiegrad',
    field: 'selfSufficiencyRate',
    format: (val, row) => val.toFixed(2) + ' %',
  },
  {
    name: 'costSavingsBattery',
    label: 'Ersparnis / Jahr durch Akku',
    field: 'costSavingsBattery',
    format: (val, row) => val.toFixed(2) + ' €',
  },
  {
    name: 'batteryAmortization',
    label: 'Amortisation nur Speicher',
    field: 'batteryAmortization',
    format: (val, row) => val.toFixed(2) + ' Jahre',
  },
  {
    name: 'costSavings',
    label: 'Ersparnis / Jahr Anlage',
    field: 'costSavings',
    format: (val, row) => val.toFixed(2) + ' €',
  },
  {
    name: 'amortization',
    label: 'Amortisation Anlage',
    field: 'amortization',
    format: (val, row) => val.toFixed(2) + ' Jahre',
  },
  { name: 'data-table-expand', label: 'Weitere Details' },
])

const inputBatterySizes = ref<number[]>([])
const batterySizes = ref<number[]>(
  JSON.parse(localStorage.getItem('storedSizes')) || [
    500, 1000, 2000, 4000, 6000, 8000, 12000, 16000, 20000, 25000, 30000,
  ]
)

interface Roof {
  aspect: number
  angle: number
  peakpower: number
  length: number
}

interface InputPV {
  roofs: Roof[]
  yearlyConsumption: number
  consumptionProfile: number
  consumptionCosts: number
  feedInCompensation: number
  installationCostsWithoutBattery: number
  batteryCostsPerKwh: number
  systemloss: number
  batteryLoadEfficiency: number
  batteryUnloadEfficiency: number
  batterySocMinPercent: number
  year: number
  maxPowerGenerationInverter: number
  maxPowerGenerationBattery: number
  maxPowerLoadBattery: number
  maxPowerFeedIn: number
  amortizationYears: number
  linearDegrationModules: number
  linearConsumptionChange: number // negative = less need
  linearConsumptionCostsChange: number
  linearSelfUseRateChange: number
}

interface Adress {
  lat: number
  lon: number
}

const input = ref<InputPV>(
  JSON.parse(localStorage.getItem('storedInput')) || {
    roofs: [],
    yearlyConsumption: 5000,
    consumptionProfile: 0,
    consumptionCosts: 0.32,
    feedInCompensation: 0.086,
    installationCostsWithoutBattery: 10000,
    batteryCostsPerKwh: 500,
    systemloss: 12,
    batteryLoadEfficiency: 99,
    batteryUnloadEfficiency: 99,
    batterySocMinPercent: 10,
    year: 2015,
    maxPowerGenerationInverter: 5000,
    maxPowerGenerationBattery: 0,
    maxPowerLoadBattery: 0,
    maxPowerFeedIn: 0,
    amortizationYears: 20,
    linearDegrationModules: 0.5,
    linearConsumptionChange: 0.5, // negative = less need
    linearConsumptionCostsChange: 0,
    linearSelfUseRateChange: 0,
  }
)
const timeNeeded = ref(0)
const isCalculating = ref(false)
const needFetch = ref(true)
const mergedPower = ref([])
const roofInput = ref({
  aspect: 0,
  angle: 0,
  peakpower: 0,
  length: 0,
})
// CSV Import
const useImportData = ref(false)
interface ConsumptionObject {
  P: number
}
const importConsumptionData = ref<Record<string, ConsumptionObject> | null>({})
const importCsvErrorMessage = ref(null)
const roofsData = ref<Roof[]>([])
const inputAddressSearchString = ref(
  localStorage.getItem('storedInputAddressSearchString') || ''
)
const adressData = ref<Adress | Object>({})

onMounted(() => {
  adressData.value = JSON.parse(localStorage.getItem('storedAddress')) || {}
})
const costSavingsWithoutBattery = ref(0)
const screenHeight = ref(0)
const years = ref([
  { value: 2020, text: '2020' },
  { value: 2019, text: '2019' },
  { value: 2018, text: '2018' },
  { value: 2017, text: '2017' },
  { value: 2016, text: '2016' },
  { value: 2015, text: '2015' },
])

const inputCollapse = ref(true)
const extensionsCollapse = ref(false)

function showDetails(item) {}

async function generateData() {
  if (localStorage /* function to detect if localstorage is supported*/) {
    localStorage.setItem('storedInput', JSON.stringify(input.value))
    localStorage.setItem(
      'storedInputAddressSearchString',
      inputAddressSearchString.value
    )
    localStorage.setItem('storedSizes', JSON.stringify(batterySizes.value))
    localStorage.setItem('storedAddress', JSON.stringify(adressData.value))
  }

  inputBatterySizes.value = [...batterySizes.value]

  let now = performance.now()

  isCalculating.value = true

  if (needFetch.value) {
    roofsData.value = []

    const generationData = await Promise.all(
      input.value.roofs.map((roof) => {
        return $fetch('/api/pvgis', {
          method: 'POST',
          body: {
            url: buildQueryString({
              aspect: roof.aspect,
              angle: roof.angle,
              lat: adressData.value.lat,
              lon: adressData.value.lon,
              peakpower: roof.peakpower / 1000,
              loss: input.value.systemloss,
              startyear: input.value.year,
              endyear: input.value.year,
            }),
          },
        }).then((data) => {
          const normData = normalizeHourlyRadiation(data)
          const generationYear =
            Object.values(normData).reduce((prev, curr) => prev + curr.P, 0) /
            1000
          roofsData.value.push({ ...roof, generationYear })
          return normData
        })
      })
    )

    mergedPower.value = mergePowerGeneration(generationData)
    needFetch.value = false
  }
  const consumption = useImportData.value
    ? importConsumptionData.value
    : calculateConsumption({
        year: input.value.year,
        consumptionYear: input.value.yearlyConsumption,
        profile: SLPH0,
        profileBase: PROFILEBASE,
        factorFunction,
      })
  const powerGenAndConsumption = generateDayTimeValues({
    consumption,
    powerGeneration: mergedPower.value,
    year: input.value.year,
  })

  let costSavingWithoutBattery = 0

  const batterySizesWithNoBattery = [1, ...batterySizes.value]

  let BatterySizeResults = batterySizesWithNoBattery.map((size) => {
    const minSocWithoutBattery = 1
    let newSoc =
      size == 1
        ? minSocWithoutBattery
        : (size * input.value.batterySocMinPercent) / 100

    let energyFlowData = powerGenAndConsumption.map((genConsumption) => {
      const energyFlowObj = {
        energyGeneration: genConsumption.P,
        energyConsumption: genConsumption.consumption,
        batterySoc: newSoc,
        batterySocMax: size, // * input.value.batterySocMaxPercent / 100,
        batterySocMin:
          size == 1
            ? minSocWithoutBattery
            : (size * input.value.batterySocMinPercent) / 100,
        batteryLoadEfficiency: input.value.batteryLoadEfficiency / 100,
        batteryUnloadEfficiency: input.value.batteryUnloadEfficiency / 100,
        dayTime: genConsumption.dayTime,
        regressionDb: regressionDb,
        maxPowerGenerationInverter: 0,
        maxPowerGenerationBattery: 0,
        maxPowerLoadBattery: 0,
        maxPowerFeedIn: 0,
      }
      if (
        input.value.maxPowerGenerationInverter &&
        input.value.maxPowerGenerationInverter > 0
      )
        energyFlowObj.maxPowerGenerationInverter =
          input.value.maxPowerGenerationInverter
      if (
        input.value.maxPowerGenerationBattery &&
        input.value.maxPowerGenerationBattery > 0
      )
        energyFlowObj.maxPowerGenerationBattery =
          input.value.maxPowerGenerationBattery
      if (
        input.value.maxPowerLoadBattery &&
        input.value.maxPowerLoadBattery > 0
      )
        energyFlowObj.maxPowerLoadBattery = input.value.maxPowerLoadBattery
      if (input.value.maxPowerFeedIn && input.value.maxPowerFeedIn > 0)
        energyFlowObj.maxPowerFeedIn = input.value.maxPowerFeedIn

      const hourFlow = energyFlow(energyFlowObj)
      newSoc = hourFlow.newBatterySoc
      return hourFlow
    })

    const generationYear =
      energyFlowData.reduce((prev, curr) => curr.powerProduction + prev, 0) /
      1000
    const consumptionYear =
      energyFlowData.reduce((prev, curr) => curr.energyConsumption + prev, 0) /
      1000
    const gridUsedEnergy =
      energyFlowData.reduce((prev, curr) => curr.gridUsedEnergy + prev, 0) /
      1000
    const missedBatteryPower =
      energyFlowData.reduce(
        (prev, curr) =>
          curr.lossesUnloadBattery + curr.lossesLoadBattery + prev,
        0
      ) / 1000
    const missedFeedInPowerGrid =
      energyFlowData.reduce(
        (prev, curr) => curr.missedFeedInPowerGrid + prev,
        0
      ) / 1000
    const missedInverterPower =
      energyFlowData.reduce(
        (prev, curr) => curr.missedInverterPower + prev,
        0
      ) / 1000
    const lossesPvGeneration =
      energyFlowData.reduce((prev, curr) => curr.lossesPvGeneration + prev, 0) /
      1000
    const selfUsedEnergy =
      energyFlowData.reduce((prev, curr) => curr.selfUsedEnergy + prev, 0) /
      1000
    const fedInPower =
      energyFlowData.reduce((prev, curr) => curr.feedInEnergyGrid + prev, 0) /
      1000
    const selfSufficiencyRate = (selfUsedEnergy / consumptionYear) * 100 // Autarkiegrad
    const selfUseRate = (selfUsedEnergy / generationYear) * 100 // Eigenverbrauchsquote
    const costSavings =
      selfUsedEnergy * input.value.consumptionCosts +
      fedInPower * input.value.feedInCompensation
    if (size == 1) costSavingWithoutBattery = costSavings
    const amortization =
      (input.value.installationCostsWithoutBattery +
        input.value.batteryCostsPerKwh * (size / 1000)) /
      costSavings
    const costSavingsBattery =
      size == 1 ? 0 : costSavings - costSavingWithoutBattery
    const batteryAmortization =
      size == 1
        ? 0
        : (input.value.batteryCostsPerKwh * (size / 1000)) / costSavingsBattery

    interface MonthlyDataObj {
      batteryLoad: number
      gridUsedEnergy: number
      feedInEnergyGrid: number
      missedBatteryPower: number
      missedFeedInPowerGrid: number
      missedInverterPower: number
      lossesPvGeneration: number
      selfUsedEnergy: number
      selfUsedEnergyBattery: number
      selfUsedEnergyPV: number
    }

    const monthlyDataObj = energyFlowData.reduce((prev, curr) => {
      const month = parseInt(curr.dayTime.slice(4, 6))
      if (prev[month]) {
        prev[month] = {
          batteryLoad:
            curr.batteryLoad <= 0
              ? curr.batteryLoad * -1 + prev[month].batteryLoad
              : curr.batteryLoad + prev[month].batteryLoad,
          gridUsedEnergy: curr.gridUsedEnergy + prev[month].gridUsedEnergy,
          feedInEnergyGrid:
            curr.feedInEnergyGrid + prev[month].feedInEnergyGrid,
          missedBatteryPower:
            curr.missedBatteryPower + prev[month].missedBatteryPower,
          missedFeedInPowerGrid:
            curr.missedFeedInPowerGrid + prev[month].missedFeedInPowerGrid,
          missedInverterPower:
            curr.missedInverterPower + prev[month].missedInverterPower,
          lossesPvGeneration:
            curr.lossesPvGeneration + prev[month].lossesPvGeneration,
          selfUsedEnergy: curr.selfUsedEnergy + prev[month].selfUsedEnergy,
          selfUsedEnergyBattery:
            curr.selfUsedEnergyBattery + prev[month].selfUsedEnergyBattery,
          selfUsedEnergyPV:
            curr.selfUsedEnergyPV + prev[month].selfUsedEnergyPV,
        }
      } else {
        prev[month] = {
          batteryLoad:
            curr.batteryLoad <= 0 ? curr.batteryLoad * -1 : curr.batteryLoad,
          gridUsedEnergy: curr.gridUsedEnergy,
          feedInEnergyGrid: curr.feedInEnergyGrid,
          missedBatteryPower: curr.missedBatteryPower,
          missedFeedInPowerGrid: curr.missedFeedInPowerGrid,
          missedInverterPower: curr.missedInverterPower,
          lossesPvGeneration: curr.lossesPvGeneration,
          selfUsedEnergy: curr.selfUsedEnergy,
          selfUsedEnergyBattery: curr.selfUsedEnergyBattery,
          selfUsedEnergyPV: curr.selfUsedEnergyPV,
        }
      }
      return prev
    }, {})

    const yearlyData = new Array(input.value.amortizationYears)
      .fill(undefined)
      .map((val, i) => i)
      .map((val) => {
        const conYear =
          (consumptionYear *
            (100 + input.value.linearConsumptionChange * val)) /
          100
        // var suRate = selfUseRate * (100 + input.value.linearSelfUseRateChange * val)/100
        var suRate =
          selfUseRate * (input.value.linearSelfUseRateChange / 100 + 1) ** val
        const suPower = (generationYear * suRate) / 100
        const conCosts =
          input.value.consumptionCosts *
          ((100 + input.value.linearConsumptionCostsChange * val) / 100)
        const fedIn = generationYear - suPower
        return {
          year: val,
          generationYear:
            (generationYear *
              (100 - input.value.linearDegrationModules * val)) /
            100,
          consumptionYear: conYear,
          selfUsedEnergy: suPower,
          fedInPower: fedIn,
          selfSufficiencyRate: (suPower / conYear) * 100,
          selfUsedRate: selfUseRate,
          consumptionCosts: conCosts,
          costSavings:
            suPower * conCosts + fedIn * input.value.feedInCompensation,
        }
      })

    const monthlyData = Object.keys(monthlyDataObj)
      .map((key) => {
        monthlyDataObj[key].month = parseInt(key)
        return monthlyDataObj[key]
      })
      .sort((a, b) => a.month - b.month)

    console.log(energyFlowData)
    return {
      size,
      energyFlow: energyFlowData,
      generationYear,
      consumptionYear,
      selfUsedEnergy,
      fedInPower,
      missedBatteryPower,
      missedFeedInPowerGrid,
      missedInverterPower,
      lossesPvGeneration,
      gridUsedEnergy,
      selfSufficiencyRate,
      selfUseRate,
      costSavings,
      amortization,
      costSavingsBattery,
      batteryAmortization,
      monthlyData,
      yearlyData,
      // regressionEnergyFlow
    }
  })

  timeNeeded.value = performance.now() - now
  isCalculating.value = false
  displayData.value = BatterySizeResults
}

async function getCoordinatesByAddress() {
  let osmReturn = await $fetch('/api/osm', {
    method: 'POST',
    body: {
      url:
        'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=' +
        encodeURIComponent(inputAddressSearchString.value),
    },
  })

  if (!osmReturn) {
    adressData.value = 'no_address'
    console.log('Detected Wrong')
  } else {
    adressData.value = osmReturn
    inputAddressSearchString.value = adressData.value.display_name
  }
}

function buildQueryString(params) {
  //API BaseURL with Base Params
  // let string = `https://re.jrc.ec.europa.eu/api/v5_2/SHScalc?outputformat=json&raddatabase=PVGIS-SARAH&cutoff=1`

  const loss = params.loss || 12
  const lat = params.lat
  const lon = params.lon
  const startyear = params.startyear || params.year || 2020
  const endyear = params.endyear || params.year || 2020
  const peakpower = params.peakpower
  const angle = params.angle
  const aspect = params.aspect

  let string = `https://re.jrc.ec.europa.eu/api/v5_2/seriescalc?pvcalculation=1&outputformat=json&loss=${loss}&lat=${lat}&lon=${lon}&startyear=${startyear}&endyear=${endyear}&peakpower=${peakpower}&angle=${angle}&aspect=${aspect}`

  return string
}

function resetValues() {
  localStorage.clear()
  location.reload()
}

function tagValidator(tag: number) {
  return !isNaN(tag) && tag <= 2000000 && tag >= 200
}

function removeRoof(roof: Roof) {
  input.value.roofs = input.value.roofs.filter(
    (roofEntry) =>
      !(
        roof.aspect == roofEntry.aspect &&
        roof.angle == roofEntry.angle &&
        roof.peakpower == roofEntry.peakpower
      )
  )
  // needFetch = true
}

function addRoof(e) {
  input.value.roofs.push(roofInput.value)
  roofInput.value = {
    aspect: 0,
    angle: 0,
    peakpower: 0,
    length: 0,
  }
  // needFetch = true
}

function editRoof(aspect: number, angle: number, peakpower: number) {
  roofInput.value.aspect = aspect
  roofInput.value.angle = angle
  roofInput.value.peakpower = peakpower
  input.value.roofs = input.value.roofs.filter(
    (roofEntry) =>
      !(
        aspect == roofEntry.aspect &&
        angle == roofEntry.angle &&
        peakpower == roofEntry.peakpower
      )
  )
}

function downloadCsvTemplate() {
  const filename = 'verbrauch_' + input.value.year + '.csv'
  const data = createTemplateCsv(input.value.year)
  downloadCsv({ data, filename })
}

function downloadCsv({ data, filename, type = 'text/plan' }) {
  const file = new File([data], filename, { type })
  const blobUrl = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  document.body.appendChild(link)

  link.dispatchEvent(
    new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      view: window,
    })
  )

  document.body.removeChild(link)
}

function uploadCsvData() {
  const fr = new FileReader()
  fr.readAsText(csvFile)
  fr.onload = () => {
    try {
      importConsumptionData.value = convertConsumptionCSV(
        fr.result,
        input.value.year
      )
      useImportData.value = true
    } catch (e) {
      console.log(e.message)
      importCsvErrorMessage.value = e.message
      console.log(importCsvErrorMessage.value)
      setTimeout(() => {
        importCsvErrorMessage.value = null
        importConsumptionData.value = null
        useImportData.value = false
      }, 3000)
    }
  }
}

function deleteCsvFile() {
  useImportData.value = false
  importConsumptionData.value = null
}

const state = computed(() => {
  // Overall component validation state
  return true
})

onMounted(() => {
  screenHeight.value = window.screen.height

  inputBatterySizes.value = [...batterySizes.value]
})

// watch(inputBatterySizes(newValue) {
//       batterySizes = newValue
//         .map((val) => Number(val))
//         .sort((a, b) => a - b)
//     },
//     'input.value.systemloss'() {
//       needFetch = true
//     },
//     'input.value.year'() {
//       needFetch = true
//     },
//     'input.value.roofs'() {
//       needFetch = true
//     },
//     inputAddressSearchString.value() {
//       needFetch = true
//     },
//     {deep: true})
</script>

<style>
#chart {
  max-height: 50vh;
}

table {
  width: 90vw;
}

th,
td {
  border: 1px solid black;
}

th {
  vertical-align: top;
}

td {
  text-align: right;
}

#tableContainer {
  overflow-x: scroll;
}

#chartContainer {
  max-width: 100vw;
  max-height: 50vh;
}

.paypal {
  margin-top: 10px;
}
.div-details canvas {
  max-width: 100%;
  max-height: 40vh;
}
</style>
