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
import { defaultQueryName, generateQueryNames } from './utils';

function buildQuery(name?: string): QueryDefinition {
  return {
    kind: 'TimeSeriesQuery',
    spec: {
      ...(name ? { name } : {}),
      plugin: {
        kind: 'PrometheusTimeSeriesQuery',
        spec: { query: 'up' },
      },
    },
  } as QueryDefinition;
}

describe('defaultQueryName', () => {
  it('returns a 1-based name from the query index', () => {
    expect(defaultQueryName(0)).toBe('Query #1');
    expect(defaultQueryName(4)).toBe('Query #5');
  });
});

describe('generateQueryNames', () => {
  it('returns an empty array when there are no definitions', () => {
    expect(generateQueryNames([])).toEqual([]);
  });

  it('falls back to the default name when no explicit name is set', () => {
    const definitions = [buildQuery(), buildQuery()];
    expect(generateQueryNames(definitions)).toEqual(['Query #1', 'Query #2']);
  });

  it('uses the explicit name when provided', () => {
    const definitions = [buildQuery('CPU usage'), buildQuery()];
    expect(generateQueryNames(definitions)).toEqual(['CPU usage', 'Query #2']);
  });

  it('resolves names by index, so cloned definitions still resolve correctly', () => {
    const definitions = [buildQuery('first'), buildQuery()];
    // A clone is not referentially equal to the original but must still map by index.
    const cloned = definitions.map((definition) => JSON.parse(JSON.stringify(definition)));
    expect(generateQueryNames(cloned)).toEqual(['first', 'Query #2']);
  });
});
