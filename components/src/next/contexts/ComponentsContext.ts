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
  ComponentType,
  ForwardRefExoticComponent,
  PropsWithoutRef,
  ReactNode,
  RefAttributes,
  SVGProps,
} from 'react';
import { createContext } from 'react';

import type { AlertProps } from '../primitives/Alert';
import type { BoxProps } from '../primitives/Box';
import type { ButtonProps } from '../primitives/Button';
import type { CheckboxProps } from '../primitives/Checkbox';
import type { ChipProps } from '../primitives/Chip';
import type { DividerProps } from '../primitives/Divider';
import type { IconButtonProps } from '../primitives/IconButton';
import type { SpinnerProps } from '../primitives/Spinner';
import type { StackProps } from '../primitives/Stack';
import type { SwitchProps } from '../primitives/Switch';
import type {
  TableBodyProps,
  TableCellProps,
  TableContainerProps,
  TableFooterProps,
  TableHeadProps,
  TablePaginationProps,
  TableProps,
  TableRowExpandButtonProps,
  TableRowProps,
  TableSortLabelProps,
} from '../primitives/Table';
import type { TooltipProps } from '../primitives/Tooltip';

type RefComponent<Props, Element> = ForwardRefExoticComponent<PropsWithoutRef<Props> & RefAttributes<Element>>;

/**
 * Complete set of replaceable Perses primitives. Every entry is required so consumers can rely on a component being
 * available. Applications that only override some primitives should spread `defaultComponents` into their map.
 */
export interface PersesComponents {
  Button: RefComponent<ButtonProps, HTMLButtonElement>;
  IconButton: RefComponent<IconButtonProps, HTMLButtonElement>;
  Alert: RefComponent<AlertProps, HTMLDivElement>;
  Checkbox: RefComponent<CheckboxProps, HTMLElement>;
  Chip: RefComponent<ChipProps, HTMLDivElement>;
  Divider: ComponentType<DividerProps>;
  Spinner: ComponentType<SpinnerProps>;
  Box: RefComponent<BoxProps, HTMLDivElement>;
  Stack: RefComponent<StackProps, HTMLDivElement>;
  Switch: RefComponent<SwitchProps, HTMLElement>;
  Tooltip: RefComponent<TooltipProps, HTMLDivElement>;
  Table: RefComponent<TableProps, HTMLTableElement>;
  TableHead: RefComponent<TableHeadProps, HTMLTableSectionElement>;
  TableBody: RefComponent<TableBodyProps, HTMLTableSectionElement>;
  TableFooter: RefComponent<TableFooterProps, HTMLTableSectionElement>;
  TableRow: RefComponent<TableRowProps, HTMLTableRowElement>;
  TableCell: RefComponent<TableCellProps, HTMLTableCellElement>;
  TableContainer: RefComponent<TableContainerProps, HTMLDivElement>;
  TableRowExpandButton: RefComponent<TableRowExpandButtonProps, HTMLButtonElement>;
  TableSortLabel: RefComponent<TableSortLabelProps, HTMLButtonElement>;
  TablePagination: RefComponent<TablePaginationProps, HTMLDivElement>;
}

export interface PersesIcons {
  Error: ComponentType<SVGProps<SVGSVGElement>>;
  Info: ComponentType<SVGProps<SVGSVGElement>>;
  Success: ComponentType<SVGProps<SVGSVGElement>>;
  Warning: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface ComponentsContextValue {
  components: PersesComponents;
  icons: PersesIcons;
}

export interface ComponentsProviderProps {
  /**
   * Map of components that will be loaded when using the `useComponents` hook.
   *
   * @example
   * // Use the default components
   * import { defaultComponents } from '@perses-dev/components/next/primitives/defaults';
   *
   * const components: PersesComponents = defaultComponents;
   *
   * @example
   * // Override one component, spreading over the defaults
   * import { defaultComponents } from '@perses-dev/components/next/primitives/defaults';
   *
   * const components: PersesComponents = { ...defaultComponents, Button: MyButton };
   *
   * @example
   * // Provide only custom components
   * const components: PersesComponents = {
   *   Alert: MyAlert,
   *   Box: MyBox,
   *   Button: MyButton,
   *   Chip: MyChip,
   *   IconButton: MyIconButton,
   *   Checkbox: MyCheckbox,
   *   Switch: MySwitch,
   *   Divider: MyDivider,
   *   Spinner: MySpinner,
   *   Stack: MyStack,
   *   Tooltip: MyTooltip,
   *   Table: MyTable,
   *   TableHead: MyTableHead,
   *   TableBody: MyTableBody,
   *   TableFooter: MyTableFooter,
   *   TableRow: MyTableRow,
   *   TableCell: MyTableCell,
   *   TableContainer: MyTableContainer,
   *   TableRowExpandButton: MyTableRowExpandButton,
   *   TableSortLabel: MyTableSortLabel,
   *   TablePagination: MyTablePagination,
   * };
   */
  components: PersesComponents;
  /**
   * Map of icons that will be loaded when using the `useComponents` hook.
   *
   * @example
   * // Use the default icons
   * import { defaultIcons } from '@perses-dev/components/next/primitives/defaults';
   *
   * const icons: PersesIcons = defaultIcons;
   *
   * @example
   * // Override one icon, spreading over the defaults
   * import { defaultIcons } from '@perses-dev/components/next/primitives/defaults';
   *
   * const icons: PersesIcons = { ...defaultIcons, Error: MyErrorIcon };
   *
   * @example
   * // Provide all custom icons
   * const icons: PersesIcons = { Error: MyErrorIcon, Info: MyInfoIcon, Success: MySuccessIcon, Warning: MyWarningIcon };
   */
  icons: PersesIcons;
  children?: ReactNode;
}

export const ComponentsContext = createContext<ComponentsContextValue | undefined>(undefined);
