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

import { HotkeyMeta } from '@tanstack/hotkeys';
import { PersesShortcutDef } from './types';

/**
 * Build TanStack HotkeyMeta from a Perses shortcut definition.
 */
export function buildMeta(def: PersesShortcutDef): HotkeyMeta {
  return {
    id: def.id,
    name: def.name,
    description: def.description,
    category: def.category,
    scope: def.scope,
    displayOverride: def.displayOverride,
  };
}

/**
 * Dispatch a custom DOM event on `window` for cross-component shortcut communication.
 */
export function dispatchShortcutEvent(eventName: string): void {
  window.dispatchEvent(new CustomEvent(eventName));
}
