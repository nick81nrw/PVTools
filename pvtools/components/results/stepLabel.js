import { num } from '../../lib/format.js'

const size = (sizeWh) =>
  sizeWh <= 1 ? '0' : num(sizeWh / 1000, sizeWh % 1000 ? 1 : 0)

/** e.g. "5 → 7,5 kWh" */
export const stepLabel = (step) => `${size(step.from)} → ${size(step.to)} kWh`
