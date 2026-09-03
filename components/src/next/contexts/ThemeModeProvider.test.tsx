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

import { render, screen } from '@testing-library/react';

import { ThemeModeProvider } from './ThemeModeProvider';

describe('ThemeModeProvider', () => {
  it('sets data-perses-mode on its wrapper element', () => {
    render(
      <ThemeModeProvider mode="dark">
        <span data-testid="child">Content</span>
      </ThemeModeProvider>,
    );
    expect(screen.getByTestId('child').parentElement).toHaveAttribute('data-perses-mode', 'dark');
  });

  it('renders children', () => {
    render(
      <ThemeModeProvider mode="light">
        <span data-testid="child">Content</span>
      </ThemeModeProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('updates the wrapper when mode changes', () => {
    render(
      <ThemeModeProvider mode="light">
        <span data-testid="child">Content</span>
      </ThemeModeProvider>,
    );
    expect(screen.getByTestId('child').parentElement).toHaveAttribute('data-perses-mode', 'light');
  });

  it('does not set attributes on document.documentElement', () => {
    render(<ThemeModeProvider mode="dark">Content</ThemeModeProvider>);
    expect(document.documentElement).not.toHaveAttribute('data-perses-mode');
  });
});
