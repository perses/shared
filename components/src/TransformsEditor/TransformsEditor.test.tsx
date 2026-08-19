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

import { render, screen, fireEvent } from '@testing-library/react';

import { TransformsEditor } from '.';
import { Transform } from '../model';

describe('TransformsEditor', () => {
  function renderTableColumnsEditor(value: Transform[], onChange = vi.fn()): void {
    render(<TransformsEditor value={value} onChange={onChange} />);
  }

  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('can add a new transformation', () => {
    const onChange = vi.fn();
    renderTableColumnsEditor([], onChange);
    const addColumnButton = screen.getByRole('button', { name: /Add Transformation/i });
    fireEvent.click(addColumnButton);
    expect(onChange).toHaveBeenCalledWith([{ kind: '', spec: {} }]);
  });

  it('can collapse and update a transformation', () => {
    const onChange = vi.fn();
    renderTableColumnsEditor([{ kind: 'MergeIndexedColumns', spec: { column: 'env' } }], onChange);

    // Expand the transform editor for the first transform
    const collapseIcon = screen.getByTestId('transform-toggle#0');
    fireEvent.click(collapseIcon);

    const columnInput = screen.getByRole('textbox', { name: /Column/i });
    fireEvent.change(columnInput, { target: { value: 'MySuperName' } });
    vi.advanceTimersByTime(500);
    expect(onChange).toHaveBeenCalledWith([{ kind: 'MergeIndexedColumns', spec: { column: 'MySuperName' } }]);
  });
});
