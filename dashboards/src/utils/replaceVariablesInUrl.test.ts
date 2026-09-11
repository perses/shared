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

import type { VariableStateMap } from '@perses-dev/components';
import { describe, expect, it } from 'vitest';

import { replaceVariablesInUrl } from './replaceVariablesInUrl';

describe('replaceVariablesInUrl', () => {
  const vars: VariableStateMap = {
    var: { value: 'my-value', loading: false },
    phase: { value: 'prd', loading: false },
  };

  it('replaces $var in plain path/query', () => {
    expect(replaceVariablesInUrl('/projects/demo/dashboards/x?var-var=$var', vars)).toBe(
      '/projects/demo/dashboards/x?var-var=my-value',
    );
  });

  it('replaces $var nested inside Explore data= JSON (percent-encoded)', () => {
    const data = JSON.stringify({
      tab: 'graph',
      queries: [
        {
          kind: 'TimeSeriesQuery',
          spec: {
            plugin: {
              kind: 'PrometheusTimeSeriesQuery',
              spec: {
                query: 'topk(5, sum by(job) (rate(up{instance=~"$var", env=~"$phase"}[3m])))',
              },
            },
          },
        },
      ],
    });
    const url = `/explore?explorer=Prometheus-PrometheusExplorer&data=${encodeURIComponent(data)}`;
    const out = replaceVariablesInUrl(url, vars);
    const decoded = decodeURIComponent(new URL(out, 'http://local').searchParams.get('data')!);
    expect(decoded).toContain('my-value');
    expect(decoded).toContain('prd');
    expect(decoded).not.toContain('$var');
    expect(decoded).not.toContain('$phase');
  });

  it('leaves URLs without variables unchanged', () => {
    const url = '/explore?explorer=Prometheus-PrometheusExplorer&data=%7B%22tab%22%3A%22graph%22%7D';
    expect(replaceVariablesInUrl(url, vars)).toBe(url);
  });
});
