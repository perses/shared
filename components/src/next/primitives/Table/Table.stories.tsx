// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { Story } from '@ladle/react';

import { Table, TableBody, TableCell, TableFooter, TableHead, TableRow } from './Table';

const rows = [
  { name: 'cpu_usage', value: 42.1, unit: '%' },
  { name: 'memory_usage', value: 78.4, unit: '%' },
  { name: 'disk_io', value: 12.9, unit: 'MB/s' },
];

export const Basic: Story = () => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell header>Name</TableCell>
        <TableCell header align="right">
          Value
        </TableCell>
        <TableCell header>Unit</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.name}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
          <TableCell>{row.unit}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const SelectedRow: Story = () => (
  <Table>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.name} selected={row.name === 'memory_usage'}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
          <TableCell>{row.unit}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
);

export const WithFooter: Story = () => (
  <Table>
    <TableHead>
      <TableRow>
        <TableCell header>Name</TableCell>
        <TableCell header align="right">
          Value
        </TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.name}>
          <TableCell>{row.name}</TableCell>
          <TableCell align="right">{row.value}</TableCell>
        </TableRow>
      ))}
    </TableBody>
    <TableFooter>
      <TableRow>
        <TableCell header>Total</TableCell>
        <TableCell align="right">{rows.reduce((sum, row) => sum + row.value, 0).toFixed(1)}</TableCell>
      </TableRow>
    </TableFooter>
  </Table>
);
