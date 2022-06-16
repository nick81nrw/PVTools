
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";


const LineChart2 = ({chartData, xDataKey, yDataKeyLeft, yNameLeft, yDataKeyRight, yNameRight}) => {
    return (
      <ResponsiveContainer
        width='100%'
        height={300}
      >
        <LineChart
        //  height={300}
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xDataKey} />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" />
        <Tooltip />
        <Legend />
        <Line
          name={yNameLeft}
          yAxisId="left"
          type="monotone"
          dataKey={yDataKeyLeft}
          stroke="#8884d8"
          activeDot={{ r: 8 }}
        />
        <Line 
          name={yNameRight}
          yAxisId="right" 
          type="monotone" 
          dataKey={yDataKeyRight} 
          stroke="#82ca9d" />
      </LineChart>
    </ResponsiveContainer>
    )
}




export default LineChart2
