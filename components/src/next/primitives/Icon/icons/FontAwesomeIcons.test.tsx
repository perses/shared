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

import { render } from '@testing-library/react';
import { createRef } from 'react';

import { AccountCircleIcon, AddIcon, ErrorIcon, InfoIcon, SuccessIcon, TrashIcon, WarningIcon } from '.';

describe('Font Awesome icons', () => {
  it('renders inline SVG path data', () => {
    const { container } = render(<AccountCircleIcon />);
    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('viewBox', '0 0 640 640');
    expect(svg).not.toHaveAttribute('aria-hidden');
    expect(svg?.querySelector('path')).toBeInTheDocument();
  });

  it('exports the shared icon names as SVG components', () => {
    const { container } = render(
      <>
        <AddIcon />
        <TrashIcon />
      </>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(2);
  });

  it('exports the status icons used by Alert and the default icon registry', () => {
    const { container } = render(
      <>
        <ErrorIcon />
        <InfoIcon />
        <SuccessIcon />
        <WarningIcon />
      </>,
    );

    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(4);
    icons.forEach((icon) => expect(icon).toHaveAttribute('viewBox', '0 0 512 512'));
    expect(container.querySelectorAll('path')).toHaveLength(4);
  });

  it('forwards SVG props and refs', () => {
    const ref = createRef<SVGSVGElement>();
    render(<AddIcon ref={ref} data-testid="add" aria-label="Add" />);

    expect(ref.current).toBeInstanceOf(SVGSVGElement);
    expect(ref.current).toHaveAttribute('aria-label', 'Add');
    expect(ref.current).toHaveAttribute('data-testid', 'add');
  });
});
