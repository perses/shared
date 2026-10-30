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

import { useSyncExternalStore } from 'react';

import { BREAKPOINT_MIN_WIDTH, BREAKPOINT_ORDER } from './breakpoints';
import type { NamedBreakpoint } from './breakpoints';
import { isResponsiveValue } from './responsive';
import type { Responsive, ResponsiveObject } from './responsive';

const LARGEST_FIRST: readonly NamedBreakpoint[] = BREAKPOINT_ORDER.toReversed();

function mediaQueryList(breakpoint: NamedBreakpoint): MediaQueryList | undefined {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return undefined;
  }
  return window.matchMedia(`(min-width: ${BREAKPOINT_MIN_WIDTH[breakpoint]}px)`);
}

function subscribe(onChange: () => void): () => void {
  const lists = LARGEST_FIRST.map(mediaQueryList).filter((list) => list !== undefined);
  for (const list of lists) {
    list.addEventListener('change', onChange);
  }
  return () => {
    for (const list of lists) {
      list.removeEventListener('change', onChange);
    }
  };
}

function noopSubscribe(): () => void {
  return () => {};
}

function getActiveBreakpoint(): NamedBreakpoint | undefined {
  return LARGEST_FIRST.find((breakpoint) => mediaQueryList(breakpoint)?.matches);
}

function getServerBreakpoint(): undefined {
  return undefined;
}

function resolve<T>(value: ResponsiveObject<T>, active: NamedBreakpoint | undefined): T {
  const candidates = active === undefined ? [] : LARGEST_FIRST.slice(LARGEST_FIRST.indexOf(active));
  const match = candidates.find((breakpoint) => value[breakpoint] !== undefined);
  return (match === undefined ? value.default : value[match]) as T;
}

/**
 * Resolves a `Responsive<T>` value in JavaScript with the same mobile-first rules the CSS engine applies: the largest
 * matching breakpoint that has a value wins, otherwise `default`. Use it only when the value changes behaviour
 * (for example keyboard semantics), not just appearance; purely visual props should stay on the CSS engine.
 *
 * A plain value is returned as-is without subscribing to media queries. Without `window.matchMedia` (server
 * rendering, jsdom) a responsive object resolves to its `default` entry.
 *
 * @example
 * const orientation = useResponsiveValue({ default: 'horizontal', md: 'vertical' });
 */
export function useResponsiveValue<T>(value: Responsive<T>): T {
  const responsive = isResponsiveValue(value);
  const active = useSyncExternalStore(
    responsive ? subscribe : noopSubscribe,
    responsive ? getActiveBreakpoint : getServerBreakpoint,
    getServerBreakpoint,
  );
  return responsive ? resolve(value, active) : value;
}
