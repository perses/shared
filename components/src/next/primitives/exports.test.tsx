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

import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  Divider,
  Icon,
  Spinner,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableCheckbox,
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableRowExpandButton,
  TableSortLabel,
  Tooltip
} from './index';
import type {
  AlertProps,
  AlertSeverity,
  BoxProps,
  ButtonProps,
  ButtonVariant,
  CheckboxProps,
  ChipColor,
  ChipProps,
  ChipSize,
  ChipStyle,
  ChipVariant,
  ColorVariant,
  DividerProps,
  IconProps,
  SpacingToken,
  Size,
  SortDirection,
  SpinnerProps,
  StackProps,
  Status,
  SwitchProps,
  TooltipProps,
  TableCellProps,
  TableProps,
  TableRowProps,
} from './index';

describe('primitives barrel exports', () => {
  it('exports the concrete component implementations', () => {
    expect(Alert).toBeDefined();
    expect(Box).toBeDefined();
    expect(Button).toBeDefined();
    expect(Checkbox).toBeDefined();
    expect(Chip).toBeDefined();
    expect(Divider).toBeDefined();
    expect(Icon).toBeDefined();
    expect(Spinner).toBeDefined();
    expect(Stack).toBeDefined();
    expect(Switch).toBeDefined();
    expect(Tooltip).toBeDefined();
    expect(Table).toBeDefined();
    expect(TableBody).toBeDefined();
    expect(TableCell).toBeDefined();
    expect(TableCheckbox).toBeDefined();
    expect(TableContainer).toBeDefined();
    expect(TableFooter).toBeDefined();
    expect(TableHead).toBeDefined();
    expect(TablePagination).toBeDefined();
    expect(TableRow).toBeDefined();
    expect(TableRowExpandButton).toBeDefined();
    expect(TableSortLabel).toBeDefined();
  });

  it('exports their prop types', () => {
    const alertProps: AlertProps = {};
    const severity: AlertSeverity = 'info';
    const boxProps: BoxProps = {};
    const spacingToken: SpacingToken = 'md';
    const buttonProps: ButtonProps = {};
    const variant: ButtonVariant = 'solid';
    const color: ColorVariant | Status = 'primary';
    const size: Size = 'md';
    const checkboxProps: CheckboxProps = { 'aria-label': 'Select' };
    const checkboxColor: ColorVariant = 'primary';
    const checkboxSize: Size = 'md';
    const chipProps: ChipProps = { children: 'Production' };
    const chipColor: ChipColor = 'secondary';
    const chipSize: ChipSize = 'xs';
    const chipVariant: ChipVariant = 'outline';
    const chipStyle: ChipStyle = { '--perses-chip-size-sm': '2.5rem' };
    const dividerProps: DividerProps = {};
    const iconProps: IconProps = {};
    const spinnerProps: SpinnerProps = {};
    const stackProps: StackProps = {};
    const switchProps: SwitchProps = {};
    const tooltipProps: TooltipProps = { title: 'tip', children: <button type="button">trigger</button> };
    const tableProps: TableProps = {};
    const tableRowProps: TableRowProps = {};
    const tableCellProps: TableCellProps = {};
    const sortDirection: SortDirection = 'asc';
    const sharedSize: Size = 'md';
    const sharedStatus: Status = 'error';

    expect(alertProps).toBeDefined();
    expect(severity).toBe('info');
    expect(boxProps).toBeDefined();
    expect(spacingToken).toBe('md');
    expect(buttonProps).toBeDefined();
    expect(variant).toBe('solid');
    expect(color).toBe('primary');
    expect(size).toBe('md');
    expect(checkboxProps).toBeDefined();
    expect(checkboxColor).toBe('primary');
    expect(checkboxSize).toBe('md');
    expect(chipProps).toBeDefined();
    expect(chipColor).toBe('secondary');
    expect(chipSize).toBe('xs');
    expect(chipVariant).toBe('outline');
    expect(chipStyle).toBeDefined();
    expect(dividerProps).toBeDefined();
    expect(iconProps).toBeDefined();
    expect(spinnerProps).toBeDefined();
    expect(stackProps).toBeDefined();
    expect(switchProps).toBeDefined();
    expect(tooltipProps).toBeDefined();
    expect(tableProps).toBeDefined();
    expect(tableRowProps).toBeDefined();
    expect(tableCellProps).toBeDefined();
    expect(sortDirection).toBe('asc');
    expect(sharedSize).toBe('md');
    expect(sharedStatus).toBe('error');
  });
});
