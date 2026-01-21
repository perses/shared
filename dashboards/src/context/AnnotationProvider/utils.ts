// Copyright 2025 The Perses Authors
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

import { AnnotationData, AnnotationDefinition } from '@perses-dev/core';
import { AnnotationStoreStateMap, AnnotationState } from '@perses-dev/plugin-system';

function hydrateAnnotationState(annotation: AnnotationDefinition, value?: AnnotationData): AnnotationState {
  const annoState: AnnotationState = {
    value: null,
    loading: false,
  };

  annoState.value = value ?? null;

  return AnnotationState;
}

/**
 * Build the local annotation states according to the given definitions
 * @param definitions local annotation definitions. Dynamic part.
 */
export function hydrateAnnotationDefinitionStates(definitions: AnnotationDefinition[]): AnnotationStoreStateMap {
  const state: AnnotationStoreStateMap = new AnnotationStoreStateMap();

  for (const definition of definitions) {
    const name = definition.spec.display.name;
    state.set({ name }, hydrateAnnotationState(definition));
  }

  return state;
}
