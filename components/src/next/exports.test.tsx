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

import { ComponentsProvider, useComponents } from './index';
import type { PersesComponents, PersesIcons, ComponentsProviderProps, ComponentsContextValue } from './index';

describe('next barrel exports', () => {
  it('exports the configuration API', () => {
    expect(ComponentsProvider).toBeDefined();
    expect(useComponents).toBeDefined();
  });

  it('exports the provider configuration types', () => {
    const assertTypesExist = (
      _components?: PersesComponents,
      _icons?: PersesIcons,
      _providerProps?: ComponentsProviderProps,
      _contextValue?: ComponentsContextValue,
    ): void => undefined;

    expect(assertTypesExist).toBeDefined();
  });
});
