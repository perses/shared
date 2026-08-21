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

import { Button, Alert, Icon, Spinner } from './index';
import type {
  ButtonProps,
  ButtonVariant,
  ButtonColor,
  ButtonSize,
  AlertProps,
  AlertSeverity,
  IconProps,
  SpinnerProps,
} from './index';

describe('next barrel exports', () => {
  it('exports Button component', () => {
    expect(Button).toBeDefined();
  });

  it('exports Alert component', () => {
    expect(Alert).toBeDefined();
  });

  it('exports Icon component', () => {
    expect(Icon).toBeDefined();
  });

  it('exports Spinner component', () => {
    expect(Spinner).toBeDefined();
  });

  it('exports type interfaces', () => {
    const buttonProps: ButtonProps = {};
    const variant: ButtonVariant = 'solid';
    const color: ButtonColor = 'primary';
    const size: ButtonSize = 'md';
    const alertProps: AlertProps = {};
    const severity: AlertSeverity = 'info';
    const iconProps: IconProps = {};
    const spinnerProps: SpinnerProps = {};

    expect(buttonProps).toBeDefined();
    expect(variant).toBe('solid');
    expect(color).toBe('primary');
    expect(size).toBe('md');
    expect(alertProps).toBeDefined();
    expect(severity).toBe('info');
    expect(iconProps).toBeDefined();
    expect(spinnerProps).toBeDefined();
  });
});
