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

import type { ButtonProps } from '@mui/material';
import { Button } from '@mui/material';
import { Drawer, InfoTooltip } from '@perses-dev/components';
import type { FormEditorHandle } from '@perses-dev/components';
import { useBuiltinVariableDefinitions } from '@perses-dev/plugin-system';
import type { BuiltinVariableDefinition, VariableDefinition } from '@perses-dev/spec';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import type { ReactElement } from 'react';
import { useRef, useState } from 'react';

import { TOOLTIP_TEXT, editButtonStyle } from '../../constants';
import { useExternalVariableDefinitions, useVariableDefinitionActions, useVariableDefinitions } from '../../context';
import type { ExternalVariableDefinition } from '../../model/VariableDefinition';
import { VariableEditor } from './VariableEditor';

export interface EditVariablesButtonProps extends Pick<ButtonProps, 'fullWidth'> {
  /**
   * The variant to use to display the button.
   */
  variant?: 'text' | 'outlined';

  /**
   * The color to use to display the button.
   */
  color?: 'primary' | 'secondary';

  /**
   * The label used inside the button.
   */
  label?: string;
}

export function EditVariablesButton({
  variant = 'text',
  label = 'Variables',
  color = 'primary',
  fullWidth,
}: EditVariablesButtonProps): ReactElement {
  const [isVariableEditorOpen, setIsVariableEditorOpen] = useState(false);
  const variableDefinitions: VariableDefinition[] = useVariableDefinitions();
  const externalVariableDefinitions: ExternalVariableDefinition[] = useExternalVariableDefinitions();
  const builtinVariableDefinitions: BuiltinVariableDefinition[] = useBuiltinVariableDefinitions();
  const { setVariableDefinitions } = useVariableDefinitionActions();

  const openVariableEditor = (): void => {
    setIsVariableEditorOpen(true);
  };

  const closeVariableEditor = (): void => {
    setIsVariableEditorOpen(false);
  };

  // Let the editor handle click out / Escape, so that it can ask for confirmation before discarding unsaved changes
  const editorRef = useRef<FormEditorHandle>(null);
  const handleDrawerClose = (): void => {
    if (editorRef.current) {
      editorRef.current.requestClose();
    } else {
      closeVariableEditor();
    }
  };

  return (
    <>
      <InfoTooltip description={TOOLTIP_TEXT.editVariables}>
        <Button
          startIcon={<PencilIcon />}
          onClick={openVariableEditor}
          aria-label={TOOLTIP_TEXT.editVariables}
          variant={variant}
          color={color}
          fullWidth={fullWidth}
          sx={editButtonStyle}
        >
          {label}
        </Button>
      </InfoTooltip>
      <Drawer
        isOpen={isVariableEditorOpen}
        onClose={handleDrawerClose}
        PaperProps={{ sx: { width: '50%' } }}
        data-testid="variable-editor"
      >
        <VariableEditor
          ref={editorRef}
          variableDefinitions={variableDefinitions}
          externalVariableDefinitions={externalVariableDefinitions}
          builtinVariableDefinitions={builtinVariableDefinitions}
          onCancel={closeVariableEditor}
          onChange={(variables: VariableDefinition[]) => {
            setVariableDefinitions(variables);
            setIsVariableEditorOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
