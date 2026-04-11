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

import { PersesShortcutDef } from '../types';
import { OPEN_SEARCH_EVENT, SHOW_SHORTCUTS_EVENT, TOGGLE_THEME_EVENT } from '../events';

export const GO_HOME_SHORTCUT: PersesShortcutDef = {
  id: 'go-home',
  sequence: ['G', 'H'],
  name: 'Go to Home',
  description: 'Navigate to the Home page',
  category: 'global',
  scope: 'global',
};

export const GO_EXPLORE_SHORTCUT: PersesShortcutDef = {
  id: 'go-explore',
  sequence: ['G', 'E'],
  name: 'Go to Explore',
  description: 'Navigate to the Explore page',
  category: 'global',
  scope: 'global',
};

export const GO_PROFILE_SHORTCUT: PersesShortcutDef = {
  id: 'go-profile',
  sequence: ['G', 'P'],
  name: 'Go to Profile',
  description: 'Navigate to the Profile page',
  category: 'global',
  scope: 'global',
};

export const OPEN_SEARCH_SHORTCUT: PersesShortcutDef = {
  id: 'open-search',
  hotkey: 'Mod+K',
  name: 'Open Search',
  description: 'Open the search dialog',
  category: 'global',
  scope: 'global',
};

export const SHOW_SHORTCUTS_SHORTCUT: PersesShortcutDef = {
  id: 'show-shortcuts',
  hotkey: { key: '?', shift: true },
  name: 'Show Keyboard Shortcuts',
  description: 'Show the keyboard shortcuts help modal',
  category: 'global',
  scope: 'global',
};

export const TOGGLE_THEME_SHORTCUT: PersesShortcutDef = {
  id: 'toggle-theme',
  sequence: ['G', 'T'],
  name: 'Toggle Theme',
  description: 'Toggle between dark and light theme',
  category: 'global',
  scope: 'global',
};

export const GLOBAL_SHORTCUTS: PersesShortcutDef[] = [
  GO_HOME_SHORTCUT,
  GO_EXPLORE_SHORTCUT,
  GO_PROFILE_SHORTCUT,
  OPEN_SEARCH_SHORTCUT,
  SHOW_SHORTCUTS_SHORTCUT,
  TOGGLE_THEME_SHORTCUT,
];

export const GLOBAL_SHORTCUT_EVENTS = {
  [OPEN_SEARCH_SHORTCUT.id]: OPEN_SEARCH_EVENT,
  [SHOW_SHORTCUTS_SHORTCUT.id]: SHOW_SHORTCUTS_EVENT,
  [TOGGLE_THEME_SHORTCUT.id]: TOGGLE_THEME_EVENT,
} as const;
