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
import { PANEL_EDIT_EVENT, PANEL_FULLSCREEN_EVENT, PANEL_DUPLICATE_EVENT, PANEL_DELETE_EVENT } from '../events';

export const PANEL_EDIT_SHORTCUT: PersesShortcutDef = {
  id: 'panel-edit',
  hotkey: 'E',
  name: 'Edit Panel',
  description: 'Edit the focused panel when in edit mode',
  category: 'focused-panel',
  scope: 'panel',
  event: PANEL_EDIT_EVENT,
};

export const PANEL_FULLSCREEN_SHORTCUT: PersesShortcutDef = {
  id: 'panel-fullscreen',
  hotkey: 'V',
  name: 'Toggle Fullscreen',
  description: 'Toggle fullscreen on the focused panel',
  category: 'focused-panel',
  scope: 'panel',
  event: PANEL_FULLSCREEN_EVENT,
};

export const PANEL_DUPLICATE_SHORTCUT: PersesShortcutDef = {
  id: 'panel-duplicate',
  sequence: ['P', 'D'],
  name: 'Duplicate Panel',
  description: 'Duplicate the focused panel',
  category: 'focused-panel',
  scope: 'panel',
  event: PANEL_DUPLICATE_EVENT,
};

export const PANEL_DELETE_SHORTCUT: PersesShortcutDef = {
  id: 'panel-delete',
  sequence: ['P', 'R'],
  name: 'Delete Panel',
  description: 'Delete the focused panel',
  category: 'focused-panel',
  scope: 'panel',
  event: PANEL_DELETE_EVENT,
};

export const PANEL_SHORTCUTS: PersesShortcutDef[] = [
  PANEL_EDIT_SHORTCUT,
  PANEL_FULLSCREEN_SHORTCUT,
  PANEL_DUPLICATE_SHORTCUT,
  PANEL_DELETE_SHORTCUT,
];
