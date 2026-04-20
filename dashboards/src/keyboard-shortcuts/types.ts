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

import { HotkeySequence, RegisterableHotkey } from '@tanstack/hotkeys';

/** Extend TanStack's HotkeyMeta with Perses-specific fields. */
declare module '@tanstack/hotkeys' {
  interface HotkeyMeta {
    /** Unique kebab-case identifier, e.g., "go-home", "save-dashboard" */
    id: string;
    /** Category for grouping in the help modal */
    category: ShortcutCategory;
    /** Scope in which this shortcut is active */
    scope: ShortcutScope;
    /** Override for display formatting (e.g. '?' for the show-shortcuts shortcut) */
    displayOverride?: string;
  }
}

export type ShortcutScope = 'global' | 'dashboard' | 'panel';

export type ShortcutCategory = 'global' | 'time-range' | 'dashboard' | 'focused-panel';

export const SHORTCUT_CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  global: 'Global',
  'time-range': 'Time Range',
  dashboard: 'Dashboard',
  'focused-panel': 'Focused Panel',
};

export const SHORTCUT_CATEGORY_ORDER: ShortcutCategory[] = ['global', 'time-range', 'dashboard', 'focused-panel'];

/** Shortcut definition (data only, no callback). */
export interface PersesShortcutDef {
  id: string;
  /** TanStack hotkey for single-key shortcuts (e.g., "Mod+S", "E", or RawHotkey object) */
  hotkey?: RegisterableHotkey;
  /** TanStack sequence array for multi-key sequences (e.g., ['G', 'H']) */
  sequence?: HotkeySequence;
  name: string;
  description: string;
  category: ShortcutCategory;
  scope: ShortcutScope;
  /** Override TanStack's smart ignoreInputs default if needed */
  ignoreInputs?: boolean;
  /** Custom DOM event name dispatched when this shortcut fires */
  event?: string;
  /** Override for display formatting (e.g. '?' for the show-shortcuts shortcut) */
  displayOverride?: string;
}
