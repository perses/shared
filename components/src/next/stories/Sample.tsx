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

import { useCallback, useState } from 'react';
import type { CSSProperties, MouseEvent, ReactElement, ReactNode } from 'react';

const sectionStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '0.5rem' };
const titleStyle: CSSProperties = { fontWeight: 600, color: 'var(--perses-text-primary)' };
const cardStyle: CSSProperties = {
  border: '1px solid var(--perses-border-default)',
  borderRadius: 6,
  overflow: 'hidden',
  background: 'var(--perses-bg-default)',
};
const previewStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' };
const previewLabelStyle: CSSProperties = {
  fontSize: '0.6875rem',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--perses-text-secondary)',
};
const toolbarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'stretch',
  justifyContent: 'space-between',
  borderTop: '1px solid var(--perses-border-default)',
  background: 'var(--perses-bg-sunken)',
};
const tabsStyle: CSSProperties = { display: 'flex' };
const tabStyle: CSSProperties = {
  border: 'none',
  background: 'transparent',
  padding: '0.45rem 0.9rem',
  fontSize: '0.8125rem',
  fontFamily: 'inherit',
  color: 'var(--perses-text-secondary)',
  cursor: 'pointer',
};
const activeTabStyle: CSSProperties = {
  ...tabStyle,
  color: 'var(--perses-text-primary)',
  fontWeight: 600,
  boxShadow: 'inset 0 -2px 0 var(--perses-text-accent)',
};
const toggleStyle: CSSProperties = { ...tabStyle, color: 'var(--perses-text-link)', width:'100%' };
const preStyle: CSSProperties = {
  margin: 0,
  padding: '1rem',
  borderTop: '1px solid var(--perses-border-default)',
  background: 'var(--perses-bg-sunken)',
  overflowX: 'auto',
  fontSize: '0.8125rem',
  lineHeight: 1.5,
  color: 'var(--perses-text-primary)',
};
const codeStyle: CSSProperties = {
  whiteSpace: 'pre',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

export interface SampleFile {
  name: string;
  code: string;
}

export interface SampleProps {
  title: string;
  code?: string | SampleFile[];
  children: ReactNode;
  defaultOpen?: boolean;
}

function toFiles(code: SampleProps['code']): SampleFile[] {
  if (code === undefined) return [];
  if (typeof code === 'string') return [{ name: 'Example', code }];
  return code;
}

export function Sample({ title, code, children, defaultOpen = false }: SampleProps): ReactElement {
  const files = toFiles(code);
  const [open, setOpen] = useState(defaultOpen);
  const [active, setActive] = useState(0);

  const toggle = useCallback(() => setOpen((value) => !value), []);
  const selectTab = useCallback((event: MouseEvent<HTMLButtonElement>) => {
    setActive(Number(event.currentTarget.dataset.index));
  }, []);

  return (
    <section style={sectionStyle}>
      <strong style={titleStyle}>{title}</strong>
      <div style={cardStyle}>
        <div style={previewStyle}>
          <span style={previewLabelStyle}>Preview</span>
          {children}
        </div>
        {files.length > 0 ? (
          <div>
            <div style={toolbarStyle}>
              <div style={tabsStyle}>
                {files.length > 1
                  ? files.map((file, index) => (
                      <button
                        key={file.name}
                        type="button"
                        data-index={index}
                        aria-pressed={index === active}
                        onClick={selectTab}
                        style={index === active ? activeTabStyle : tabStyle}
                      >
                        {file.name}
                      </button>
                    ))
                  : null}
              </div>
              <button type="button" onClick={toggle} aria-expanded={open} style={toggleStyle}>
                {open ? 'Hide code' : 'Show code'}
              </button>
            </div>
            {open ? (
              <pre style={preStyle}>
                <code style={codeStyle}>{files[active]?.code ?? ''}</code>
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const stackStyle: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '1.5rem' };

export function Stack({ children }: { children: ReactNode }): ReactElement {
  return <div style={stackStyle}>{children}</div>;
}
