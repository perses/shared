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

import { Switch, SwitchProps } from '@mui/material';
import { OptionsEditorControl, OptionsEditorGroup } from '@perses-dev/components';
import { ReactElement } from 'react';

export interface SelectionOptions {
  enabled?: boolean;
}

export interface SelectionOptionsEditorProps {
  value?: SelectionOptions;
  onChange: (selection?: SelectionOptions) => void;
}

export function SelectionOptionsEditor({ value, onChange }: SelectionOptionsEditorProps): ReactElement {
  const handleEnabledChange: SwitchProps['onChange'] = (_: unknown, checked: boolean) => {
    onChange(checked ? { enabled: true } : undefined);
  };

  return (
    <OptionsEditorGroup title="Selection">
      <OptionsEditorControl
        label="Enable Selection"
        description="Allow selecting items to enable actions on selected data"
        control={<Switch checked={value?.enabled ?? false} onChange={handleEnabledChange} />}
      />
    </OptionsEditorGroup>
  );
}
