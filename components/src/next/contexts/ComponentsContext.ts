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
   * const components: PersesComponents = { Alert: MyAlert, Button: MyButton, Spinner: MySpinner };
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
