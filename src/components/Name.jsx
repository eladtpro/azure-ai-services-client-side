import * as React from 'react';
import { TextField } from '@mui/material';

export default function Name({ lalbel, value, onChange }) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (

    <TextField
      label={lalbel}
      id="outlined-start-adornment"
      size='large'
      //   sx={{ m: 1, width: '25ch' }}
      //   InputProps={{
      //     startAdornment: <InputAdornment position="start">Name:</InputAdornment>,
      //   }}
      value={value}
      onChange={handleChange}
    />
  );
}