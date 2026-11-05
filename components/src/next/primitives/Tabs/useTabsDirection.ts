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

import { useDirection } from '@base-ui/react/direction-provider';
import type { TextDirection } from '@base-ui/react/direction-provider';
import { useCallback, useSyncExternalStore } from 'react';

/** Align Base UI navigation with the list's computed direction. */
export function useTabsDirection(element: HTMLElement | null, dir: string | undefined): TextDirection {
  const inheritedDirection = useDirection();
  const getServerSnapshot = useCallback(
    (): TextDirection => (dir === 'ltr' || dir === 'rtl' ? dir : inheritedDirection),
    [dir, inheritedDirection],
  );
  const getSnapshot = useCallback((): TextDirection => {
    // Browsers resolve the list's own computed direction on the first pass. The ancestor walk and
    // `dir` attributes serve DOMs without CSS inheritance (jsdom), whose computed direction is empty.
    for (let ancestor = element; ancestor; ancestor = ancestor.parentElement) {
      const computedDirection = ancestor.ownerDocument.defaultView?.getComputedStyle(ancestor).direction;
      if (computedDirection === 'ltr' || computedDirection === 'rtl') return computedDirection;
      const attributeDirection = ancestor.getAttribute('dir');
      if (attributeDirection === 'ltr' || attributeDirection === 'rtl') return attributeDirection;
    }
    return getServerSnapshot();
  }, [element, getServerSnapshot]);
  const subscribe = useCallback(
    (onChange: () => void): (() => void) => {
      const ownerWindow = element?.ownerDocument.defaultView;
      if (!element || !ownerWindow) return () => {};
      // Inherited direction can change through any ancestor's `dir`, inline style or class, and
      // through media queries on resize. Each change costs one style read on the list.
      const observer = new ownerWindow.MutationObserver(onChange);
      for (let ancestor: HTMLElement | null = element; ancestor; ancestor = ancestor.parentElement) {
        observer.observe(ancestor, { attributes: true, attributeFilter: ['dir', 'style', 'class'] });
      }
      ownerWindow.addEventListener('resize', onChange);
      return () => {
        observer.disconnect();
        ownerWindow.removeEventListener('resize', onChange);
      };
    },
    [element],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
