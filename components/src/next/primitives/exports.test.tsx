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

import { Alert, Button, Icon, Spinner } from './index';
import type {
  AlertProps,
  AlertSeverity,
  ButtonColor,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  IconProps,
  SpinnerProps,
} from './index';

describe('primitives barrel exports', () => {
  it('exports the concrete component implementations', () => {
    expect(Alert).toBeDefined();
    expect(Button).toBeDefined();
    expect(Icon).toBeDefined();
    expect(Spinner).toBeDefined();
  });

  it('exports their prop types', () => {
    const alertProps: AlertProps = {};
    const severity: AlertSeverity = 'info';
    const buttonProps: ButtonProps = {};
    const variant: ButtonVariant = 'solid';
    const color: ButtonColor = 'primary';
    const size: ButtonSize = 'md';
    const iconProps: IconProps = {};
    const spinnerProps: SpinnerProps = {};

    expect(alertProps).toBeDefined();
    expect(severity).toBe('info');
    expect(buttonProps).toBeDefined();
    expect(variant).toBe('solid');
    expect(color).toBe('primary');
    expect(size).toBe('md');
    expect(iconProps).toBeDefined();
    expect(spinnerProps).toBeDefined();
  });
});
