import { computed, reactive, ref, shallowRef, watch } from 'vue'

import { fetchGeneration, geocode, PVGIS_LAST_YEAR } from '../lib/api.js'
import {
  analyzeConsumptionCsv,
  buildConsumption,
} from '../functions/consumptionImport.js'
import {
  DEFAULT_HOUR_MODEL,
  getHourModel,
} from '../functions/hourModels/index.js'
import { resolveLimits } from '../functions/simulation.js'

// the storage keys and shapes are kept from the previous version, so saved
// inputs survive the update
const KEYS = {
  input: 'storedInput',
  sizes: 'storedSizes',
  address: 'storedAddress',
  query: 'storedInputAddressSearchString',
}

export const DEFAULT_INPUT = {
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
  year: 2020,
  // 'auto' = installed PV power, 'manual' = maxPowerGenerationInverter, 'none'
  inverterMode: 'auto',
  maxPowerGenerationInverter: 5000,
  maxPowerGenerationBattery: 0,
  maxPowerLoadBattery: 0,
  // 'none' | 'watt' (maxPowerFeedIn) | 'percent' (of the PV power) | 'zero'
  feedInMode: 'none',
  maxPowerFeedIn: 0,
  feedInPercent: 60,
  // how one hour is calculated, see functions/hourModels/index.js
  hourModel: DEFAULT_HOUR_MODEL,
  amortizationYears: 20,
  linearDegrationModules: 0.5,
  linearConsumptionChange: 0.5, // negative = less need
  linearConsumptionCostsChange: 0,
  linearSelfUseRateChange: 0,
}

export const DEFAULT_SIZES = [
  500, 1000, 2000, 4000, 6000, 8000, 12000, 16000, 20000, 25000, 30000,
]

const load = (key, fallback) => {
  try {
    const value = JSON.parse(localStorage.getItem(key))
    return value ?? fallback
  } catch {
    return fallback
  }
}

const save = (key, value) => {
  try {
    localStorage.setItem(
      key,
      typeof value === 'string' ? value : JSON.stringify(value),
    )
  } catch {}
}

const validAddress = (address) =>
  address && typeof address === 'object' && address.lat && address.lon
    ? address
    : null

/**
 * Inputs saved by older versions have no limit modes. 5000 W was a hidden
 * default for the inverter power, so it becomes "automatic"; 0 W meant
 * "no limit" for both values.
 */
const migrateInput = (stored) => {
  const migrated = { ...stored }
  if (stored.maxPowerGenerationInverter !== undefined && !stored.inverterMode) {
    const power = Number(stored.maxPowerGenerationInverter) || 0
    migrated.inverterMode =
      power === 5000 ? 'auto' : power > 0 ? 'manual' : 'none'
  }
  if (stored.maxPowerFeedIn !== undefined && !stored.feedInMode) {
    migrated.feedInMode = Number(stored.maxPowerFeedIn) > 0 ? 'watt' : 'none'
  }
  return migrated
}

// --- state (module level, shared by all components) ---
const input = reactive({
  ...DEFAULT_INPUT,
  ...migrateInput(load(KEYS.input, {})),
})
const batterySizes = ref(load(KEYS.sizes, DEFAULT_SIZES))
const address = ref(validAddress(load(KEYS.address, null)))
const addressQuery = ref(
  (() => {
    try {
      return localStorage.getItem(KEYS.query) || ''
    } catch {
      return ''
    }
  })(),
)

const consumptionMode = ref('profile') // 'profile' | 'csv'
const csvImport = shallowRef(null) // { fileName, analysis }
const fillMethod = ref('interpolate')

const status = ref('idle') // 'idle' | 'geocoding' | 'fetching' | 'simulating'
const error = ref(null)
const addressNotFound = ref(false)
const results = shallowRef(null)
const selectedSize = ref(null)
let lastSignature = null
let generationCache = { key: null }

watch(input, (value) => save(KEYS.input, value), { deep: true })
watch(batterySizes, (value) => save(KEYS.sizes, value), { deep: true })
watch(address, (value) => save(KEYS.address, value || {}))
watch(addressQuery, (value) => save(KEYS.query, value))

// --- derived state ---
const totalPeakPower = computed(() =>
  input.roofs.reduce((sum, roof) => sum + Number(roof.peakpower || 0), 0),
)

/** hourly consumption from the CSV file, mapped onto the weather year */
const importedConsumption = computed(() => {
  const analysis = csvImport.value?.analysis
  if (!analysis || analysis.errors.length) return null
  return {
    fileName: csvImport.value.fileName,
    year: analysis.year,
    data: buildConsumption(analysis, input.year, fillMethod.value),
  }
})

const limits = computed(() => resolveLimits(input))

const missing = computed(() => {
  const list = []
  if (!address.value) list.push('Standort')
  if (!input.roofs.length) list.push('Dachfläche')
  if (consumptionMode.value === 'csv' && !importedConsumption.value)
    list.push('Verbrauchsdatei')
  return list
})

const canCalculate = computed(
  () => !missing.value.length && status.value === 'idle',
)

const signature = () =>
  JSON.stringify([
    input,
    batterySizes.value,
    address.value,
    consumptionMode.value,
    csvImport.value?.fileName,
    fillMethod.value,
  ])

// signature() reads all inputs, so this updates whenever one of them changes
const isStale = computed(
  () => Boolean(results.value) && signature() !== lastSignature,
)

/**
 * battery size with the shortest payback time of the whole system,
 * null if no variant pays back
 */
const recommendedSize = computed(() => {
  if (!results.value) return null
  const best = results.value.sizes
    .filter((item) => Number.isFinite(item.amortization))
    .sort((a, b) => a.amortization - b.amortization)[0]
  return best ? best.size : null
})

const selected = computed(() =>
  results.value?.sizes.find((item) => item.size === selectedSize.value),
)

const baseline = computed(() => results.value?.sizes[0])

// --- actions ---
async function searchAddress() {
  const query = addressQuery.value.trim()
  if (!query) return
  status.value = 'geocoding'
  error.value = null
  addressNotFound.value = false
  try {
    const found = await geocode(query)
    if (found) {
      address.value = found
    } else {
      addressNotFound.value = true
    }
  } catch (e) {
    console.error(e)
    error.value =
      'Die Adresssuche ist fehlgeschlagen. Bitte versuche es später erneut.'
  } finally {
    status.value = 'idle'
  }
}

async function importCsv(file) {
  const analysis = analyzeConsumptionCsv(await file.text())
  csvImport.value = { fileName: file.name, analysis }
  consumptionMode.value = 'csv'
}

function discardCsv() {
  csvImport.value = null
}

const runWorker = (payload) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL('../functions/simulation.worker.js', import.meta.url),
      { type: 'module' },
    )
    worker.onmessage = ({ data }) => {
      worker.terminate()
      data.error ? reject(new Error(data.error)) : resolve(data)
    }
    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'Simulation fehlgeschlagen'))
    }
    worker.postMessage(payload)
  })

async function calculate() {
  if (!canCalculate.value) return
  error.value = null
  const startedAt = performance.now()
  const params = {
    roofs: input.roofs.map(({ aspect, angle, peakpower }) => ({
      aspect,
      angle,
      peakpower,
    })),
    lat: address.value.lat,
    lon: address.value.lon,
    loss: input.systemloss,
    year: input.year,
  }
  const key = JSON.stringify(params)
  const calcSignature = signature()

  try {
    if (generationCache.key !== key) {
      status.value = 'fetching'
      generationCache = { key, ...(await fetchGeneration(params)) }
    }
    status.value = 'simulating'
    const plainInput = JSON.parse(JSON.stringify(input))
    const { results: sizes, hours } = await runWorker({
      mergedPower: generationCache.mergedPower,
      importedConsumption:
        consumptionMode.value === 'csv' ? importedConsumption.value.data : null,
      input: plainInput,
      batterySizes: [...batterySizes.value],
    })
    results.value = Object.freeze({
      sizes,
      roofsData: generationCache.roofsData,
      meta: {
        location: address.value.shortName || address.value.display_name,
        year: plainInput.year,
        peakPower: totalPeakPower.value,
        consumption: sizes[0].consumptionYear,
        hours,
        hourModel: getHourModel(plainInput.hourModel),
        duration: performance.now() - startedAt,
      },
    })
    lastSignature = calcSignature
    selectedSize.value = recommendedSize.value ?? sizes[0].size
    if (sizes.some((item) => !item.balance.ok)) {
      console.error(sizes.map((item) => item.balance))
      error.value =
        'Die Energiebilanz der Simulation geht nicht auf. Die Ergebnisse sind vermutlich fehlerhaft – bitte melde das mit deinen Eingaben auf GitHub.'
    }
  } catch (e) {
    console.error(e)
    const upstream = e.response?.data?.message
    error.value =
      status.value === 'fetching'
        ? 'Die PV-Erzeugungsdaten konnten nicht von PVGIS abgerufen werden' +
          (upstream ? `: ${upstream}` : '. Bitte versuche es später erneut.')
        : `Die Berechnung ist fehlgeschlagen: ${e.message}`
  } finally {
    status.value = 'idle'
  }
}

function reset() {
  try {
    Object.values(KEYS).forEach((key) => localStorage.removeItem(key))
  } catch {}
  location.reload()
}

export function useCalculator() {
  return {
    input,
    batterySizes,
    address,
    addressQuery,
    addressNotFound,
    consumptionMode,
    csvImport,
    fillMethod,
    importedConsumption,
    limits,
    status,
    error,
    results,
    selectedSize,
    selected,
    baseline,
    recommendedSize,
    totalPeakPower,
    missing,
    canCalculate,
    isStale,
    lastYear: PVGIS_LAST_YEAR,
    searchAddress,
    importCsv,
    discardCsv,
    calculate,
    reset,
  }
}
