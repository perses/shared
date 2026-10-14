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

import clsx from 'clsx';
import type { CSSProperties } from 'react';

import { isResponsiveValue } from './responsive';
import type { Responsive } from './responsive';

// Serializes a style prop value into the string written to its `--ps-*` custom property.
export type StyleValueTransform<T> = (value: T) => string;

// A style-prop category: maps each (camelCase) prop name to its transform.
export type StylePropRegistry = Record<string, StyleValueTransform<never>>;

// Numbers are pixels; strings pass through and must carry their own units (`'100%'`, `'calc(...)'`).
export const lengthTransform: StyleValueTransform<string | number> = (value) =>
  typeof value === 'number' ? `${value}px` : value;

// Written verbatim: CSS keywords (`block`) and unitless numbers (`flex`, `z-index`).
export const keywordTransform: StyleValueTransform<string | number> = (value) => String(value);

// `flexDirection` → `flex-direction`: CSS stays kebab while registries key on prop names.
function cssName(prop: string): string {
  return prop.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function writeStyleProp(
  varPrefix: string,
  value: Responsive<unknown>,
  transform: (value: unknown) => string,
  target: Record<string, string>,
): void {
  // Common case: a single base value, written to `--ps-<name>` with no intermediate allocation.
  if (!isResponsiveValue(value)) {
    target[varPrefix] = transform(value);
    return;
  }
  // Responsive object: base goes to `--ps-<name>`, every other breakpoint to `--ps-<name>-<bp>`.
  for (const [breakpoint, breakpointValue] of Object.entries(value)) {
    if (breakpointValue === undefined) continue;
    target[breakpoint === 'default' ? varPrefix : `${varPrefix}-${breakpoint}`] = transform(breakpointValue);
  }
}

interface CompiledStyleProp {
  prop: string;
  className: string;
  varPrefix: string;
  transform: (value: unknown) => string;
}

// Combines all the prop names from a list of registries into one type, e.g. combining
// SpacingProps and SizingProps gives 'p' | 'width' | 'maxWidth'. This is what lets `rest` below
// know exactly which props were registered, with no manual list and no casts needed.
type RegistryKeys<Registries extends readonly StylePropRegistry[]> = {
  [Index in keyof Registries]: keyof Registries[Index];
}[number] &
  string;

// The portion of a component's style-prop setup that is fixed (class names, kebab-casing, the key
// set) rather than per-render. Built once per component via {@link compileStyleProps}.
// `K` is the set of prop names it knows about, used later so `applyStyleProps` can type `rest`
// correctly.
export interface CompiledStyleProps<K extends string = string> {
  props: CompiledStyleProp[];
  keys: Set<K>;
}

/** Precomputes the per-render-invariant lookup for a set of categories. Call once, at module scope. */
export function compileStyleProps<const Registries extends readonly StylePropRegistry[]>(
  registries: Registries,
): CompiledStyleProps<RegistryKeys<Registries>> {
  const props: CompiledStyleProp[] = [];
  const keys = new Set<string>();
  for (const registry of registries) {
    for (const prop in registry) {
      if (keys.has(prop)) continue;
      keys.add(prop);
      const name = cssName(prop);
      props.push({
        prop,
        className: `ps-${name}`,
        varPrefix: `--ps-${name}`,
        transform: registry[prop] as (value: unknown) => string,
      });
    }
  }
  return { props, keys: keys as Set<RegistryKeys<Registries>> };
}

/**
 * Builds the `className` and custom-property `style` for every compiled prop (caller `style` merged
 * last so it wins); unregistered props are returned in `rest` for the host element.
 */
export function applyStyleProps<Props extends Record<string, unknown>, K extends string>(
  props: Props,
  compiled: CompiledStyleProps<K>,
  style?: CSSProperties,
): { className: string; style: CSSProperties; rest: Omit<Props, K> } {
  const classNames: string[] = [];
  const computed: Record<string, string> = {};

  for (const entry of compiled.props) {
    const value = props[entry.prop] as Responsive<unknown> | undefined;
    if (value === undefined) continue;
    classNames.push(entry.className);
    writeStyleProp(entry.varPrefix, value, entry.transform, computed);
  }

  if (style) Object.assign(computed, style);

  const keys = compiled.keys as Set<string>;
  const rest: Record<string, unknown> = {};
  for (const prop in props) {
    if (!keys.has(prop)) rest[prop] = props[prop];
  }

  return { className: clsx(classNames), style: computed as CSSProperties, rest: rest as Omit<Props, K> };
}
