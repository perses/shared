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

import React from 'react';
import { HotkeyMeta, HotkeySequence, RegisterableHotkey } from '@tanstack/hotkeys';
import { PersesShortcutDef } from './types';

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
    meta: {
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      scope: def.scope,
      displayOverride: def.displayOverride,
    },
    ...(def.ignoreInputs !== undefined ? { ignoreInputs: def.ignoreInputs } : {}),
  };
}

export function requireShortcutHotkey(def: PersesShortcutDef): RegisterableHotkey {
  if (def.hotkey === undefined) {
    throw new Error(`Shortcut ${def.id} is missing a hotkey definition`);
  }
  return def.hotkey;
}

export function requireShortcutSequence(def: PersesShortcutDef): HotkeySequence {
  if (def.sequence === undefined) {
    throw new Error(`Shortcut ${def.id} is missing a sequence definition`);
  }
  return def.sequence;
}

export function requireShortcutEvent(def: PersesShortcutDef): string {
  if (def.event === undefined) {
    throw new Error(`Shortcut ${def.id} is missing an event definition`);
  }
  return def.event;
}

export function dispatchShortcutEvent(eventName: string): void {
  window.dispatchEvent(new CustomEvent(eventName));
}

/**
 * Creates an onKeyDown handler that fires `execute` on exact Mod+Enter (Cmd+Enter on Mac, Ctrl+Enter on others).
 * Performs exact modifier matching: Mod+Shift+Enter or Mod+Alt+Enter will NOT trigger the handler.
 * Designed for use with CodeMirror editors via the onKeyDown prop, where it must call
 * preventDefault() before CodeMirror processes the key event.
 */
export function createModEnterHandler(execute: () => void): React.KeyboardEventHandler<HTMLElement> {
  return (event: React.KeyboardEvent<HTMLElement>): void => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey) {
      event.preventDefault();
      execute();
    }
  };
}
