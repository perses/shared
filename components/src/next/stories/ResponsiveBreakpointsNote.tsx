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

import type { ReactElement } from 'react';

/** Story intro explaining responsive style props and the breakpoint ranges. Shared by primitive stories. */
export function ResponsiveBreakpointsNote(): ReactElement {
  return (
    <>
      <p>Every style prop accepts a responsive object. Resize the viewport to see the values change.</p>
      <ul>
        <li>
          <code>default</code> — base / fallback
        </li>
        <li>
          <code>xs</code> ≤ 599 · <code>sm</code> 600–899 · <code>md</code> 900–1199 · <code>lg</code> 1200–1535 ·{' '}
          <code>xl</code> ≥ 1536 (px)
        </li>
        <li>
          A breakpoint with no value falls back to <code>default</code>, not the next-smaller one.
        </li>
      </ul>
    </>
  );
}
