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

import { QueryDefinition } from '@perses-dev/spec';

export function defaultQueryName(index: number): string {
  return `Query #${index + 1}`;
}

/**
 * Returns the display name of each query definition, falling back to a default
 * name based on the query position when no explicit name is set.
 */
export function generateQueryNames(definitions: QueryDefinition[]): string[] {
  return definitions.map((queryDef: QueryDefinition, index: number) => queryDef.spec.name ?? defaultQueryName(index));
}
