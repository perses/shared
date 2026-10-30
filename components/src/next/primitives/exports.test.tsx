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

import type {
  AlertProps,
  AlertSeverity,
  BoxProps,
  ButtonProps,
  ButtonVariant,
  CardContentProps,
  CardHeaderProps,
  CardProps,
  CardVariant,
  CheckboxProps,
  ChipProps,
  ChipSize,
  ChipStyle,
  ChipVariant,
  ColorVariant,
  DividerProps,
  IconProps,
  Size,
  SortDirection,
  SpacingValue,
  SpinnerProps,
  StackProps,
  Status,
  SwitchProps,
  TableCellProps,
  TableProps,
  TableRowProps,
  TabListProps,
  TabListVariant,
  TabPanelProps,
  TabProps,
  TabsOrientation,
  TabsProps,
  TabStyle,
  TabsValue,
  TextFieldProps,
  TextFieldStyle,
  TextHelperProps,
  TextProps,
  TooltipProps,
} from './index';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
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
  TableContainer,
  TableFooter,
  TableHead,
  TablePagination,
  TableRow,
  TableRowExpandButton,
  TableSortLabel,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  TextField,
  TextHelper,
  Tooltip,
  useResponsiveValue,
} from './index';

describe('primitives barrel exports', () => {
  it('exports the concrete component implementations', () => {
    expect(Alert).toBeDefined();
    expect(Box).toBeDefined();
    expect(Button).toBeDefined();
    expect(Card).toBeDefined();
    expect(CardHeader).toBeDefined();
    expect(CardContent).toBeDefined();
    expect(Checkbox).toBeDefined();
    expect(Chip).toBeDefined();
    expect(Divider).toBeDefined();
    expect(Icon).toBeDefined();
    expect(Spinner).toBeDefined();
    expect(Stack).toBeDefined();
    expect(Switch).toBeDefined();
    expect(Tooltip).toBeDefined();
    expect(useResponsiveValue).toBeDefined();
    expect(Table).toBeDefined();
    expect(TableBody).toBeDefined();
    expect(TableCell).toBeDefined();
    expect(TableContainer).toBeDefined();
    expect(TableFooter).toBeDefined();
    expect(TableHead).toBeDefined();
    expect(TablePagination).toBeDefined();
    expect(TableRow).toBeDefined();
    expect(TableRowExpandButton).toBeDefined();
    expect(TableSortLabel).toBeDefined();
    expect(Tabs).toBeDefined();
    expect(TabList).toBeDefined();
    expect(Tab).toBeDefined();
    expect(TabPanel).toBeDefined();
    expect(TextField).toBeDefined();
    expect(Text).toBeDefined();
    expect(TextHelper).toBeDefined();
  });

  it('exports their prop types', () => {
    const alertProps: AlertProps = {};
    const severity: AlertSeverity = 'info';
    const spacingToken: SpacingValue = 'md';
    const spacingValue: SpacingValue = 100;
    const boxProps: BoxProps = { p: { default: spacingToken, md: spacingValue, xl: '50%' } };
    const buttonProps: ButtonProps = {};
    const variant: ButtonVariant = 'solid';
    const cardProps: CardProps = {};
    const cardHeaderProps: CardHeaderProps = {};
    const cardContentProps: CardContentProps = {};
    const cardVariant: CardVariant = 'outline';
    const color: ColorVariant | Status = 'primary';
    const size: Size = 'md';
    const checkboxProps: CheckboxProps = { 'aria-label': 'Select' };
    const checkboxColor: ColorVariant = 'primary';
    const checkboxSize: Size = 'md';
    const chipProps: ChipProps = { children: 'Production' };
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
    const tabsProps: TabsProps = { defaultValue: 'one' };
    const tabsValue: TabsValue = 1;
    const tabsOrientation: TabsOrientation = 'vertical';
    const tabListProps: TabListProps = { 'aria-label': 'Sections' };
    const tabListVariant: TabListVariant = 'scrollable';
    const tabProps: TabProps = { value: 'one' };
    const tabStyle: TabStyle = { '--perses-tab-min-height': '3rem' };
    const tabPanelProps: TabPanelProps = { value: 'one' };
    const textFieldProps: TextFieldProps = { label: 'Name' };
    const textFieldStyle: TextFieldStyle = { '--perses-textfield-size-md': '2.5rem' };
    const textProps: TextProps = { as: 'p', size: 'sm', weight: 'medium', color: 'secondary' };
    const textHelperProps: TextHelperProps = { status: 'error' };

    expect(alertProps).toBeDefined();
    expect(severity).toBe('info');
    expect(boxProps).toBeDefined();
    expect(spacingToken).toBe('md');
    expect(spacingValue).toBe(100);
    expect(buttonProps).toBeDefined();
    expect(variant).toBe('solid');
    expect(color).toBe('primary');
    expect(size).toBe('md');
    expect(cardProps).toBeDefined();
    expect(cardHeaderProps).toBeDefined();
    expect(cardContentProps).toBeDefined();
    expect(cardVariant).toBe('outline');
    expect(checkboxProps).toBeDefined();
    expect(checkboxColor).toBe('primary');
    expect(checkboxSize).toBe('md');
    expect(chipProps).toBeDefined();
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
    expect(tabsProps).toBeDefined();
    expect(tabsValue).toBe(1);
    expect(tabsOrientation).toBe('vertical');
    expect(tabListProps).toBeDefined();
    expect(tabListVariant).toBe('scrollable');
    expect(tabProps).toBeDefined();
    expect(tabStyle).toBeDefined();
    expect(tabPanelProps).toBeDefined();
    expect(textFieldProps).toBeDefined();
    expect(textFieldStyle).toBeDefined();
    expect(textProps).toBeDefined();
    expect(textHelperProps).toBeDefined();
  });
});
