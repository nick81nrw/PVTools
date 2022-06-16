
import './App.css';

import { useState, useEffect } from 'react';
import axios from 'axios';

import { useForm } from "react-hook-form";
import { TextField, Box, Paper} from '@mui/material';



import DenseTable from './Components/DenseTable'
import AsyncAutocomplete from './Components/AsyncAutocomplete'
import LineChart2 from './Components/LineChart';
import { BASE_API_URL } from './base';

const defaultValues = {
  cityId: 111,
  aspect: 0,
  angle: 30,
  peakpower: 8000,
  consumption_year: 5000,
  consumptionProfileId: 1,
  electricityCosts: 0.32,
  feedInTariff: 6.9,
  installationCosts: 10000,
  batteryCostsKwh:500
}


const calcOperationalTime = ({years,moduleDegration, batteryDegration, energyCostChange,rowData, inputData}) => {

  const operationalTime = []
  for (let i = 0; i < years; i++) {
    
    const data = {
      selfUsedPower: rowData.selfUsedPower * (100-(moduleDegration*i)),
      fedInPower: rowData.fedInPower * (100-(moduleDegration*i)),
      sumPower: (rowData.selfUsedPower * (100-(moduleDegration*i))) + (rowData.fedInPower * (100-(moduleDegration*i))),
      capacity: rowData.batterySize * (100 - (batteryDegration*i)),
      year: i

    }
    operationalTime.push(data)
    
  }


  return operationalTime

}

function App() {

  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues
  });
  
  const [tableHeaders, setTableHeader] = useState(['Speichergröße [kWh]','Selbstgenutzter Strom / Jahr [kWh]','Eingespeister Strom / Jahr [kWh]', 'Gesamt [kWh]','Ersparnis / Jahr [€]','Eigenverbrauchsquote [%]','Autarkiegrad [%]', 'Differenz ohne Akku [€]', 'Akku Amortisation [Jahre]','Gesamtanlage Amortisation [Jahre]'])
  const [tableRows, setTableRows] = useState([])

  const onSubmit = async inputData => {
      
      const response = await axios.post(BASE_API_URL +  '/getData/',inputData)
    
      const costSavingsWithoutBattery = (response.data[0].self_used_power*inputData.electricityCosts + response.data[0].fed_in_power*inputData.feedInTariff/100)
      
      const rowsData = response.data.map(val => {
        const costSaving = (val.self_used_power*inputData.electricityCosts + val.fed_in_power*inputData.feedInTariff/100)
        const rowData =  {
          batterySize: (val.battery_size/1000),
          selfUsedPower: val.self_used_power,
          fedInPower: val.fed_in_power,
          sumPower: (val.self_used_power + val.fed_in_power),
          costSaving,
          selfUseRate: (val.self_used_power / (val.self_used_power + val.fed_in_power)*100),
          selfSufficiencyRate: (val.self_used_power / inputData.consumption_year*100),
          costSavingBattery: (costSaving - costSavingsWithoutBattery),
          amortizationBattery: costSaving - costSavingsWithoutBattery === 0 ? 0 : ((inputData.batteryCostsKwh*val.battery_size/1000)/(costSaving - costSavingsWithoutBattery)),
          amortization: ((val.battery_size/1000 * inputData.batteryCostsKwh + inputData.installationCosts)/costSaving),
        }

        rowData.operationalTime = calcOperationalTime({rowData, inputData, years: 20, moduleDegration: 0.5, energyCostChange:1,batteryDegration:0.3})

        return rowData
      })
      
      
      console.log(rowsData)
      setTableRows(rowsData)

  }
  
  useEffect(() => {
    register('cityId',{required: true, max: 100000, min: 1});
    register('consumptionProfileId',{required: true, max: 20, min: 1});
  }, [register]);
  
  return (
    <div className="App">
      <Paper
        sx={{
          maxWidth: '100%',
          '& .MuiTextField-root': { display:'block'},
          '& .MuiOutlinedInput-root': {display: 'block'},
          '& .MuiAutocomplete-input' : {minWidth: '100% !important'},
          '& .MuiBox-root > *': {m:1}
        }}
      >

            <form onSubmit={handleSubmit(onSubmit)}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap:2
                }}
              >
                <Box>
                  <AsyncAutocomplete
                    url={BASE_API_URL + "/getCity/"}
                    titleField="city"
                    minInputLength={3}
                    keyField="id"
                    label="Stadt..."
                    onChange={val =>{ 
                      setValue('cityId', val.id)}}
                  />
                  <TextField 
                    type="number" 
                    label="Ausrichtung" 
                    {...register("aspect", {setValueAs: v => parseInt(v), required: true, max: 120, min: -120})} />
                  <TextField 
                    type="number" 
                    label="Neigung" 
                  {...register("angle", {setValueAs: v => parseInt(v), required: true, max: 90, min: 0})} />
                  <TextField 
                    type="number" 
                    label="Installierte Leistung Wp" 
                    {...register("peakpower", {setValueAs: v => parseInt(v), required: true, max: 50000, min: 1})} />
                </Box>
                <Box>
                  <TextField 
                    type="number" 
                    label="Verbrauch pro Jahr kWh" 
                    {...register("consumption_year", {setValueAs: v => parseInt(v), required: true, max: 50000, min: 1000})} />
                  <AsyncAutocomplete
                    url={BASE_API_URL + "/getConsumptionProfiles/"}
                    titleField="name"
                    // minInputLength={0}
                    keyField="id"
                    label="Lastprofil"
                    onChange={val =>{ 
                      setValue('consumptionProfileId', val.id)}}
                  />
                  <TextField 
                    type="number" 
                    label="Stromkosten in €" 
                    inputProps={{step: 0.01}}
                    {...register("electricityCosts", {
                        required: true,
                        setValueAs: v => parseFloat(v), 
                        validate: val => val > 0.00 && val < 1.00
                      })} />
                  
                  <TextField 
                    type="number" 
                    label="Einspeisevergütung in Cent" 
                    inputProps={{step: 0.1}}
                    {...register("feedInTariff", {
                        required: false, 
                        setValueAs: v => parseFloat(v), 
                        validate: val =>  val > 0 && val < 60
                      }
                    )} />
                    
                  <TextField 
                    type="number" 
                    label="Installationskosten ohne Speicher in €" 
                    {...register("installationCosts", {setValueAs: v => parseInt(v), required: true, max: 100000, min: 1})} />
                  <TextField 
                    type="number" 
                    label="Speicherkosten pro kWh in €" 
                    inputProps={{type:"number"}}
                    {...register("batteryCostsKwh", {setValueAs: v => parseInt(v), required: true, max: 3000, min: 1})} />
                </Box>
              </Box>
              <TextField type="submit" />
            </form>
          {/* </Box> */}
        </Paper>

        {/* <LineChart2 
          xDataKey="batterySize" 
          yDataKeyLeft="selfSufficiencyRate" 
          yNameLeft="Autarkie"
          yDataKeyRight="selfUseRate"
          yNameRight="Eigenverbrauchquote"
          chartData={tableRows.map(v => {
                return {selfSufficiencyRate: v.selfSufficiencyRate,
                        batterySize: v.batterySize,
                        selfUseRate: v.selfUseRate,
                }
              })
            }/> */}
        <LineChart2 
          xDataKey="batterySize" 
          yDataKeyLeft="selfSufficiencyRate" 
          yNameLeft="Autarkie"
          yDataKeyRight="amortization"
          yNameRight="Amortisation in Jahre"
          chartData={tableRows.map(v => {
                return {selfSufficiencyRate: v.selfSufficiencyRate,
                        batterySize: v.batterySize,
                        amortization: v.amortization,
                }
              })
            }/>


        



        <DenseTable headers={tableHeaders} rows={tableRows.map(({operationalTime, ...rest}) => rest)} />
    </div>
  );
}




export default App;

