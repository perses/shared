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

import { ReactElement, ReactNode, useEffect } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface ThemeModeProviderProps {
  mode: ThemeMode;
  children?: ReactNode;
}

/**
 * Applies `data-perses-mode` to the document root so design-tokens' dark mode
 * CSS variables take effect, and to a wrapping element for scoped consumers.
 */
const WRAPPER_STYLE = { minHeight: '100vh' } as const;

export function ThemeModeProvider({ mode, children }: ThemeModeProviderProps): ReactElement {
  useEffect(() => {
    document.documentElement.setAttribute('data-perses-mode', mode);
    return () => document.documentElement.removeAttribute('data-perses-mode');
  }, [mode]);

  return (
    <div data-perses-mode={mode} style={WRAPPER_STYLE}>
      {children}
    </div>
  );
}
