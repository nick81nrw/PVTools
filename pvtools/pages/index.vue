<template>
  <b-container>
    <b-row>
      <b-col>
        <b-form>
          <b-form-group
            label="Stadt"
          >
            <b-form-select
              v-model="input.city"
            />
          </b-form-group>
          <b-form-group
            label="Ausrichtung:"
          >
            <b-form-input
              v-model="input.aspect"
              type="number"
              min="0"
              max="359"
            />
          </b-form-group>
          <b-form-group
            label="Neigung:"
          >
            <b-form-input
              v-model="input.angle"
              type="number"
            />
          </b-form-group>
          <b-form-group
            label="Installierte Leistung"
          >
            <b-input-group
              append="Wp"
            >
              <b-input
                v-model="input.peakPower"
                min="0"
              />
            </b-input-group>
          </b-form-group>
          <b-form-group
            label="Jährlicher Stromverbrauch:"
          >
            <b-input-group
              append="kWh"
            >
              <b-input
                v-model="input.yearlyConsumption"
                min="0"
              />
            </b-input-group>
          </b-form-group>
          <b-form-group
            label="Lastprofil:"
          >
            <b-form-select
              v-model="input.consumptionProfile"
              :options="consumptionProfiles"
            />
          </b-form-group>
          <b-form-group
            label="Stromkosten:"
          >
            <b-input-group
              append="€"
            >
              <b-input
                v-model="input.consumptionCosts"
                min="0"
                step="0.01"
              />
            </b-input-group>
          </b-form-group>
          <b-form-group
            label="Einspeisevergütung:"
          >
            <b-input-group
              append="Cent"
            >
              <b-input
                v-model="input.consumptionCosts"
                min="0"
                step="0.1"
              />
            </b-input-group>
          </b-form-group>
          <b-form-group
            label="Installationskosten:"
          >
            <b-input-group
              append="€"
            >
              <b-input
                v-model="input.installationCostsWithoutBattery"
                min="0"
              />
            </b-input-group>
          </b-form-group><b-form-group
            label="Speicherkosten pro kWh:"
          >
            <b-input-group
              append="€"
            >
              <b-input
                v-model="input.batteryCostsPerKWH"
                min="0"
              />
            </b-input-group>
          </b-form-group>
        </b-form>
      </b-col>
    </b-row>
  </b-container>
</template>

<script>
export default {
  name: 'IndexPage',
  data(){
    return {
      input: {
        city: "",
        aspect: 0,
        angle: 30,
        peakPower: 8000,
        yearlyConsumption: 5000,
        consumptionProfile: 0,
        consumptionCosts: 0.32,
        feedInCompensation: 0.69,
        installationCostsWithoutBattery: 10000,
        batteryCostsPerKWH: 500
      },
      consumptionProfiles: [
        {value: 0, text:"Standardlastprofil H0"}
      ]
    }
  },
  methods: {
    calculate(){
      this.$axios.get(['https://re.jrc.ec.europa.eu/api/SHScalc?',
        'outputformat=json&raddatabase=PVGIS-SARAH&',
        `angle=${angle}&aspect=${aspect}&lat=${lat}&lon=${lon}&`,
        `peakpower=${peakpower}&batterysize=${batterySize}&consumptionday=${consumption}&cutoff=1&`,
        `hourconsumption=${hourconsumption}`
      ].join(''))
    }
  }
}
</script>
