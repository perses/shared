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

import { HotkeyMeta, HotkeySequence, RegisterableHotkey } from '@tanstack/hotkeys';
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
 * Build shared registration options for a shortcut.
 */
export function buildShortcutOptions(
  def: PersesShortcutDef,
  enabled: boolean
): {
  enabled: boolean;
  meta: HotkeyMeta;
  ignoreInputs?: boolean;
} {
  return {
    enabled,
    meta: buildMeta(def),
    ...(def.ignoreInputs !== undefined ? { ignoreInputs: def.ignoreInputs } : {}),
  };
}

/**
 * Return the shortcut hotkey, throwing if the definition does not declare one.
 */
export function requireShortcutHotkey(def: PersesShortcutDef): RegisterableHotkey {
  if (def.hotkey === undefined) {
    throw new Error(`Shortcut ${def.id} is missing a hotkey definition`);
  }
  return def.hotkey;
}

/**
 * Return the shortcut sequence, throwing if the definition does not declare one.
 */
export function requireShortcutSequence(def: PersesShortcutDef): HotkeySequence {
  if (def.sequence === undefined) {
    throw new Error(`Shortcut ${def.id} is missing a sequence definition`);
  }
  return def.sequence;
}

/**
 * Return the shortcut event name, throwing if the definition does not declare one.
 */
export function requireShortcutEvent(def: PersesShortcutDef): string {
  if (def.event === undefined) {
    throw new Error(`Shortcut ${def.id} is missing an event definition`);
  }
  return def.event;
}

/**
 * Dispatch a custom DOM event on `window` for cross-component shortcut communication.
 */
export function dispatchShortcutEvent(eventName: string): void {
  window.dispatchEvent(new CustomEvent(eventName));
}
