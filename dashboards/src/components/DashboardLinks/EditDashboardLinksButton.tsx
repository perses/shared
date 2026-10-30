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
import type { Link } from '@perses-dev/spec';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import type { ReactElement } from 'react';
import { useRef, useState } from 'react';

import { TOOLTIP_TEXT, editButtonStyle } from '../../constants';
import { useDashboardLinks, useDashboardLinksActions } from '../../context';
import { DashboardLinksEditor } from './DashboardLinksEditor';

export interface EditDashboardLinksButtonProps extends Pick<ButtonProps, 'fullWidth'> {
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

export function EditDashboardLinksButton({
  variant = 'text',
  label = 'Links',
  color = 'primary',
  fullWidth,
}: EditDashboardLinksButtonProps): ReactElement {
  const [isLinksEditorOpen, setIsLinksEditorOpen] = useState(false);
  const links = useDashboardLinks();
  const { setLinks } = useDashboardLinksActions();

  const openLinksEditor = (): void => {
    setIsLinksEditorOpen(true);
  };

  const closeLinksEditor = (): void => {
    setIsLinksEditorOpen(false);
  };

  // Let the editor handle click out / Escape, so that it can ask for confirmation before discarding unsaved changes
  const editorRef = useRef<FormEditorHandle>(null);
  const handleDrawerClose = (): void => {
    if (editorRef.current) {
      editorRef.current.requestClose();
    } else {
      closeLinksEditor();
    }
  };

  return (
    <>
      <InfoTooltip description={TOOLTIP_TEXT.editLinks}>
        <Button
          startIcon={<PencilIcon />}
          onClick={openLinksEditor}
          aria-label={TOOLTIP_TEXT.editLinks}
          variant={variant}
          color={color}
          fullWidth={fullWidth}
          sx={editButtonStyle}
        >
          {label}
        </Button>
      </InfoTooltip>
      <Drawer
        isOpen={isLinksEditorOpen}
        onClose={handleDrawerClose}
        PaperProps={{ sx: { width: '50%' } }}
        data-testid="dashboard-links-editor"
      >
        <DashboardLinksEditor
          ref={editorRef}
          links={links}
          onCancel={closeLinksEditor}
          onChange={(updatedLinks: Link[]) => {
            setLinks?.(updatedLinks);
            setIsLinksEditorOpen(false);
          }}
        />
      </Drawer>
    </>
  );
}
