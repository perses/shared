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

import { Link } from '@perses-dev/core';
import { StateCreator } from 'zustand';
import { Middleware } from './common';

/**
 * Slice that handles the state and actions for Dashboard Links.
 */
export interface LinksSlice {
  links?: Link[];
  /**
   * Replaces all links with the provided array.
   */
  setLinks: (links: Link[]) => void;
}

/**
 * Creates a slice for managing dashboard links state.
 * @param initLinks - Initial links array from the dashboard spec.
 */
export function createLinksSlice(initLinks?: Link[]): StateCreator<LinksSlice, Middleware, [], LinksSlice> {
  return (set) => ({
    links: initLinks,
    setLinks: (links: Link[]): void => {
      set((state) => {
        state.links = links;
      });
    },
  });
}
