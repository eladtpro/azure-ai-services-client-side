import * as React from 'react';
import { TextField } from '@mui/material';

export default function Name({ lalbel, value, onChange }) {
  const handleChange = (event) => {
    onChange(event.target.value);
  };

  return (

    <TextField
      fullWidth
      label={lalbel}
      style={{ minWidth: 80 }}
      value={value}
      onChange={handleChange}
    />
  );
}