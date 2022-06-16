
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';



const DenseTable = ({headers, rows}) => {
   return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} size="small" aria-label="a dense table">
        <TableHead>
          <TableRow>
            {
                headers.map((header,i) => (
                    <TableCell key={i} align="right">{header}</TableCell>
                ))
            }
            </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row,i) => (
            <TableRow
              key={i}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
            {
                Object.values(row).map((column, i) => (
                    <TableCell key={i} align="right">{column.toFixed(2)}</TableCell>
                ))
            }
            </TableRow>

          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default DenseTable