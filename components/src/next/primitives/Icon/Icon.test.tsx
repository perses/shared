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

import { Icon } from './Icon';

describe('Icon', () => {
  it('renders its children', () => {
    const { getByTestId } = render(
      <Icon>
        <svg data-testid="child-svg" />
      </Icon>,
    );
    expect(getByTestId('child-svg')).toBeInTheDocument();
  });

  it('applies the ps-Icon class', () => {
    const { container } = render(<Icon>{null}</Icon>);
    expect(container.firstChild).toHaveClass('ps-Icon');
  });

  it('is hidden from the accessibility tree', () => {
    const { container } = render(<Icon>{null}</Icon>);
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
  });

  it('merges an additional className with ps-Icon', () => {
    const { container } = render(<Icon className="ps-Alert__icon">{null}</Icon>);
    expect(container.firstChild).toHaveClass('ps-Icon');
    expect(container.firstChild).toHaveClass('ps-Alert__icon');
  });

  it('forwards a ref to the underlying span', () => {
    const ref = createRef<HTMLSpanElement>();
    render(<Icon ref={ref}>{null}</Icon>);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });
});
