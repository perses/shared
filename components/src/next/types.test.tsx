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
import type { ComponentProps, CSSProperties } from 'react';
import { expectTypeOf } from 'vitest';

import type { PersesComponents, PersesCSSProperties, PersesIcons } from './index';
import { AddIcon, Box, Checkbox } from './primitives';
import type {
  CheckboxProps,
  CheckboxStyle,
  ChipProps,
  ChipStyle,
  IconProps,
  PersesCSSProperties as PrimitiveCSSProperties,
  SwitchProps,
  SwitchStyle,
  TextFieldProps,
  TextFieldStyle,
} from './primitives';

// These type-level contracts are checked by `npm run type-check`.
type AssertAssignable<T extends U, U> = T;
type AssertNever<T extends never> = T;
type AssertFalse<T extends false> = T;
type StyleKeys<T> = T extends unknown ? keyof T : never;
type StyleValue<T, Key extends PropertyKey> = T extends unknown ? (Key extends keyof T ? T[Key] : never) : never;

interface ExtendedCheckboxStyle extends CheckboxStyle {
  '--app-accent': string;
}
interface ExtendedChipStyle extends ChipStyle {
  '--app-accent': string;
}
interface ExtendedSwitchStyle extends SwitchStyle {
  '--app-accent': string;
}
interface ExtendedTextFieldStyle extends TextFieldStyle {
  '--app-accent': string;
}

// Derived from the component registry so every registered primitive and icon is checked without listing it here.
type StyledProps = {
  [Name in keyof PersesComponents]: ComponentProps<PersesComponents[Name]>;
} & {
  [Name in keyof PersesIcons as `${Name}Icon`]: ComponentProps<PersesIcons[Name]>;
} & {
  AddIcon: ComponentProps<typeof AddIcon>;
  Icon: IconProps;
};
type StyleOf<Props> = Props extends { style?: infer Style } ? NonNullable<Style> : never;

// Structural assignability alone would allow extra keys on non-literal objects,
// masking the excess-property errors callers encounter with inline styles.
// Components without a `style` prop, such as Divider, are skipped.
type MissingCustomProperties = {
  [Name in keyof StyledProps]: 'style' extends keyof StyledProps[Name]
    ? `--${string}` extends StyleKeys<StyleOf<StyledProps[Name]>>
      ? never
      : Name
    : never;
}[keyof StyledProps];
type _RegistryCovered = AssertAssignable<'Checkbox' | 'TableCell' | 'InfoIcon' | 'AddIcon', keyof StyledProps>;
type _EveryStyleSupportsCustomProperties = AssertNever<MissingCustomProperties>;

type _ReactCompatible = AssertAssignable<PersesCSSProperties, CSSProperties>;
type _ExistingReactStylesAccepted = AssertAssignable<CSSProperties, PersesCSSProperties>;
type _PrimitiveExport = AssertAssignable<PersesCSSProperties, PrimitiveCSSProperties>;
type _MixedStyle = AssertAssignable<
  {
    display: 'flex';
    marginTop: 8;
    '--perses-bg-surface': 'white';
    '--perses-selection-control-size-md': '1.5rem';
    '--perses-checkbox-size-md': '24px';
    '--app-accent': 'blue';
    '--app-scale': 2;
    '--app-optional': undefined;
  },
  PersesCSSProperties
>;

type _UnknownCssPropertyRejected = AssertFalse<'colour' extends StyleKeys<PersesCSSProperties> ? true : false>;
type _DisplayRemainsTyped = AssertAssignable<PersesCSSProperties['display'], CSSProperties['display']>;
type _BooleanCustomPropertyRejected = AssertFalse<
  boolean extends StyleValue<PersesCSSProperties, '--app-value'> ? true : false
>;
type _ObjectCustomPropertyRejected = AssertFalse<
  object extends StyleValue<PersesCSSProperties, '--app-value'> ? true : false
>;
type _ChipBorderStyleRemainsTyped = AssertAssignable<
  ChipStyle['--perses-chip-border-style'],
  CSSProperties['borderStyle']
>;
type _CheckboxSizeRemainsTyped = AssertAssignable<
  StyleValue<NonNullable<CheckboxProps['style']>, '--perses-checkbox-size-md'>,
  string | undefined
>;
type _SwitchSizeRemainsTyped = AssertAssignable<
  StyleValue<NonNullable<SwitchProps['style']>, '--perses-switch-size-md'>,
  string | undefined
>;
type _TextFieldSizeRemainsTyped = AssertAssignable<
  StyleValue<NonNullable<TextFieldProps['style']>, '--perses-textfield-size-md'>,
  string | undefined
>;
type _ExtendedCheckboxStyleAccepted = AssertAssignable<ExtendedCheckboxStyle, NonNullable<CheckboxProps['style']>>;
type _ExtendedChipStyleAccepted = AssertAssignable<ExtendedChipStyle, NonNullable<ChipProps['style']>>;
type _ExtendedSwitchStyleAccepted = AssertAssignable<ExtendedSwitchStyle, NonNullable<SwitchProps['style']>>;
type _ExtendedTextFieldStyleAccepted = AssertAssignable<ExtendedTextFieldStyle, NonNullable<TextFieldProps['style']>>;

// @ts-expect-error Misspelled ordinary CSS properties must remain errors.
expectTypeOf({ colour: 'red' } satisfies PersesCSSProperties);
// @ts-expect-error Custom properties do not accept booleans, even alongside ordinary CSS.
expectTypeOf({ display: 'block', '--app-enabled': true } satisfies PersesCSSProperties);
// @ts-expect-error Custom properties do not accept objects.
expectTypeOf({ color: 'red', '--app-value': {} } satisfies PersesCSSProperties);
// @ts-expect-error Component-specific size overrides require units as a string.
expectTypeOf({ '--perses-checkbox-size-md': 24 } satisfies PersesCSSProperties<CheckboxStyle>);
// @ts-expect-error Component-specific border styles retain their CSS value type, not arbitrary numbers.
expectTypeOf({ '--perses-chip-border-style': 1 } satisfies PersesCSSProperties<ChipStyle>);

const MIXED_STYLE = {
  marginTop: 8,
  '--perses-bg-surface': 'white',
  '--perses-selection-control-size-md': '1.5rem',
  '--perses-checkbox-size-md': '24px',
  '--app-accent': 'blue',
  '--app-scale': 2,
} satisfies PersesCSSProperties<CheckboxStyle>;
const REACT_STYLE: CSSProperties = { marginTop: 8 };

describe('Perses inline styles', () => {
  it('passes ordinary CSS and semantic, component, and application custom properties to the control', () => {
    render(<Checkbox aria-label="Select item" style={MIXED_STYLE} />);
    const control = screen.getByRole('checkbox', { name: 'Select item' });
    expect(control.style.marginTop).toBe('8px');
    expect(control.style.getPropertyValue('--perses-bg-surface')).toBe('white');
    expect(control.style.getPropertyValue('--perses-selection-control-size-md')).toBe('1.5rem');
    expect(control.style.getPropertyValue('--perses-checkbox-size-md')).toBe('24px');
    expect(control.style.getPropertyValue('--app-accent')).toBe('blue');
    expect(control.style.getPropertyValue('--app-scale')).toBe('2');
  });

  it('passes application custom properties to SVG icons', () => {
    render(<AddIcon aria-label="Add item" style={MIXED_STYLE} />);
    const icon = screen.getByLabelText('Add item');
    expect(icon.style.getPropertyValue('--app-accent')).toBe('blue');
    expect(icon.style.getPropertyValue('--app-scale')).toBe('2');
  });

  it('continues to accept existing React CSSProperties objects', () => {
    render(<Box style={REACT_STYLE}>Existing style</Box>);
    expect(screen.getByText('Existing style')).toHaveStyle({ marginTop: '8px' });
  });
});
