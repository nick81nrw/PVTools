/**
 * Economics of the battery: price per size, the benefit of every additional
 * battery step and the recommendation.
 *
 * The important distinction: the payback of a whole battery (compared with no
 * battery) can look good although the last kWh hardly bring anything. So every
 * extension, e.g. from 10 to 15 kWh, is judged on its own:
 *
 *   extra savings per year = less grid energy × electricity price
 *                            − less feed-in × feed-in compensation
 *   payback of the extension = extra costs / extra savings per year
 *
 * Sizes are in Wh, 1 Wh is used internally for "no battery".
 */
import { NOT_PAYING_BACK } from '../lib/format.js'

export const DEFAULT_BATTERY_LIFETIME = 15

/**
 * Rating of an investment by its payback time, compared with the expected
 * lifetime of the battery:
 *   yes        pays back within 2/3 of the lifetime (default: 10 years)
 *   borderline pays back within the lifetime (10–15 years)
 *   no         pays back later or never
 */
export const ratingLimits = (lifetime = DEFAULT_BATTERY_LIFETIME) => ({
  yes: (lifetime * 2) / 3,
  borderline: lifetime,
})

export const rate = (payback, lifetime) => {
  const limits = ratingLimits(lifetime)
  if (!(Number.isFinite(payback) && payback >= 0)) return 'no'
  if (payback <= limits.yes) return 'yes'
  if (payback <= limits.borderline) return 'borderline'
  return 'no'
}

/** price of a battery in €. Own offers (input.batteryPriceMode 'offers') win */
export const batteryPrice = (sizeWh, input) => {
  if (!(sizeWh > 1)) return 0
  const kwh = sizeWh / 1000
  const offers = validOffers(input)
  if (input.batteryPriceMode === 'offers' && offers.length) {
    return interpolatePrice(kwh, offers)
  }
  return (
    Math.max(Number(input.batteryBaseCosts) || 0, 0) +
    Math.max(Number(input.batteryCostsPerKwh) || 0, 0) * kwh
  )
}

/** offers with a size and a price, sorted by size, one per size */
export const validOffers = (input) => {
  const bySize = new Map()
  for (const offer of input.batteryOffers || []) {
    const kwh = Number(offer.kwh)
    const price = Number(offer.price)
    if (kwh > 0 && price >= 0) bySize.set(kwh, price)
  }
  return [...bySize.entries()]
    .map(([kwh, price]) => ({ kwh, price }))
    .sort((a, b) => a.kwh - b.kwh)
}

/** battery sizes in Wh that are compared when own offers are used */
export const offerSizes = (input) =>
  validOffers(input).map((offer) => Math.round(offer.kwh * 1000))

/**
 * Price for a size between the offers: linear between the neighbours, below
 * the smallest offer proportional to it, above the largest one with the slope
 * of the last two offers.
 */
const interpolatePrice = (kwh, offers) => {
  const exact = offers.find((offer) => offer.kwh === kwh)
  if (exact) return exact.price
  const first = offers[0]
  if (kwh < first.kwh) return (first.price * kwh) / first.kwh
  const upper = offers.findIndex((offer) => offer.kwh > kwh)
  const [a, b] =
    upper === -1
      ? offers.length > 1
        ? offers.slice(-2)
        : [{ kwh: 0, price: 0 }, first]
      : [offers[upper - 1], offers[upper]]
  return Math.max(
    a.price + ((b.price - a.price) * (kwh - a.kwh)) / (b.kwh - a.kwh),
    0,
  )
}

/** payback time in years, Infinity if the savings are not positive */
const payback = (costs, savings) =>
  savings > 0 && Number.isFinite(costs)
    ? Math.max(costs, 0) / savings
    : Infinity

/**
 * Compares two simulation results (from → to).
 * @return {Object} step with energies in kWh/a, money in € and €/a
 */
export const compareSizes = (from, to, input) => {
  const extraCosts =
    batteryPrice(to.size, input) - batteryPrice(from.size, input)
  const extraSavings = to.costSavings - from.costSavings
  const paybackYears = payback(extraCosts, extraSavings)
  return {
    from: from.size,
    to: to.size,
    extraCosts,
    lessGrid: from.gridUsedEnergy - to.gridUsedEnergy,
    lessFeedIn: from.fedInPower - to.fedInPower,
    extraSavings,
    payback: paybackYears,
    rating: rate(paybackYears, input.batteryLifetime),
  }
}

/** one step per neighbouring sizes: no battery → first size → second size … */
export const batterySteps = (sizes, input) =>
  sizes.slice(1).map((to, i) => compareSizes(sizes[i], to, input))

/**
 * Recommended size: starting without battery, go to the next larger size
 * whose extension rates "yes". A size may be skipped when only the larger
 * step pays back (e.g. because of base costs).
 *
 * @return {Object} size: recommended size in Wh (1 = no battery),
 *   path: the steps to it, next: the step to the next larger size (or null)
 */
export const recommendBattery = (sizes, input) => {
  let current = sizes[0]
  const path = []
  for (;;) {
    const larger = sizes.filter((item) => item.size > current.size)
    const step = larger
      .map((item) => compareSizes(current, item, input))
      .find((candidate) => candidate.rating === 'yes')
    if (!step) {
      return {
        size: current.size,
        path,
        next: larger.length ? compareSizes(current, larger[0], input) : null,
      }
    }
    path.push(step)
    current = larger.find((item) => item.size === step.to)
  }
}

const numberText = (value) =>
  new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value)
const kwhText = (value) => `${numberText(value)} kWh`
const sizeText = (sizeWh) => kwhText(sizeWh / 1000)
const energyText = (value) =>
  `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(Math.max(value, 0))} kWh`
const yearsText = (value) =>
  Number.isFinite(value)
    ? `${new Intl.NumberFormat('de-DE', { maximumFractionDigits: 1 }).format(value)} Jahren`
    : null

/** short verdict of a step, e.g. "amortisiert sich nach 7,5 Jahren" */
export const verdictText = (step, plural = false) => {
  if (!Number.isFinite(step.payback))
    return `${plural ? 'sind' : 'ist'} ${NOT_PAYING_BACK}`
  const after = `amortisier${plural ? 'en' : 't'} sich nach ${yearsText(step.payback)}`
  if (step.rating === 'yes') return after
  if (step.rating === 'borderline') return `${after} – ein Grenzfall`
  return `${after} und damit nicht innerhalb der Lebensdauer`
}

/**
 * The recommendation in words, e.g. "Die ersten 5 kWh Speicher sparen
 * 1.200 kWh Netzbezug im Jahr. Weitere 2,5 kWh bringen noch 550 kWh. Die
 * Erweiterung von 7,5 auf 10 kWh bringt nur noch 140 kWh und …"
 */
export const recommendationSentences = ({ path, next }) => {
  const sentences = []
  if (!path.length) {
    if (!next) return ['Es wurden keine Speichergrößen berechnet.']
    sentences.push(
      `Ein Speicher lohnt sich bei deinen Preisen nicht: Die ersten ${sizeText(next.to)} sparen ${energyText(next.lessGrid)} Netzbezug im Jahr und ${verdictText(next, true)}.`,
    )
    return sentences
  }
  path.forEach((step, i) => {
    sentences.push(
      i === 0
        ? `Die ersten ${sizeText(step.to)} Speicher sparen ${energyText(step.lessGrid)} Netzbezug im Jahr und ${verdictText(step, true)}.`
        : `Weitere ${sizeText(step.to - step.from)} (auf ${sizeText(step.to)}) bringen noch ${energyText(step.lessGrid)} und ${verdictText(step, true)}.`,
    )
  })
  if (next) {
    sentences.push(
      `Die Erweiterung von ${numberText(next.from / 1000)} auf ${sizeText(next.to)} bringt nur noch ${energyText(next.lessGrid)} und ${verdictText(next)}.`,
    )
  } else {
    sentences.push('Größere Speicher wurden nicht berechnet.')
  }
  return sentences
}
