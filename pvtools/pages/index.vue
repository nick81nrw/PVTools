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
      </b-col>
    </b-row>
    <b-collapse
      visible
      id="inputCollapse"
    >
      <b-row>
        <b-col>
          <b-form>
            <b-form-group
              label="Adresse:"
            >
              <b-form-input
                v-model="inputAddressSearchString"
                @focusout="getCoordinatesByAddress"
              />
            </b-form-group>

            <b-form-group
              label="Koordinaten:"
              v-if="adressData.lon && adressData.lat"
            >
              <b-input-group>
                <b-form-input
                  readonly
                  v-model="adressData.lat"
                />
                <b-form-input
                  readonly
                  v-model="adressData.lon"
                />
              </b-input-group>

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
                  v-model="input.peakpower"
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
          </b-form>
        </b-col>
        <b-col>
          <b-form>
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
                  type="number"
                  min="0"
                  step="0.01"
                />
              </b-input-group>
            </b-form-group>
            <b-form-group
              label="Einspeisevergütung:"
            >
              <b-input-group
                append="€"
              >
                <b-input
                  v-model="input.feedInCompensation"
                  min="0"
                  type="number"
                  step="0.0001"
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
                  v-model="input.batteryCostsPerKwh"
                  min="0"
                />
              </b-input-group>
            </b-form-group>
            <b-button-group>
              <b-button
                variant="primary"
                @click="generateData"
                :disabled="!adressData.lat && !adressData.lon"
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

        </b-col>
      </b-row>
    </b-collapse>

    <b-row>
      <b-col>
        <Chart
          id="chart"
          v-if="generatedData.length > 0"
          :labels="generatedData.map(item => item.size)"
          :datasets="[{ data: generatedData.map(item => item.selfUseRate), yAxisID: 'y1', label: 'Autarkiegrad', borderColor: 'blue'},{ data: generatedData.map(item => item.amortization), yAxisID: 'y2', label: 'Amortization', borderColor: 'red',}]"
        />
      </b-col>
    </b-row>
<!--    {{generatedData}}-->
    <table v-if="generatedData.length > 0" class="mt-3">
      <tr>
        <th>Speichergröße</th>
        <th>Selbstgenutzer Strom / Jahr</th>
        <th>Eingespeister Strom / Jahr</th>
        <th>Eigenverbrauchsquote</th>
        <th>Autarkie</th>
        <th>Ersparnis / Jahr</th>
        <th>Ersparnis / Jahr durch Akku</th>
        <th>Amortization</th>
        <th>Speicher Amortization</th>
      </tr>
      <tr
        v-for="item in generatedData"
        :key="item.size"
      >
        <td>{{(item.size/1000).toFixed(0)}} kWh</td>
        <td>{{item.selfUsedPower.toFixed(2)}} kWh</td>
        <td>{{item.fedInPower.toFixed(2)}} kWh</td>
        <td>{{item.selfSufficiencyRate.toFixed(2)}} %</td>
        <td>{{item.selfUseRate.toFixed(2)}} %</td>
        <td>{{item.costSavings.toFixed(2)}} €</td>
        <td>{{item.costSavingsBattery.toFixed(2)}} €</td>
        <td>{{item.amortization.toFixed(2)}} Jahre</td>
        <td>{{item.batteryAmortization.toFixed(2)}} Jahre</td>
      </tr>
    </table>
  </b-container>
</template>

<script>
import Chart from '../components/Chart'

export default {
  name: 'IndexPage',
  components: {Chart},
  data(){
    return {
      generatedData: [],
      batterySizes: [
        1,
        2000,
        4000,
        6000,
        8000,
        10000,
        12000,
        14000,
        16000
      ],
      input: {
        aspect: 0,
        angle: 30,
        peakpower: 8000,
        yearlyConsumption: 5000,
        consumptionProfile: 0,
        consumptionCosts: 0.32,
        feedInCompensation: 0.069,
        installationCostsWithoutBattery: 10000,
        batteryCostsPerKwh: 500
      },
      consumptionProfiles: [
        {
          value: 0, text:"Standardlastprofil H0",
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
      ],
      inputAddressSearchString: "",
      adressData: {},
      costSavingsWithoutBattery: 0
    }
  },
  methods: {
    async generateData(){
      await this.batterySizes.forEach(size => {
        this.$axios.post("/relay",{
          url: this.buildQueryString({
            aspect: this.input.aspect ,
            angle: this.input.angle,
            lat: this.adressData.lat,
            lon: this.adressData.lon,
            peakpower: this.input.peakpower,
            batterysize: size,
            consumptionday: this.input.yearlyConsumption / 365 * 1000,
            hourconsumption: this.convertPowerProfile(this.input.consumptionProfile)//"0.028,0.022,0.019,0.018,0.018,0.021,0.03,0.039,0.042,0.045,0.047,0.049,0.052,0.051,0.049,0.047,0.048,0.051,0.058,0.063,0.061,0.053,0.049,0.04"
          }),
          method: "GET",
          body: {}
        })
          .then(result => {
            //TODO: Doku

            //Sum all Values, Multiply with 30.4 to get Monthly from Daily, divide with 1000 to get kWh from Wh
            let selfUsedPower = result.data.outputs.monthly.reduce((p,c) => p + c.E_d,0) * 30.4 / 1000
            //Sum all Values, Multiply with 30.4 to get Monthly from Daily, divide with 1000 to get kWh from Wh
            let fedInPower = result.data.outputs.monthly.reduce((p,c) => p + c.E_lost_d,0) * 30.4 / 1000

            let costSavings = fedInPower * this.input.feedInCompensation + selfUsedPower * this.input.consumptionCosts

            if(size == 1){
              this.costSavingsWithoutBattery = costSavings
            }

            let amortization = (size/1000 * this.input.batteryCostsPerKwh + this.input.installationCostsWithoutBattery) / costSavings

            let batteryAmortization = costSavings - this.costSavingsWithoutBattery === 0 ? 0 : (size * this.input.installationCostsWithoutBattery/1000)/(costSavings - this.costSavingsWithoutBattery)

            this.generatedData.push({
              size,
              selfUsedPower,
              fedInPower,
              costSavings,
              amortization,
              batteryAmortization,
              costSavingsBattery: costSavings - this.costSavingsWithoutBattery,
              selfUseRate: selfUsedPower / (selfUsedPower + fedInPower) * 100,
              selfSufficiencyRate: selfUsedPower / this.input.yearlyConsumption * 100
            })

            this.generatedData = this.generatedData.sort((a,b) => a.size - b.size)
          })
      })

      this.$root.$emit('bv::toggle::collapse', 'inputCollapse')

    },
    async getCoordinatesByAddress() {
      this.adressData = (await this.$axios.post("/relay", {
        url: "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=" + this.inputAddressSearchString,
        method: "GET",
        body: {}
      })).data[0]

      this.inputAddressSearchString = this.adressData.display_name
    },
    convertPowerProfile(profileId){
      let profile = this.consumptionProfiles.find(item =>  item.value === profileId)

      let keys = Object.keys(profile)
      let returnValue = ""
      keys.forEach(key => {
        if(key.includes("H_")){
          returnValue == "" ? returnValue += profile[key] : returnValue += "," + profile[key]
        }
      })
      return returnValue

    },
    buildQueryString(params){
      //API BaseURL with Base Params
      let string = `https://re.jrc.ec.europa.eu/api/v5_2/SHScalc?outputformat=json&raddatabase=PVGIS-SARAH&cutoff=1`

      /*
      * {
      * aspect: 0.00
      * angle: 45.00,
      * lat: 45.000,
      * lon: 45.000,
      * peakpower: 10000,
      * batterysize: 5000,
      * consumptionday: 15000,
      * hourconsumption: 0.01,0.09,0.9 24* und zusammen 1
      * }
      *
      * */
      let keys = Object.keys(params)
      keys.forEach(key => {
        string += `&${key}=${params[key]}`
      })
      //console.log(string)
      return string
    }
  }
}
</script>

<style>
#chart {
  max-height: 50vh;
}

table {
  width: 90vw;
}

th,td {
  border: 1px solid black;
}

td {
  text-align: right;
}
</style>
