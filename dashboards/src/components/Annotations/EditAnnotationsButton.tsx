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
import type { AnnotationSpec } from '@perses-dev/spec';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import type { ReactElement } from 'react';
import { useRef, useState } from 'react';

import { TOOLTIP_TEXT, editButtonStyle } from '../../constants';
import { useAnnotationActions, useAnnotationSpecs } from '../../context';
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
  const annotationSpecs: AnnotationSpec[] = useAnnotationSpecs();
  const { setAnnotationSpecs } = useAnnotationActions();

  const openAnnotationEditor = (): void => {
    setIsAnnotationEditorOpen(true);
  };

  const closeAnnotationEditor = (): void => {
    setIsAnnotationEditorOpen(false);
  };

  // Let the editor handle click out / Escape, so that it can ask for confirmation before discarding unsaved changes
  const editorRef = useRef<FormEditorHandle>(null);
  const handleDrawerClose = (): void => {
    if (editorRef.current) {
      editorRef.current.requestClose();
    } else {
      closeAnnotationEditor();
    }
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
        onClose={handleDrawerClose}
        slotProps={{ paper: { sx: { width: '50%' } } }}
        data-testid="annotation-editor"
      >
        <AnnotationEditor
          ref={editorRef}
          annotationSpecs={annotationSpecs}
          onCancel={closeAnnotationEditor}
          onChange={(annotations: AnnotationSpec[]) => {
            setAnnotationSpecs(annotations);
            setIsAnnotationEditorOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
