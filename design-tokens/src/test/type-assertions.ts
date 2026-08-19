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

import type { PersesTokenVar } from '../types';
import { tokens } from '../tokens';

type ExtractVar<T extends string> = T extends `var(${infer V})` ? V : never;

type AssertAssignable<T extends U, U> = T;

// Verify that the var() references in the tokens object produce variable names
// that are assignable to PersesTokenVar. If a token references a CSS variable
// not covered by PersesTokenVar, tsc will emit an error on this line.
type _BgVars = AssertAssignable<ExtractVar<typeof tokens.bg.default>, PersesTokenVar>;
type _BgSurface = AssertAssignable<ExtractVar<typeof tokens.bg.surface>, PersesTokenVar>;
type _BgSunken = AssertAssignable<ExtractVar<typeof tokens.bg.sunken>, PersesTokenVar>;
type _BgOverlay = AssertAssignable<ExtractVar<typeof tokens.bg.overlay>, PersesTokenVar>;
type _BgBackdrop = AssertAssignable<ExtractVar<typeof tokens.bg.backdrop>, PersesTokenVar>;
type _BgNav = AssertAssignable<ExtractVar<typeof tokens.bg.navigation>, PersesTokenVar>;

type _BorderDefault = AssertAssignable<ExtractVar<typeof tokens.border.default>, PersesTokenVar>;

type _TextPrimary = AssertAssignable<ExtractVar<typeof tokens.text.primary>, PersesTokenVar>;
type _TextSecondary = AssertAssignable<ExtractVar<typeof tokens.text.secondary>, PersesTokenVar>;
type _TextDisabled = AssertAssignable<ExtractVar<typeof tokens.text.disabled>, PersesTokenVar>;
type _TextLink = AssertAssignable<ExtractVar<typeof tokens.text.link>, PersesTokenVar>;
type _TextLinkHover = AssertAssignable<ExtractVar<typeof tokens.text.linkHover>, PersesTokenVar>;
type _TextNav = AssertAssignable<ExtractVar<typeof tokens.text.navigation>, PersesTokenVar>;
type _TextAccent = AssertAssignable<ExtractVar<typeof tokens.text.accent>, PersesTokenVar>;

type _SpacingXs = AssertAssignable<ExtractVar<typeof tokens.spacing.xs>, PersesTokenVar>;
type _SpacingLg = AssertAssignable<ExtractVar<typeof tokens.spacing.lg>, PersesTokenVar>;

type _RadiusMd = AssertAssignable<ExtractVar<typeof tokens.radius.md>, PersesTokenVar>;
type _RadiusFull = AssertAssignable<ExtractVar<typeof tokens.radius.full>, PersesTokenVar>;

type _FontFamily = AssertAssignable<ExtractVar<typeof tokens.font.family>, PersesTokenVar>;
type _FontWeightBold = AssertAssignable<ExtractVar<typeof tokens.font.weight.bold>, PersesTokenVar>;
type _FontSizeSm = AssertAssignable<ExtractVar<typeof tokens.font.size.sm>, PersesTokenVar>;
type _LineHeightTight = AssertAssignable<ExtractVar<typeof tokens.font.lineHeight.tight>, PersesTokenVar>;

type _StatusErrorBg = AssertAssignable<ExtractVar<typeof tokens.status.error.bg>, PersesTokenVar>;
type _StatusSuccessText = AssertAssignable<ExtractVar<typeof tokens.status.success.text>, PersesTokenVar>;
type _StatusWarningBorder = AssertAssignable<ExtractVar<typeof tokens.status.warning.border>, PersesTokenVar>;
type _StatusInfoIcon = AssertAssignable<ExtractVar<typeof tokens.status.info.icon>, PersesTokenVar>;

type _ColorBlue500 = AssertAssignable<ExtractVar<(typeof tokens.color.blue)[500]>, PersesTokenVar>;
type _ColorWhite = AssertAssignable<ExtractVar<typeof tokens.color.white>, PersesTokenVar>;
