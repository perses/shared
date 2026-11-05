// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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

import { Drawer, ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import type { FormEditorHandle } from '@perses-dev/components';
import type { PanelEditorValues } from '@perses-dev/plugin-system';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useRef, useState } from 'react';

import { usePanelEditor, usePanelKey } from '../../context';
import { FixedValueVariableProvider } from '../Variables';
import { PanelEditorForm } from './PanelEditorForm';

/**
 * The Add/Edit panel drawer for editing a panel's options.
 */
export const PanelDrawer = (): ReactElement => {
  const panelEditor = usePanelEditor();
  const panelKey = usePanelKey(panelEditor?.panelGroupItemId);

  // When the user clicks close, start closing but don't call the store yet to keep values stable during animtation
  const [isClosing, setIsClosing] = useState(false);

  // Drawer is open if we have a model and we're not transitioning out
  const isOpen = panelEditor !== undefined && !isClosing;

  const handleSave = useCallback(
    (values: PanelEditorValues) => {
      // This shouldn't happen since we don't render the submit button until we have a model, but check to make TS happy
      if (panelEditor === undefined || values === undefined) {
        throw new Error('Cannot apply changes');
      }
      panelEditor.applyChanges(values);
      setIsClosing(true);
    },
    [panelEditor],
  );

  const handleClose = useCallback((): void => {
    setIsClosing(true);
  }, []);

  // Don't call closeDrawer on the store until the Drawer has completely transitioned out and reset close state
  const handleExited = useCallback(() => {
    panelEditor?.close();
    setIsClosing(false);
  }, [panelEditor]);

  // Let the form handle click out / Escape, so that it can ask for confirmation before discarding unsaved changes
  const formRef = useRef<FormEditorHandle>(null);
  const handleDrawerClose = useCallback((): void => {
    if (formRef.current) {
      formRef.current.requestClose();
    } else {
      handleClose();
    }
  }, [handleClose]);

  const drawer = useMemo(() => {
    return (
      <Drawer
        isOpen={isOpen}
        onClose={handleDrawerClose}
        slotProps={{ transition: { onExited: handleExited } }}
        data-testid="panel-editor"
      >
        {/* When the drawer is opened, we should have panel editor state (this also ensures the form state gets reset between opens) */}
        {panelEditor && (
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <PanelEditorForm
              ref={formRef}
              panelKey={panelKey}
              initialAction={panelEditor.mode}
              initialValues={panelEditor.initialValues}
              onSave={handleSave}
              onClose={handleClose}
            />
          </ErrorBoundary>
        )}
      </Drawer>
    );
  }, [handleClose, handleDrawerClose, handleExited, handleSave, isOpen, panelEditor, panelKey]);

  // If the panel editor is using a repeat variable, we need to wrap the drawer in a VariableContext.Provider
  if (panelEditor?.panelGroupItemId?.repeatVariable?.group) {
    const [variableName, value] = panelEditor.panelGroupItemId.repeatVariable.group;
    return (
      <FixedValueVariableProvider variableName={variableName} value={value}>
        {drawer}
      </FixedValueVariableProvider>
    );
  }

  return drawer;
};
