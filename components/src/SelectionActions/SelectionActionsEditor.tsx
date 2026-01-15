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

import { Button, Stack, Typography } from '@mui/material';
import { ReactElement, useState } from 'react';
import AddIcon from 'mdi-material-ui/Plus';
import { SelectionAction } from './selection-action-model';
import { SelectionActionForm } from './SelectionActionForm';

export interface SelectionActionsEditorProps {
  selectionActions: SelectionAction[];
  onChange: (selectionActions: SelectionAction[]) => void;
  availableColumns?: string[];
  sampleData?: Array<Record<string, unknown>>;
}

/**
 * Editor component for managing a list of selection actions
 */
export function SelectionActionsEditor({
  selectionActions,
  onChange,
  availableColumns = [],
  sampleData = [],
}: SelectionActionsEditorProps): ReactElement {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  function handleActionChange(index: number, action: SelectionAction): void {
    const updatedActions = [...selectionActions];
    updatedActions[index] = action;
    onChange(updatedActions);
  }

  function handleActionAdd(): void {
    const newAction: SelectionAction = {
      id: `action_${Date.now()}`,
      label: `Action ${selectionActions.length + 1}`,
      kind: 'callback',
      spec: { eventName: 'customAction' },
    };
    onChange([...selectionActions, newAction]);
    setExpandedIndex(selectionActions.length);
  }

  function handleActionDelete(index: number): void {
    const updatedActions = [...selectionActions];
    updatedActions.splice(index, 1);
    onChange(updatedActions);
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  }

  function handleMoveUp(index: number): void {
    if (index === 0) return;
    const updatedActions = [...selectionActions];
    const temp = updatedActions[index - 1];
    updatedActions[index - 1] = updatedActions[index]!;
    updatedActions[index] = temp!;
    onChange(updatedActions);
    if (expandedIndex === index) {
      setExpandedIndex(index - 1);
    } else if (expandedIndex === index - 1) {
      setExpandedIndex(index);
    }
  }

  function handleMoveDown(index: number): void {
    if (index === selectionActions.length - 1) return;
    const updatedActions = [...selectionActions];
    const temp = updatedActions[index];
    updatedActions[index] = updatedActions[index + 1]!;
    updatedActions[index + 1] = temp!;
    onChange(updatedActions);
    if (expandedIndex === index) {
      setExpandedIndex(index + 1);
    } else if (expandedIndex === index + 1) {
      setExpandedIndex(index);
    }
  }

  function handleToggleExpand(index: number): void {
    setExpandedIndex(expandedIndex === index ? null : index);
  }

  return (
    <Stack spacing={1}>
      {selectionActions.length === 0 ? (
        <Typography variant="body2" color="text.secondary" fontStyle="italic">
          No selection actions defined
        </Typography>
      ) : (
        selectionActions.map((action, index) => (
          <SelectionActionForm
            key={action.id}
            action={action}
            onChange={(updatedAction: SelectionAction) => handleActionChange(index, updatedAction)}
            onDelete={() => handleActionDelete(index)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            isExpanded={expandedIndex === index}
            onToggleExpand={() => handleToggleExpand(index)}
            isFirst={index === 0}
            isLast={index === selectionActions.length - 1}
            availableColumns={availableColumns}
            sampleData={sampleData}
          />
        ))
      )}

      <Button variant="contained" startIcon={<AddIcon />} sx={{ marginTop: 1 }} onClick={handleActionAdd}>
        Add Selection Action
      </Button>
    </Stack>
  );
}
