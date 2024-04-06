import React, { useEffect, useState } from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import { TableVirtuoso } from 'react-virtuoso';
import { validateEntry } from '../../utils';

const columns = [
    {
        width: 60,
        label: 'Time',
        dataKey: 'timestamp',
    },
    {
        width: 60,
        label: 'Name',
        dataKey: 'name',
    },
    {
        width: 400,
        label: '',
        dataKey: 'text',
    }
];

const VirtuosoTableComponents = {
    Scroller: React.forwardRef((props, ref) => (
        <TableContainer component={Paper} {...props} ref={ref} />
    )),
    Table: (props) => (
        <Table {...props} sx={{ borderCollapse: 'separate', tableLayout: 'fixed' }} />
    ),
    TableHead,
    TableRow: ({ item: _item, ...props }) => <TableRow {...props} />,
    TableBody: React.forwardRef((props, ref) => <TableBody {...props} ref={ref} />),
};

function fixedHeaderContent() {
    return (
        <TableRow>
            {columns.map((column) => (
                <TableCell
                    key={column.dataKey}
                    variant="head"
                    align="left"
                    style={{ width: column.width }}
                    sx={{
                        backgroundColor: 'background.paper',
                    }}
                >
                    {column.label}
                </TableCell>
            ))}
        </TableRow>
    );
}

function rowContent(_index, row) {
    return (
        <React.Fragment>
            {columns.map((column) => (
                <TableCell
                    key={column.dataKey}
                    align="left">
                    {row[column.dataKey]}
                </TableCell>
            ))}
        </React.Fragment>
    );
}

export default function Chat({ name, entries, language }) {
    const [rows, setRows] = useState([]);
    useEffect(() => {
        if (!entries) return;
        if (!name) return;
        const tmp = entries.filter(validateEntry).map((entry) => {
            return {
                timestamp: entry.timestamp,
                name: (entry.name === name) ? 'Me' : entry.name,
                text: (!!entry[language]) ? entry[language] : entry.text
            };
        });
        setRows(tmp);
    }, [entries, name]);

    return (
        <Paper style={{ height: 500, width: '95%' }}>
            <TableVirtuoso
                data={rows}
                components={VirtuosoTableComponents}
                fixedHeaderContent={fixedHeaderContent}
                itemContent={rowContent}
            />
        </Paper>
    );
}