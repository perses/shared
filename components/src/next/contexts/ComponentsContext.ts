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

import { createContext, ComponentType, ReactNode, SVGProps } from 'react';

import type { AlertProps } from '../primitives/Alert';
import type { ButtonProps } from '../primitives/Button';
import type { SpinnerProps } from '../primitives/Spinner';

export interface PersesComponents {
  Button: ComponentType<ButtonProps>;
  Alert: ComponentType<AlertProps>;
  Spinner: ComponentType<SpinnerProps>;
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
   * No implicit defaults — import the primitives from `@perses-dev/components/next/primitives` and construct this
   * object, spreading in overrides as needed. Memoize or hoist to a stable reference to avoid unnecessary re-renders.
   *
   * @example
   * import { Alert, Button } from '@perses-dev/components/next/primitives';
   *
   * const components: PersesComponents = { Alert, Button };
   * // Override just one primitive:
   * const withCustomButton: PersesComponents = { ...components, Button: MyButton };
   *
   * @example
   * // Or start from the built-in defaults:
   * import { defaultComponents } from '@perses-dev/components/next/primitives/defaults';
   *
   * const withCustomButton: PersesComponents = { ...defaultComponents, Button: MyButton };
   */
  components: PersesComponents;
  /**
   * No implicit defaults — import the icon components from `@perses-dev/components/next/primitives` and construct
   * this object, spreading in overrides as needed. Memoize or hoist to a stable reference to avoid unnecessary
   * re-renders.
   *
   * @example
   * import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from '@perses-dev/components/next/primitives';
   *
   * const icons: PersesIcons = { Error: ErrorIcon, Info: InfoIcon, Success: SuccessIcon, Warning: WarningIcon };
   *
   * @example
   * // Or start from the built-in defaults:
   * import { defaultIcons } from '@perses-dev/components/next/primitives/defaults';
   *
   * const withCustomError: PersesIcons = { ...defaultIcons, Error: MyErrorIcon };
   */
  icons: PersesIcons;
  children?: ReactNode;
}

export const ComponentsContext = createContext<ComponentsContextValue | undefined>(undefined);
