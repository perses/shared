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

import { Switch } from '@mui/material';
import { ChangeEvent, ReactElement } from 'react';
import { OptionsEditorColumn } from '../OptionsEditorLayout/OptionsEditorColumn';
import { OptionsEditorControl } from '../OptionsEditorLayout/OptionsEditorControl';
import { OptionsEditorGrid } from '../OptionsEditorLayout/OptionsEditorGrid';
import { OptionsEditorGroup } from '../OptionsEditorLayout/OptionsEditorGroup';
import { SelectionAction, SelectionConfig } from './selection-action-model';
import { SelectionActionsEditor } from './SelectionActionsEditor';

export interface SelectionActionsSettingsEditorValue {
  selection?: SelectionConfig;
  selectionActions?: SelectionAction[];
}

export interface SelectionActionsSettingsEditorProps {
  /**
   * Current value containing selection and selectionActions configuration
   */
  value: SelectionActionsSettingsEditorValue;
  /**
   * Callback when the configuration changes
   */
  onChange: (value: SelectionActionsSettingsEditorValue) => void;
  /**
   * Available column names for condition and payload editors
   */
  availableColumns?: string[];
  /**
   * Sample data for payload preview
   */
  sampleData?: Array<Record<string, unknown>>;
}

/**
 * Reusable settings editor for selection and selection actions configuration.
 * Can be used by all table plugins (Table, TimeSeriesTable, LogsTable, TraceTable)
 * as well as chart plugins that support selection actions.
 *
 * Features:
 * - Enable/disable selection toggle
 * - Selection actions editor (visible when selection is enabled)
 */
export function SelectionActionsSettingsEditor({
  value,
  onChange,
  availableColumns = [],
  sampleData = [],
}: SelectionActionsSettingsEditorProps): ReactElement {
  function handleSelectionChange(_event: ChangeEvent, checked: boolean): void {
    onChange({
      ...value,
      selection: checked ? { enabled: true } : undefined,
    });
  }

  function handleSelectionActionsChange(selectionActions: SelectionAction[]): void {
    onChange({
      ...value,
      selectionActions: selectionActions.length > 0 ? selectionActions : undefined,
    });
  }

  return (
    <OptionsEditorGrid>
      <OptionsEditorColumn>
        <OptionsEditorGroup title="Selection Actions">
          <OptionsEditorControl
            label="Enable Selection"
            control={<Switch checked={!!value.selection?.enabled} onChange={handleSelectionChange} />}
          />
          {value.selection?.enabled && (
            <SelectionActionsEditor
              selectionActions={value.selectionActions ?? []}
              onChange={handleSelectionActionsChange}
              availableColumns={availableColumns}
              sampleData={sampleData}
            />
          )}
        </OptionsEditorGroup>
      </OptionsEditorColumn>
    </OptionsEditorGrid>
  );
}
