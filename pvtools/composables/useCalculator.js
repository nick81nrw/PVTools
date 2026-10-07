import { computed, reactive, ref, shallowRef, watch } from 'vue'

import { fetchGeneration, geocode, PVGIS_LAST_YEAR } from '../lib/api.js'
import { convertConsumptionCSV } from '../functions/convertConsumptionUploads.js'

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

// --- state (module level, shared by all components) ---
const input = reactive({ ...DEFAULT_INPUT, ...load(KEYS.input, {}) })
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
const importedConsumption = shallowRef(null) // { data, year, fileName }

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

const csvYearMismatch = computed(
  () =>
    consumptionMode.value === 'csv' &&
    importedConsumption.value &&
    importedConsumption.value.year !== input.year,
)

const missing = computed(() => {
  const list = []
  if (!address.value) list.push('Standort')
  if (!input.roofs.length) list.push('Dachfläche')
  if (consumptionMode.value === 'csv' && !importedConsumption.value)
    list.push('Verbrauchsdatei')
  return list
})

const canCalculate = computed(
  () =>
    !missing.value.length && !csvYearMismatch.value && status.value === 'idle',
)

const signature = () =>
  JSON.stringify([
    input,
    batterySizes.value,
    address.value,
    consumptionMode.value,
    importedConsumption.value?.fileName,
  ])

// signature() reads all inputs, so this updates whenever one of them changes
const isStale = computed(
  () => Boolean(results.value) && signature() !== lastSignature,
)

/** battery size with the shortest payback time of the whole system */
const recommendedSize = computed(() => {
  if (!results.value) return null
  return results.value.sizes.reduce((best, item) =>
    Number.isFinite(item.amortization) &&
    item.amortization > 0 &&
    item.amortization < best.amortization
      ? item
      : best,
  ).size
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
  const text = await file.text()
  try {
    const data = convertConsumptionCSV(text, input.year)
    importedConsumption.value = { data, year: input.year, fileName: file.name }
    consumptionMode.value = 'csv'
    return null
  } catch (e) {
    importedConsumption.value = null
    return e.message
  }
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
        duration: performance.now() - startedAt,
      },
    })
    lastSignature = calcSignature
    selectedSize.value = recommendedSize.value
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
    importedConsumption,
    status,
    error,
    results,
    selectedSize,
    selected,
    baseline,
    recommendedSize,
    totalPeakPower,
    csvYearMismatch,
    missing,
    canCalculate,
    isStale,
    lastYear: PVGIS_LAST_YEAR,
    searchAddress,
    importCsv,
    calculate,
    reset,
  }
}
