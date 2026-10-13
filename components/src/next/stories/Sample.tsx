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

import type { CSSProperties, ReactElement, ReactNode } from 'react';

const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const codeStyle: CSSProperties = { display: 'block', color: '#555', fontSize: '0.8125rem' };
const stackStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1.5rem' };

export interface SampleProps {
  title: string;
  code?: string;
  children: ReactNode;
}

/** A labeled story example: a title, the prop usage as code, and the rendered result. */
export function Sample({ title, code, children }: SampleProps): ReactElement {
  return (
    <section style={sectionStyle}>
      <strong>{title}</strong>
      {code ? <code style={codeStyle}>{code}</code> : null}
      {children}
    </section>
  );
}

/** Vertical layout wrapper for a story's list of {@link Sample}s. */
export function Stack({ children }: { children: ReactNode }): ReactElement {
  return <div style={stackStyle}>{children}</div>;
}
