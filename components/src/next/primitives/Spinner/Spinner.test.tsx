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

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('renders an svg', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('applies the ps-Spinner class', () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector('svg')).toHaveClass('ps-Spinner');
  });

  it('merges an additional className with ps-Spinner', () => {
    const { container } = render(<Spinner className="custom" />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('ps-Spinner');
    expect(svg).toHaveClass('custom');
  });
});
