<template>
  <b-container fluid>
    <b-row>
      <b-col>
        <h1>PVTools</h1>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-button
          v-b-toggle.inputCollapse
        >Daten eingeben</b-button>
        <b-collapse
          visible
          id="inputCollapse"
        >
          <b-form>
            <b-form-group
              label="Stadt"
            >
              <b-form-select
                v-model="input.city"
                :options="cityOptions"
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
            </b-form-group>
            <b-form-group
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
            <b-button-group>
              <b-button
                variant="primary"
                @click="performCalc"
              >
                Berechnen
              </b-button>
              <b-button
                variant="danger"
                disabled
              >
                Zurücksetzen
              </b-button>
            </b-button-group>
          </b-form>
        </b-collapse>


      </b-col>
      <b-col>
        <Chart />
      </b-col>
    </b-row>

  </b-container>
</template>

<script>
import Chart from '../components/Chart'

export default {
  name: 'IndexPage',
  components: {Chart},
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
      ],
      cityOptions: [],

      requestData: {
        consumptionPerHour: ""
      }
    }
  },
  methods: {
    async performCalc(){
      this.$root.$emit('bv::toggle::collapse', 'inputCollapse')

    },
    async calculate(){
      let requestData = this.requestData


      alert((await this.$axios.get(['https://re.jrc.ec.europa.eu/api/SHScalc?outputformat=json&raddatabase=PVGIS-SARAH&',
        `angle=${this.input.angle}&aspect=${this.input.aspect}&lat=${"54,120382"}&lon=${"13,374534"}&`,
        `peakpower=${this.input.peakpower}&batterysize=${1000}&consumptionday=${this.input.consumption /365 * 1000}&cutoff=1&`,
        `hourconsumption=${requestData.consumptionPerHour}`
      ].join(''))))
    },
    convertPowerProfile(){
      let profile = {
        name: "Standardlastprofil H0",
        H_00: 0.028,
        H_01: 0.022,
        H_02: 0.019,
        H_03: 0.018,
        H_04: 0.018,
        H_05: 0.021,
        H_06: 0.03,
        H_07: 0.039,
        H_08: 0.042,
        H_09: 0.045,
        H_10: 0.047,
        H_11: 0.049,
        H_12: 0.052,
        H_13: 0.051,
        H_14: 0.049,
        H_15: 0.047,
        H_16: 0.048,
        H_17: 0.051,
        H_18: 0.058,
        H_19: 0.063,
        H_20: 0.061,
        H_21: 0.053,
        H_22: 0.049,
        H_23: 0.04,
      }
      let keys = Object.keys(profile)
      let returnValue = ""
      keys.forEach(key => {
        if(key.includes("H_")){
          returnValue == "" ? returnValue += profile[key] : returnValue += "," + profile[key]
        }
      })

      this.requestData.consumptionPerHour = returnValue

    }
  },
  async mounted(){
    this.cityOptions = ((await this.$axios.get("/cities.json")).data).map(city => {return {...city, value: city.city, text: city.city}})

    await this.convertPowerProfile()


    this.$axios.get("/relay",{
      url: "https://re.jrc.ec.europa.eu/api/SHScalc?lat=45&lon=8&peakpower=10&batterysize=50&consumptionday=200&cutoff=40",
      method: "GET",
      body: {}
    })


    //await this.calculate()
  }
}
</script>
