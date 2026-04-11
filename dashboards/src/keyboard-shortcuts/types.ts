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

/**
 * Extend TanStack's HotkeyMeta with Perses-specific fields via declaration merging.
 */
declare module '@tanstack/hotkeys' {
  interface HotkeyMeta {
    /** Unique kebab-case identifier, e.g., "go-home", "save-dashboard" */
    id: string;
    /** Category for grouping in the help modal */
    category: ShortcutCategory;
    /** Scope in which this shortcut is active */
    scope: ShortcutScope;
  }
}

/**
 * The scope in which a shortcut is active.
 * - `global`: Active on every route
 * - `dashboard`: Active only when viewing/editing a dashboard
 * - `panel`: Active only when a panel is focused (hovered)
 */
export type ShortcutScope = 'global' | 'dashboard' | 'panel';

/**
 * Category for grouping shortcuts in the help modal.
 */
export type ShortcutCategory = 'global' | 'time-range' | 'dashboard' | 'focused-panel';

/**
 * The display labels for shortcut categories in the help modal.
 */
export const SHORTCUT_CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  global: 'Global',
  'time-range': 'Time Range',
  dashboard: 'Dashboard',
  'focused-panel': 'Focused Panel',
};

/**
 * Order of categories in the help modal.
 */
export const SHORTCUT_CATEGORY_ORDER: ShortcutCategory[] = ['global', 'time-range', 'dashboard', 'focused-panel'];

/**
 * Definition of a Perses keyboard shortcut (data only, no callback).
 * Used as the source of truth for default shortcut definitions.
 */
export interface PersesShortcutDef {
  /** Unique kebab-case identifier, e.g., "go-home", "save-dashboard" */
  id: string;
  /** TanStack hotkey for single-key shortcuts (e.g., "Mod+S", "E", "Escape", or RawHotkey object) */
  hotkey?: RegisterableHotkey;
  /** TanStack sequence array for multi-key sequences (e.g., ['G', 'H']) */
  sequence?: HotkeySequence;
  /** Human-readable name for display */
  name: string;
  /** Description for help modal */
  description: string;
  /** Category for grouping in help modal */
  category: ShortcutCategory;
  /** Scope in which this shortcut is active */
  scope: ShortcutScope;
  /** Override TanStack's smart ignoreInputs default if needed */
  ignoreInputs?: boolean;
}

/**
 * User override preferences stored in localStorage.
 */
export interface ShortcutOverrides {
  /** Version number for future migration support */
  version: number;
  /** Map of shortcut ID to overridden key string (or JSON-encoded sequence array), or null to disable */
  overrides: Record<string, string | null>;
}
