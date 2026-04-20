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
import { SAVE_DASHBOARD_EVENT, REFRESH_DASHBOARD_EVENT, TOGGLE_EDIT_MODE_EVENT } from '../events';

export const SAVE_DASHBOARD_SHORTCUT: PersesShortcutDef = {
  id: 'save-dashboard',
  hotkey: 'Mod+S',
  name: 'Save Dashboard',
  description: 'Save the current dashboard',
  category: 'dashboard',
  scope: 'dashboard',
  event: SAVE_DASHBOARD_EVENT,
};

export const REFRESH_DASHBOARD_SHORTCUT: PersesShortcutDef = {
  id: 'refresh-dashboard',
  sequence: ['D', 'R'],
  name: 'Refresh Dashboard',
  description: 'Refresh all panels',
  category: 'dashboard',
  scope: 'dashboard',
  event: REFRESH_DASHBOARD_EVENT,
};

export const TOGGLE_EDIT_MODE_SHORTCUT: PersesShortcutDef = {
  id: 'toggle-edit-mode',
  sequence: ['D', 'M'],
  name: 'Toggle Edit Mode',
  description: 'Toggle between edit and view mode',
  category: 'dashboard',
  scope: 'dashboard',
  event: TOGGLE_EDIT_MODE_EVENT,
};

export const DASHBOARD_SHORTCUTS: PersesShortcutDef[] = [
  SAVE_DASHBOARD_SHORTCUT,
  REFRESH_DASHBOARD_SHORTCUT,
  TOGGLE_EDIT_MODE_SHORTCUT,
];
