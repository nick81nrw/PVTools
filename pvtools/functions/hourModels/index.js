/**
 * Hour models: how one hour is split between PV, battery and grid.
 *
 * The simulation (simulation.js → energyFlow.js) calls the selected model for
 * every hour of the year. All models share the same interface, so a new model
 * only needs its own file and an entry in HOUR_MODELS below; the selection in
 * the expert settings and the tests (hourModels.test.js) pick it up
 * automatically.
 *
 * consumptionProfile names the profile (consumptionProfiles.js) used with the
 * model when the consumption is given as a yearly value. Each model keeps the
 * profile it is calibrated with; imported measured values (CSV) are used as
 * they are.
 *
 * Interface of calculate(params), all energies in Wh, powers in W:
 *
 * params
 *   regressionDb            load distributions per hourly consumption (regression.json)
 *   energyConsumption       consumption of the hour
 *   staticPowerGeneration   PV generation of the hour (after inverter clipping)
 *   maxPowerStaticInverter  AC power of the PV inverter, 0 = unlimited
 *   maxPowerDynamicInverter discharge power of the battery, 0 = unlimited
 *   maxPowerLoadBattery     charge power of the battery, 0 = unlimited
 *   maxPowerFeedIn          feed-in limit (Infinity / undefined = unlimited)
 *   batterySoc              state of charge at the start of the hour
 *   batterySocMin           minimum state of charge
 *   batterySocMax           capacity
 *   batteryLoadEfficiency   charging efficiency (0..1)
 *   batteryUnloadEfficiency discharging efficiency (0..1)
 *
 * result (all values >= 0, the energy balance must hold, see checkEnergyBalance)
 *   selfUsedEnergyPV        consumption covered directly by PV (AC)
 *   selfUsedEnergyBattery   consumption covered by the battery
 *   selfUsedEnergy          sum of both
 *   gridUsedEnergy          consumption taken from the grid
 *   lossesPvGeneration      inverter losses of the self consumed PV energy
 *   batteryCharge           PV energy put into the battery (before losses)
 *   batteryDischarge        energy taken out of the battery (before losses)
 *   lossesLoadBattery       charging losses
 *   lossesUnloadBattery     discharging losses
 *   losses                  sum of all losses
 *   feedInEnergyGrid        energy fed into the grid
 *   missedFeedInPowerGrid   energy curtailed by the feed-in limit
 *   newBatterySoc           state of charge at the end of the hour
 *
 * Balance per hour:
 *   generation = selfUsedEnergyPV + lossesPvGeneration + batteryCharge
 *                + feedInEnergyGrid + missedFeedInPowerGrid
 *   batterySoc + batteryCharge - lossesLoadBattery - batteryDischarge = newBatterySoc
 *   consumption = selfUsedEnergy + gridUsedEnergy
 */
import { regressionCalc } from './legacyRegression.js'
import { calcHourWithLoadDistribution } from './loadDistribution.js'

export const HOUR_MODELS = [
  {
    id: 'loadDistribution',
    label: 'Lastverteilung',
    description:
      'Standard. Der Verbrauch schwankt innerhalb der Stunde; PV deckt jede Lastspitze bis zu ihrer tatsächlichen Leistung. Lastprofil: H0 kalibriert. Gegen gemessene Minuten-Lastprofile geprüft.',
    calculate: calcHourWithLoadDistribution,
    consumptionProfile: 'h0Calibrated',
  },
  {
    id: 'legacyRegression',
    label: 'Klassisch (bis 10/2026)',
    description:
      'Die bisherige Berechnung, zum Vergleich mit älteren Ergebnissen, mit dem Standardlastprofil H0. Unterschätzt den Eigenverbrauch ohne Speicher und überschätzt den Nutzen eines Speichers.',
    calculate: regressionCalc,
    consumptionProfile: 'h0',
  },
]

export const DEFAULT_HOUR_MODEL = 'loadDistribution'

/** the model with this id, the default model for unknown ids */
export const getHourModel = (id) =>
  HOUR_MODELS.find((model) => model.id === id) ??
  HOUR_MODELS.find((model) => model.id === DEFAULT_HOUR_MODEL)
