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

import { useVariableValues, VariableContext } from '@perses-dev/plugin-system';
import { VariableValue } from '@perses-dev/spec';
import { ReactElement, ReactNode } from 'react';

interface FixedValueVariableProviderProps {
  variableName: string;
  value: VariableValue;
  children: ReactNode;
}

export function FixedValueVariableProvider({
  variableName,
  value,
  children,
}: FixedValueVariableProviderProps): ReactElement {
  const variables = useVariableValues();
  return (
    <VariableContext.Provider
      value={{
        state: {
          ...variables,
          [variableName]: { ...variables[variableName], value, displayValue: value, loading: false },
        },
      }}
    >
      {children}
    </VariableContext.Provider>
  );
}
