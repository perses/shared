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

import { useEffect, useState, MutableRefObject, ForwardedRef, ReactElement, ReactNode, RefObject } from 'react';

export const PF_FONT =
  '"RedHatText", "Red Hat Text", "Overpass", -apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif';

export function useDarkMode(elementRef: RefObject<HTMLElement | null>): boolean {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const el = elementRef.current;
    if (!el) return undefined;
    const modeEl = el.closest('[data-perses-mode]');
    if (!modeEl) return undefined;
    const update = (): void => setIsDark(modeEl.getAttribute('data-perses-mode') === 'dark');
    update();
    const observer = new MutationObserver(update);
    observer.observe(modeEl, { attributes: true, attributeFilter: ['data-perses-mode'] });
    return (): void => observer.disconnect();
  }, [elementRef]);

  return isDark;
}

export function mergeRefs<T>(
  innerRef: MutableRefObject<T | null>,
  outerRef: ForwardedRef<T>,
): (node: T | null) => void {
  return (node: T | null): void => {
    innerRef.current = node;
    if (typeof outerRef === 'function') {
      outerRef(node);
    } else if (outerRef) {
      (outerRef as MutableRefObject<T | null>).current = node;
    }
  };
}

export function PfDivider(): ReactElement {
  return <hr style={{ border: 'none', borderTop: '1px solid #D2D2D2', margin: '0.5rem 0' }} />;
}

export function PfRow({ children, label }: { children: ReactNode; label?: string }): ReactElement {
  return (
    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
      {label && <span style={{ width: '5rem', fontSize: '0.7rem', color: '#6A6E73', flexShrink: 0 }}>{label}</span>}
      {children}
    </div>
  );
}
