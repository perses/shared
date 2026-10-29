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

import type { FormEditorHandle } from '@perses-dev/components';
import type { AnnotationSpec } from '@perses-dev/spec';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { RefObject } from 'react';
import { createRef } from 'react';
import type { Mock } from 'vitest';

import { renderWithContext } from '../../test';
import { PanelAnnotationsEditor } from './PanelAnnotationsEditor';

// The preview fetches the annotation data, which is out of scope here
vi.mock('../Annotations/AnnotationEditorForm/AnnotationPreview', () => ({
  AnnotationPreview: (): null => null,
}));

describe('PanelAnnotationsEditor', () => {
  const annotations: AnnotationSpec[] = [
    { display: { name: 'Deployments' }, plugin: { kind: 'StaticAnnotation', spec: {} } },
  ];

  const renderComponent = (): { ref: RefObject<FormEditorHandle>; onChange: Mock } => {
    const ref = createRef<FormEditorHandle>();
    const onChange = vi.fn();
    renderWithContext(<PanelAnnotationsEditor value={annotations} onChange={onChange} annotationEditorFormRef={ref} />);
    return { ref, onChange };
  };

  const openAnnotationForm = async (): Promise<void> => {
    const row = screen.getByRole('row', { name: /Deployments/ });
    // Action buttons are: move up, move down, edit, delete
    const editButton = within(row).getAllByRole('button')[2];
    await userEvent.click(editButton!);
  };

  it('should not expose an annotation form handle while displaying the list', () => {
    const { ref } = renderComponent();
    expect(screen.getByRole('table', { name: 'table of panel annotations' })).toBeInTheDocument();
    expect(ref.current).toBeNull();
  });

  it('should go back to the list without confirmation when requesting close on an unchanged annotation', async () => {
    const { ref, onChange } = renderComponent();
    await openAnnotationForm();
    expect(ref.current).not.toBeNull();

    act(() => ref.current?.requestClose());

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'table of panel annotations' })).toBeInTheDocument();
    expect(ref.current).toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('should ask for confirmation when requesting close on an annotation with unapplied changes', async () => {
    const { ref, onChange } = renderComponent();
    await openAnnotationForm();

    const nameInput = screen.getByRole('textbox', { name: /Name/ });
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Releases');

    act(() => ref.current?.requestClose());

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/discard these changes/)).toBeInTheDocument();
    expect(ref.current).not.toBeNull();
    expect(onChange).not.toHaveBeenCalled();
  });
});
