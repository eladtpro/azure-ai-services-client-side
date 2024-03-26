import React, { useEffect, useState } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

export default function Summarization({ result }) {
  const [summaries, setSummaries] = useState(result);

  useEffect(() => {
    if (!result) return;
    if(!result.length) return;
    console.log(result);
    setSummaries(result);
  }, [result]);

  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 300 }} style={{ width: '100%' }} aria-label="Summarization table">
        <TableHead>
          <TableRow>
            <TableCell>Aspect (Summary)</TableCell>
            <TableCell>Text</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {summaries.map((row) => (
            <TableRow
              key={row.text}
              sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
            >
              <TableCell component="th" scope="row">
                {row.aspect}
              </TableCell>
              <TableCell>{row.text}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}