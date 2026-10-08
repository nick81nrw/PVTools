import { ENERGY_COLORS } from './chartTheme.js'

/** labels and colors of the ratings from functions/batteryEconomics.js */
export const RATINGS = {
  yes: { label: 'Ja', long: 'lohnt sich', color: ENERGY_COLORS.battery },
  borderline: {
    label: 'Grenzfall',
    long: 'Grenzfall',
    color: ENERGY_COLORS.pv,
  },
  no: { label: 'Nein', long: 'lohnt sich nicht', color: ENERGY_COLORS.grid },
}
