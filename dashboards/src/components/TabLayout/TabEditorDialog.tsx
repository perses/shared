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

import { FormEventHandler, ReactElement, useEffect, useState } from 'react';
import { Checkbox, FormControl, FormControlLabel, TextField } from '@mui/material';
import { Dialog } from '@perses-dev/components';

const tabEditorFormId = 'tab-editor-form';

export interface TabEditorDialogProps {
  open: boolean;
  tabName: string;
  isDefault: boolean;
  onSubmit: (name: string, isDefault: boolean) => void;
  onClose: () => void;
}

export function TabEditorDialog(props: TabEditorDialogProps): ReactElement {
  const { open, tabName, isDefault, onSubmit, onClose } = props;

  const [name, setName] = useState(tabName);
  const [defaultTab, setDefaultTab] = useState(isDefault);

  useEffect(() => {
    if (open) {
      setName(tabName);
      setDefaultTab(isDefault);
    }
  }, [open, tabName, isDefault]);

  const handleSubmit: FormEventHandler = (e) => {
    e.preventDefault();
    if (name.trim() !== '') {
      onSubmit(name.trim(), defaultTab);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <Dialog.Header onClose={onClose}>Edit Tab</Dialog.Header>
      <Dialog.Content sx={{ width: '400px' }}>
        <form id={tabEditorFormId} onSubmit={handleSubmit}>
          <FormControl fullWidth margin="normal">
            <TextField
              required
              label="Tab Name"
              variant="outlined"
              value={name}
              onChange={(e) => setName(e.target.value)}
              data-testid="tab-editor-name"
            />
          </FormControl>
          <FormControl fullWidth margin="normal">
            <FormControlLabel
              control={
                <Checkbox
                  checked={defaultTab}
                  onChange={(e) => setDefaultTab(e.target.checked)}
                  data-testid="tab-editor-default"
                />
              }
              label="Set as default tab"
            />
          </FormControl>
        </form>
      </Dialog.Content>
      <Dialog.Actions>
        <Dialog.PrimaryButton form={tabEditorFormId}>Apply</Dialog.PrimaryButton>
        <Dialog.SecondaryButton onClick={onClose}>Cancel</Dialog.SecondaryButton>
      </Dialog.Actions>
    </Dialog>
  );
}
