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

import { createContext, useContext, useEffect, useRef } from 'react';

export type DrawerCloseHandler = () => void;

export interface DrawerCloseHandlerContextValue {
  /**
   * Registers a handler and returns a function to unregister it.
   */
  registerCloseHandler: (handler: DrawerCloseHandler) => () => void;
}

export const DrawerCloseHandlerContext = createContext<DrawerCloseHandlerContextValue | undefined>(undefined);

/**
 * Intercepts the requests to close the nearest parent Drawer that are triggered by the user clicking outside of
 * it or pressing Escape. Typically used by forms to ask for confirmation before discarding unsaved changes.
 *
 * The handler is responsible for actually closing the drawer (or not). When several handlers are registered for the
 * same drawer, the most recently registered one is used. Does nothing when not rendered inside a Drawer.
 */
export function useDrawerCloseHandler(handler: DrawerCloseHandler): void {
  const ctx = useContext(DrawerCloseHandlerContext);

  // Keep a reference to the latest handler, so that consumers don't need to memoize it
  const handlerRef = useRef(handler);
  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (ctx === undefined) return;
    return ctx.registerCloseHandler(() => handlerRef.current());
  }, [ctx]);
}
