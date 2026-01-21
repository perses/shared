// Copyright 2024 The Perses Authors
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

import { ReactElement, useState } from 'react';
import { Button, ButtonProps } from '@mui/material';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import { Drawer, InfoTooltip } from '@perses-dev/components';
import { AnnotationDefinition } from '@perses-dev/core';
import { TOOLTIP_TEXT, editButtonStyle } from '../../constants';
import { useAnnotationDefinitionActions, useAnnotationDefinitions } from '../../context';
import { AnnotationEditor } from './AnnotationsEditor';

export interface EditAnnotationsButtonProps extends Pick<ButtonProps, 'fullWidth'> {
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

export function EditAnnotationsButton({
  variant = 'text',
  label = 'Annotations',
  color = 'primary',
  fullWidth,
}: EditAnnotationsButtonProps): ReactElement {
  const [isAnnotationEditorOpen, setIsAnnotationEditorOpen] = useState(false);
  const annotationDefinitions: AnnotationDefinition[] = useAnnotationDefinitions();
  const { setAnnotationDefinitions } = useAnnotationDefinitionActions();

  const openAnnotationEditor = (): void => {
    setIsAnnotationEditorOpen(true);
  };

  const closeAnnotationEditor = (): void => {
    setIsAnnotationEditorOpen(false);
  };

  return (
    <>
      <InfoTooltip description={TOOLTIP_TEXT.editAnnotations}>
        <Button
          startIcon={<PencilIcon />}
          onClick={openAnnotationEditor}
          aria-label={TOOLTIP_TEXT.editAnnotations}
          variant={variant}
          color={color}
          fullWidth={fullWidth}
          sx={editButtonStyle}
        >
          {label}
        </Button>
      </InfoTooltip>
      <Drawer
        isOpen={isAnnotationEditorOpen}
        onClose={closeAnnotationEditor}
        slotProps={{ paper: { sx: { width: '50%' } } }}
        data-testid="annotation-editor"
      >
        <AnnotationEditor
          annotationDefinitions={annotationDefinitions}
          onCancel={closeAnnotationEditor}
          onChange={(annotations: AnnotationDefinition[]) => {
            setAnnotationDefinitions(annotations);
            setIsAnnotationEditorOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
