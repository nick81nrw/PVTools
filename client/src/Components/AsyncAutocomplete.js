import { useState , useEffect, Fragment} from 'react'; 
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';
import { Box } from '@mui/material';

export default function AsyncAutocomplete({url, titleField, onChange, minInputLength, keyField, label}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");  
  const [options, setOptions] = useState([]);
  const loading = open && options.length === 0;

  useEffect(() => {
    let active = true;
    
    // if (!loading) {
    //   return undefined;
    // }

    (async () => {
        if (minInputLength && minInputLength > 0 && input.length >= minInputLength) {
            setOpen(true)
            const response = await axios.get(url + input);
            setOptions(response.data);
        } else if (!minInputLength) {
            const response = await axios.get(url);
            setOptions(response.data);
        } else {
          setOpen(false)
          setOptions([])
        }
      })();

    return () => {
      active = false;
    };
  }, [input, loading]);

 
  return (
    <Autocomplete
      id="asyncAutocomplete"
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      isOptionEqualToValue={(option, value) => option[keyField] === value[keyField]}
      getOptionLabel={(option) => titleField ? option[titleField] : option}
      options={options}
      loading={loading}
      onChange={(e,newValue)=> onChange && onChange(newValue)}
      renderOption={(props,option) => (
          <Box componetns='li'{...props} key={option[keyField]}>
              {option[titleField]}
              
          </Box>
      )}
      renderInput={(params) => (
        <TextField
          sx={{
            minWidth: '50px'
          }}
	        label={label}
          {...params}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </Fragment>
            ),
          }}
          onChange={e => setInput(e.target.value)}
        />
      )}
    />
  );
}


