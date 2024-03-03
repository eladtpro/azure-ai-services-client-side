import * as React from 'react';
import { InputLabel, FormHelperText, MenuItem, FormControl, Select } from '@mui/material';

export default function Language({ lalbel, value, onChange, helper }) {
    const handleChange = (event) => {
        onChange(event.target.value);
    };

    return (
        <FormControl sx={{ m: 1, minWidth: 120 }} fullWidth>
            <InputLabel id="demo-simple-select-label">{lalbel}</InputLabel>
            <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={value}
                label=""
                onChange={handleChange}>
                <MenuItem value="he-IL">Hebrew</MenuItem>
                <MenuItem value="en-US">English</MenuItem>
                <MenuItem value="ar-IL">Arabic</MenuItem>
                <MenuItem value="ru-RU">Russian</MenuItem>
                <MenuItem value="am-ET">Amharic</MenuItem>
            </Select>
            <FormHelperText>{helper}</FormHelperText>
        </FormControl>
    );
}