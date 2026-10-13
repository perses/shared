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

import * as adapter from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { render, screen } from '@testing-library/react';
import { createRef } from 'react';

import { DragAndDropElement } from './DragAndDropList';
import { DragButton } from './DragButton';

vi.mock('@atlaskit/pragmatic-drag-and-drop/element/adapter', async (importOriginal) => {
  const actual = await importOriginal<typeof adapter>();
  return { ...actual, draggable: vi.fn(actual.draggable) };
});

const draggableMock = vi.mocked(adapter.draggable);
const DATA = { id: 'a' };

function getLastDraggableArgs(): Parameters<typeof adapter.draggable>[0] | undefined {
  return draggableMock.mock.lastCall?.[0];
}

describe('DragAndDropElement', () => {
  beforeEach(() => {
    draggableMock.mockClear();
  });

  it('should only be draggable from the drag handle when dragHandleRef is provided', () => {
    const dragHandleRef = createRef<HTMLButtonElement>();
    render(
      <DragAndDropElement data={DATA} dragHandleRef={dragHandleRef}>
        <span>content</span>
        <DragButton ref={dragHandleRef} />
      </DragAndDropElement>,
    );

    const args = getLastDraggableArgs();
    expect(args?.dragHandle).toBe(screen.getByRole('button', { name: 'move' }));
    expect(args?.element).toContainElement(screen.getByText('content'));
  });

  it('should be draggable from anywhere when dragHandleRef is not provided', () => {
    render(
      <DragAndDropElement data={DATA}>
        <span>content</span>
        <DragButton />
      </DragAndDropElement>,
    );

    const args = getLastDraggableArgs();
    expect(args?.element).toContainElement(screen.getByText('content'));
    expect(args?.dragHandle).toBeUndefined();
  });
});
