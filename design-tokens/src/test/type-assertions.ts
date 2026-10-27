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

// Compile-time type assertions: if a token var name is missing from
// PersesTokenVar, `npm run type-check` will fail here.
// This file is never executed — it only needs to pass tsc.

import type { tokens, PersesTokenVar, SelectionControlSizeVar, SemanticOpacityVar } from '../index';

type ExtractVars<T> = T extends `var(${infer V})`
  ? V
  : T extends object
    ? { [K in keyof T]: ExtractVars<T[K]> }[keyof T]
    : never;

type AssertAssignable<T extends U, U> = T;

// Check every var() leaf, including nested families and numeric color stops.
type _AllTokenVars = AssertAssignable<ExtractVars<typeof tokens>, PersesTokenVar>;

type _SelectionControlSizeXs = AssertAssignable<'--perses-selection-control-size-xs', SelectionControlSizeVar>;
type _SelectionControlSizeSm = AssertAssignable<'--perses-selection-control-size-sm', SelectionControlSizeVar>;
type _SelectionControlSizeMd = AssertAssignable<'--perses-selection-control-size-md', SelectionControlSizeVar>;
type _SelectionControlSizeLg = AssertAssignable<'--perses-selection-control-size-lg', SelectionControlSizeVar>;
type _SelectionControlSizeVars = AssertAssignable<SelectionControlSizeVar, PersesTokenVar>;

type _OpacityDisabled = AssertAssignable<ExtractVars<typeof tokens.opacity.disabled>, PersesTokenVar>;
type _OpacityDisabledVar = AssertAssignable<'--perses-opacity-disabled', PersesTokenVar>;
type _SemanticOpacityVar = AssertAssignable<'--perses-opacity-disabled', SemanticOpacityVar>;

type _UnknownVarRejected = AssertAssignable<'--perses-unknown' extends PersesTokenVar ? true : false, false>;
type _UnknownSelectionSizeRejected = AssertAssignable<
  '--perses-selection-control-size-xl' extends PersesTokenVar ? true : false,
  false
>;
