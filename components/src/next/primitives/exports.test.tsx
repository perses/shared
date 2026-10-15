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

import { Alert, Box, Button, Chip, Divider, Icon, Spinner, Stack, Switch } from './index';
import type {
  AlertProps,
  AlertSeverity,
  BoxProps,
  ButtonProps,
  ButtonVariant,
  ChipColor,
  ChipProps,
  ChipSize,
  ChipVariant,
  ColorVariant,
  DividerProps,
  IconProps,
  SpacingToken,
  Size,
  SpinnerProps,
  StackProps,
  Status,
  SwitchProps,
} from './index';

describe('primitives barrel exports', () => {
  it('exports the concrete component implementations', () => {
    expect(Alert).toBeDefined();
    expect(Box).toBeDefined();
    expect(Button).toBeDefined();
    expect(Chip).toBeDefined();
    expect(Divider).toBeDefined();
    expect(Icon).toBeDefined();
    expect(Spinner).toBeDefined();
    expect(Stack).toBeDefined();
    expect(Switch).toBeDefined();
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
    const chipProps: ChipProps = { children: 'Production' };
    const chipColor: ChipColor = 'secondary';
    const chipSize: ChipSize = 'xs';
    const chipVariant: ChipVariant = 'outline';
    const dividerProps: DividerProps = {};
    const iconProps: IconProps = {};
    const spinnerProps: SpinnerProps = {};
    const stackProps: StackProps = {};
    const switchProps: SwitchProps = {};

    expect(alertProps).toBeDefined();
    expect(severity).toBe('info');
    expect(boxProps).toBeDefined();
    expect(spacingToken).toBe('md');
    expect(buttonProps).toBeDefined();
    expect(variant).toBe('solid');
    expect(color).toBe('primary');
    expect(size).toBe('md');
    expect(chipProps).toBeDefined();
    expect(chipColor).toBe('secondary');
    expect(chipSize).toBe('xs');
    expect(chipVariant).toBe('outline');
    expect(dividerProps).toBeDefined();
    expect(iconProps).toBeDefined();
    expect(spinnerProps).toBeDefined();
    expect(stackProps).toBeDefined();
    expect(switchProps).toBeDefined();
  });
});
