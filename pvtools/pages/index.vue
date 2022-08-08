<template>
  <b-container fluid>
    <b-row>
      <b-col>
        <h1>PVTools</h1>
      </b-col>
      <b-col>
        <iframe frameborder="0" scrolling="no" marginheight="0" marginwidth="0" width="200" height="100" type="text/html" src="https://www.youtube.com/embed/FKSDynkXchY?autoplay=0&fs=1&iv_load_policy=3&showinfo=0&rel=0&cc_load_policy=0&start=0&end=0"></iframe>
      </b-col>
      <b-col
        align-v="baseline"
        cols="auto"
      >
         <form action="https://www.paypal.me/akkudoktor" method="post" target="_blank" class="paypal">
          <input type="hidden" name="hosted_button_id" value="RTXEPF475DBVA" />
          <input type="image" src="/btn_support_LG.gif" border="0" name="submit" title="Unterstütze unsere Arbeit!" alt="Spenden mit dem PayPal-Button" />
          <!-- <img alt="" border="0" src="https://www.paypal.com/de_DE/i/scr/pixel.gif" width="1" height="1" /> -->
        </form>
        <p>Nutze als Grund: "PV-Tool"</p>
      </b-col>
    </b-row>
    <b-row>
      <b-col>
        <b-button
          v-b-toggle.inputCollapse
        >Daten eingeben</b-button>
      </b-col>
    </b-row>

    <b-row cols="1" cols-md="2">
      <b-col>
        <b-collapse
          id="inputCollapse"
          visible
        >
          <b-form>
            <b-form-group
              label="Adresse:"
            >
              <b-input-group
                append="Straße, PLZ Stadt"
              >
                <b-form-input
                  v-model="inputAddressSearchString"
                  @focusout="getCoordinatesByAddress"
                  placeholder="z.B. 50667 Köln"
                  v-b-tooltip.hover title='Beim verlassen des Feldes wird der Standort gesucht'
                />
              </b-input-group>
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
            <b-alert
              v-else-if="adressData == 'no_address'"
              variant="danger"
              show
            >
              Die eingegebende Adresse konnte nicht gefunden werden. Bitte versuchen Sie es erneut.
            </b-alert>
            <b-form-group
              label="Ausrichtung:"
            >
              <b-input-group
                append="° Grad Azimuth"
              >
                <b-form-input
                  v-model.number="input.aspect"
                  type="number"
                  min="0"
                  max="359"
                  v-b-tooltip.hover title="0 = Süden, 90 = Westen, -90 = Osten"
                />
              </b-input-group>
            </b-form-group>
            <b-form-group
              label="Neigung:"
            >
              <b-input-group
                append="° Grad"
              >
                <b-form-input
                  v-model.number="input.angle"
                  type="number"
                  min="0"
                  max="90"
                  v-b-tooltip.hover title="0 = waargerecht, 90 = senkrecht"
                />
              </b-input-group>
            </b-form-group>
            <b-form-group
              label="Installierte Leistung"
            >
              <b-input-group
                append="Wp"
              >
                <b-input
                  v-model.number="input.peakpower"
                  min="0"
                  type="number"
                  v-b-tooltip.hover title='Bei 10kWp muss "10000" eingetragen werden'
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
                  v-model.number="input.yearlyConsumption"
                  min="0"
                  type="number"
                />
              </b-input-group>
            </b-form-group>
          </b-form>
        </b-collapse>
      </b-col>
      <b-col>
        <b-collapse
          id="inputCollapse"
          visible
        >
          <b-form>
            <b-form-group
              label="Lastprofil:"
            >
              <b-form-select
                v-model="input.consumptionProfile"
                :options="consumptionProfiles"
              />
              <NuxtLink to="/consumptionProfiles">Infos zu den Lastprofilen</NuxtLink>
            </b-form-group>
            <b-form-group
              label="Stromkosten:"
            >
              <b-input-group
                append="€ / kWh"
              >
                <b-input
                  v-model.number="input.consumptionCosts"
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
                append="€ / kWh"
              >
                <b-input
                  v-model.number="input.feedInCompensation"
                  min="0"
                  type="number"
                  step="0.0001"
                />
              </b-input-group>
            </b-form-group>
            <b-form-group
              label="Installationskosten ohne Akku:"
            >
              <b-input-group
                append="€"
              >
                <b-input
                  v-model.number="input.installationCostsWithoutBattery"
                  min="0"
                  type="number"
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
                  v-model.number="input.batteryCostsPerKwh"
                  min="0"
                  type="number"
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
        </b-collapse>
      </b-col>
    </b-row>

    <b-row>
      <b-col>
        <div
          id="chartContainer"
        >
          <Chart
            id="chart"
            v-if="displayData.length > 0"
            :labels="displayData[displayData.length - 1].map(item => item.size)"
            :datasets="[{ data: displayData[displayData.length - 1].map(item => item.selfUseRate), yAxisID: 'y1', label: 'Autarkiegrad', borderColor: 'blue'},{ data: displayData[displayData.length - 1].map(item => item.amortization), yAxisID: 'y2', label: 'Amortization', borderColor: 'red',}]"

          />
        </div>


      </b-col>
    </b-row>
<!--    {{generatedData}}-->
    <div
      id="tableContainer"
    >
      <table v-if="displayData.length > 0" class="mt-3">
        <tr>
          <th>Speichergröße</th>
          <th>Selbstgenutzer Strom / Jahr</th>
          <th>Eingespeister Strom / Jahr</th>
          <th>Eigenverbrauchsquote</th>
          <th>Autarkie</th>
          <th>Ersparnis / Jahr durch Akku</th>
          <th>Amortisation nur Speicher</th>
          <th>Ersparnis / Jahr Anlage</th>
          <th>Amortisation Anlage</th>
        </tr>
        <tr
          v-for="item in displayData[displayData.length - 1]"
          :key="item.size"
        >
          <td>{{(item.size/1000).toFixed(1)}} kWh</td>
          <td>{{item.selfUsedPower.toFixed(2)}} kWh</td>
          <td>{{item.fedInPower.toFixed(2)}} kWh</td>
          <td>{{item.selfSufficiencyRate.toFixed(2)}} %</td>
          <td>{{item.selfUseRate.toFixed(2)}} %</td>
          <td>{{item.costSavingsBattery.toFixed(2)}} €</td>
          <td>{{item.batteryAmortization.toFixed(2)}} Jahre</td>
          <td>{{item.costSavings.toFixed(2)}} €</td>
          <td>{{item.amortization.toFixed(2)}} Jahre</td>
        </tr>
      </table>
    </div>

  <NuxtLink to="/impress">Impressum / Datenschutz</NuxtLink>
  </b-container>
</template>

<script>
import Chart from '../components/Chart'

export default {
  name: 'IndexPage',
  components: {
    Chart
  },
  data(){
    return {
      displayData: [],
      batterySizes: [
        1,
        500,
        1000,
        1500,
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
        feedInCompensation: 0.086,
        installationCostsWithoutBattery: 10000,
        batteryCostsPerKwh: 500
      },
      consumptionProfiles: [
        {
          value: 0, text:"Standardlastprofil H0 SW Hilden - Jahr gemittelt",
          H_00: 0.029064195,
          H_01: 0.022303546,
          H_02: 0.018725847,
          H_03: 0.019106339,
          H_04: 0.020091895,
          H_05: 0.024349181,
          H_06: 0.033814782,
          H_07: 0.042806768,
          H_08: 0.042039649,
          H_09: 0.041977505,
          H_10: 0.043133476,
          H_11: 0.043674032,
          H_12: 0.046938553,
          H_13: 0.050398158,
          H_14: 0.047898286,
          H_15: 0.043497202,
          H_16: 0.044159626,
          H_17: 0.051662384,
          H_18: 0.059963955,
          H_19: 0.06418658,
          H_20: 0.061940291,
          H_21: 0.057203104,
          H_22: 0.051313248,
          H_23: 0.039751399,
        },
        {
          value: 1,
          text:"SLP H0",
          H_00: 0.029064195,
          H_01: 0.022303546,
          H_02: 0.018725847,
          H_03: 0.019106339,
          H_04: 0.020091895,
          H_05: 0.024349181,
          H_06: 0.033814782,
          H_07: 0.042806768,
          H_08: 0.042039649,
          H_09: 0.041977505,
          H_10: 0.043133476,
          H_11: 0.043674032,
          H_12: 0.046938553,
          H_13: 0.050398158,
          H_14: 0.047898286,
          H_15: 0.043497202,
          H_16: 0.044159626,
          H_17: 0.051662384,
          H_18: 0.059963955,
          H_19: 0.06418658,
          H_20: 0.061940291,
          H_21: 0.057203104,
          H_22: 0.051313248,
          H_23: 0.039751399,
        },
        {
          value: 2,

          text: "SLP H0 +10% Mittags",
          H_00: 0.029064195,
          H_01: 0.022303546,
          H_02: 0.018725847,
          H_03: 0.019106339,
          H_04: 0.020091895,
          H_05: 0.024349181,
          H_06: 0.033814782,
          H_07: 0.042806768,
          H_08: 0.042039649,
          H_09: 0.041977505,
          H_10: 0.043133476,
          H_11: 0.073674032,
          H_12: 0.086938553,
          H_13: 0.080398158,
          H_14: 0.047898286,
          H_15: 0.043497202,
          H_16: 0.044159626,
          H_17: 0.051662384,
          H_18: 0.059963955,
          H_19: 0.03418658,
          H_20: 0.031940291,
          H_21: 0.037203104,
          H_22: 0.031313248,
          H_23: 0.039751399,
        },
        {
          value: 3,
          text: "SLP H0 +20% Mittags",
          H_00: 0.019064195,
          H_01: 0.012303546,
          H_02: 0.018725847,
          H_03: 0.019106339,
          H_04: 0.010091895,
          H_05: 0.014349181,
          H_06: 0.013814782,
          H_07: 0.022806768,
          H_08: 0.022039649,
          H_09: 0.041977505,
          H_10: 0.063133476,
          H_11: 0.093674032,
          H_12: 0.106938553,
          H_13: 0.100398158,
          H_14: 0.067898286,
          H_15: 0.063497202,
          H_16: 0.044159626,
          H_17: 0.041662384,
          H_18: 0.049963955,
          H_19: 0.03418658,
          H_20: 0.031940291,
          H_21: 0.037203104,
          H_22: 0.031313248,
          H_23: 0.039751399,
        }

      ],
      inputAddressSearchString: "",
      adressData: "",
      costSavingsWithoutBattery: 0,
      screenHeight: 0,
    }
  },
  methods: {

    async generateData(){
      let generatedData = []
      await Promise.all(this.batterySizes.map(size => {
        return this.$axios.post("/relay",{
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
        .then(response => response.data)
      }))
        .then(data => {
          //Sum all Values, Multiply with 30.4 to get Monthly from Daily, divide with 1000 to get kWh from Wh
          let selfUsedPower = data[0].outputs.monthly.reduce((p,c) => p + c.E_d,0) * 30.4 / 1000
          //Sum all Values, Multiply with 30.4 to get Monthly from Daily, divide with 1000 to get kWh from Wh
          let fedInPower = data[0].outputs.monthly.reduce((p,c) => p + c.E_lost_d,0) * 30.4 / 1000

          let costSavings = fedInPower * this.input.feedInCompensation + selfUsedPower * this.input.consumptionCosts

          this.costSavingsWithoutBattery = costSavings

          return data

        })
          .then(data => {
            data.forEach(rawSize => {
              //Sum all Values, Multiply with 30.4 to get Monthly from Daily, divide with 1000 to get kWh from Wh
              let selfUsedPower = rawSize.outputs.monthly.reduce((p,c) => p + c.E_d,0) * 30.4 / 1000
              //Sum all Values, Multiply with 30.4 to get Monthly from Daily, divide with 1000 to get kWh from Wh
              let fedInPower = rawSize.outputs.monthly.reduce((p,c) => p + c.E_lost_d,0) * 30.4 / 1000

              let costSavings = fedInPower * this.input.feedInCompensation + selfUsedPower * this.input.consumptionCosts
              let batterySize = rawSize.inputs.battery.capacity

              let amortization = (batterySize/1000 * this.input.batteryCostsPerKwh + this.input.installationCostsWithoutBattery) / costSavings
              let batteryAmortization = costSavings - this.costSavingsWithoutBattery === 0 ? 0 : (batterySize * this.input.batteryCostsPerKwh/1000)/(costSavings - this.costSavingsWithoutBattery)
              // this.gereratedData.splice(0)
              generatedData.push({
                size: batterySize,
                selfUsedPower,
                fedInPower,
                costSavings,
                amortization,
                batteryAmortization,
                costSavingsBattery: costSavings - this.costSavingsWithoutBattery,
                // selfUseRate: selfUsedPower / (selfUsedPower + fedInPower) * 100,
                // selfSufficiencyRate: selfUsedPower / this.input.yearlyConsumption * 100
                selfUseRate: selfUsedPower / this.input.yearlyConsumption * 100,
                selfSufficiencyRate: selfUsedPower / (selfUsedPower + fedInPower) * 100
              })

              //generatedData = generatedData.sort((a,b) => a.size - b.size)
            })

          })

      this.displayData.push(generatedData)

      this.$root.$emit('bv::toggle::collapse', 'inputCollapse')

    },
    async getCoordinatesByAddress() {
      let osmReturn = (await this.$axios.post("/relay", {
        url: "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=" + this.inputAddressSearchString,
        method: "GET",
        body: {}
      })).data

      console.log(osmReturn)

      if(osmReturn.length == 0){
        this.adressData = "no_address"
        console.log("Detected Wrong")
      } else if(osmReturn[0]) {
        this.adressData = osmReturn[0]
        this.inputAddressSearchString = this.adressData.display_name
      }
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
  },
  mounted() {
    this.screenHeight = window.screen.height
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
th {
  vertical-align: top;
}

td {
  text-align: right;
}

#tableContainer {
  overflow-x: scroll;
}

#chartContainer {
  max-width: 100vw;
  max-height: 50vh;
}
.paypal {
  margin-top: 10px;
}
</style>
