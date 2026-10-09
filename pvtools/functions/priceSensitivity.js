/**
 * Price sensitivity: how do savings and the recommendation change with other
 * prices? The energy flows do not depend on prices, so no new simulation is
 * needed – only the money is recalculated:
 *
 *   savings = self used energy × electricity price
 *             + fed in energy × feed-in compensation
 *
 * The battery price is scaled with a factor (1 = as entered), for the price
 * per kWh as well as for own offers.
 */
import {
  batteryPrice,
  batterySteps,
  recommendationSentences,
  recommendBattery,
} from './batteryEconomics.js'

/** input with other prices; factor scales every battery price */
export const withPrices = (
  input,
  { electricity, feedIn, batteryFactor = 1 },
) => ({
  ...input,
  consumptionCosts: electricity ?? input.consumptionCosts,
  feedInCompensation: feedIn ?? input.feedInCompensation,
  batteryBaseCosts: (Number(input.batteryBaseCosts) || 0) * batteryFactor,
  batteryCostsPerKwh: (Number(input.batteryCostsPerKwh) || 0) * batteryFactor,
  batteryOffers: (input.batteryOffers || []).map((offer) => ({
    ...offer,
    price: (Number(offer.price) || 0) * batteryFactor,
  })),
})

/** simulation results with savings and payback for other prices */
export const repriceSizes = (sizes, input) => {
  const savingsOf = (item) =>
    item.selfUsedEnergy * input.consumptionCosts +
    item.fedInPower * input.feedInCompensation
  const baseline = savingsOf(sizes[0])
  return sizes.map((item) => {
    const costSavings = savingsOf(item)
    const price = batteryPrice(item.size, input)
    const costSavingsBattery = item.size > 1 ? costSavings - baseline : 0
    return {
      ...item,
      costSavings,
      costSavingsBattery,
      batteryPrice: price,
      batteryAmortization:
        item.size > 1 && costSavingsBattery > 0
          ? price / costSavingsBattery
          : item.size > 1
            ? Infinity
            : 0,
    }
  })
}

/** recommendation, steps and sentences for other prices */
export const economicsFor = (sizes, input, prices) => {
  const priced = withPrices(input, prices)
  const repriced = repriceSizes(sizes, priced)
  const recommendation = recommendBattery(repriced, priced)
  return {
    sizes: repriced,
    steps: batterySteps(repriced, priced),
    recommendation,
    sentences: recommendationSentences(recommendation),
    recommended: repriced.find((item) => item.size === recommendation.size),
  }
}

/**
 * Recommended size for every combination of electricity price (rows) and
 * battery price factor (columns).
 * @return {Array<Array<number>>} sizes in Wh, 1 = no battery
 */
export const recommendationGrid = (
  sizes,
  input,
  electricityPrices,
  batteryFactors,
  feedIn,
) =>
  electricityPrices.map((electricity) =>
    batteryFactors.map((batteryFactor) => {
      const priced = withPrices(input, { electricity, feedIn, batteryFactor })
      return recommendBattery(repriceSizes(sizes, priced), priced).size
    }),
  )
