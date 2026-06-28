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

import { VariableStateMap } from './variable-interpolation';
import { interpolateHeaders, interpolateQueryParams } from './request-interpolation';

const variableState: VariableStateMap = {
  namespace: { value: 'default', loading: false },
  cluster: { value: 'prod', loading: false },
  multi: { value: ['ns1', 'ns2'], loading: false },
};

describe('interpolateHeaders()', () => {
  it('replaces single variable in header value', () => {
    const result = interpolateHeaders({ 'X-Scope-OrgID': '$namespace' }, variableState);
    expect(result).toEqual({ 'X-Scope-OrgID': 'default' });
  });

  it('replaces multiple variables in different headers', () => {
    const result = interpolateHeaders(
      {
        'X-Scope-OrgID': '$namespace',
        'X-Cluster': '$cluster',
      },
      variableState
    );
    expect(result).toEqual({
      'X-Scope-OrgID': 'default',
      'X-Cluster': 'prod',
    });
  });

  it('replaces variable with format specifier', () => {
    const result = interpolateHeaders({ 'X-Scope-OrgID': '${multi:csv}' }, variableState);
    expect(result).toEqual({ 'X-Scope-OrgID': 'ns1,ns2' });
  });

  it('replaces multi-value variable with pipe format', () => {
    const result = interpolateHeaders({ 'X-Scope-OrgID': '${multi:pipe}' }, variableState);
    expect(result).toEqual({ 'X-Scope-OrgID': 'ns1|ns2' });
  });

  it('passes through static header values unchanged', () => {
    const result = interpolateHeaders({ Authorization: 'Bearer token123' }, variableState);
    expect(result).toEqual({ Authorization: 'Bearer token123' });
  });

  it('returns empty object for empty headers', () => {
    const result = interpolateHeaders({}, variableState);
    expect(result).toEqual({});
  });

  it('handles mixed static and variable headers', () => {
    const result = interpolateHeaders(
      {
        'Content-Type': 'application/json',
        'X-Tenant': '$namespace',
      },
      variableState
    );
    expect(result).toEqual({
      'Content-Type': 'application/json',
      'X-Tenant': 'default',
    });
  });
});

describe('interpolateQueryParams()', () => {
  it('replaces single string value', () => {
    const result = interpolateQueryParams({ namespace: '$namespace' }, variableState);
    expect(result).toEqual({ namespace: 'default' });
  });

  it('replaces multiple string values', () => {
    const result = interpolateQueryParams(
      {
        namespace: '$namespace',
        cluster: '$cluster',
      },
      variableState
    );
    expect(result).toEqual({
      namespace: 'default',
      cluster: 'prod',
    });
  });

  it('interpolates each element of an array value', () => {
    const result = interpolateQueryParams({ ns: ['$namespace', '$cluster'] }, variableState);
    expect(result).toEqual({ ns: ['default', 'prod'] });
  });

  it('passes through static string values unchanged', () => {
    const result = interpolateQueryParams({ dedup: 'false' }, variableState);
    expect(result).toEqual({ dedup: 'false' });
  });

  it('passes through static array values unchanged', () => {
    const result = interpolateQueryParams({ tags: ['a', 'b'] }, variableState);
    expect(result).toEqual({ tags: ['a', 'b'] });
  });

  it('returns empty object for empty params', () => {
    const result = interpolateQueryParams({}, variableState);
    expect(result).toEqual({});
  });

  it('handles format specifier in string value', () => {
    const result = interpolateQueryParams({ namespace: '${multi:csv}' }, variableState);
    expect(result).toEqual({ namespace: 'ns1,ns2' });
  });

  it('handles mixed static and variable params', () => {
    const result = interpolateQueryParams(
      {
        dedup: 'false',
        namespace: '$namespace',
        tags: ['$cluster', 'static'],
      },
      variableState
    );
    expect(result).toEqual({
      dedup: 'false',
      namespace: 'default',
      tags: ['prod', 'static'],
    });
  });

  it('returns string array for multi-value variable with pure variable reference', () => {
    const result = interpolateQueryParams({ namespace: '$multi' }, variableState);
    expect(result).toEqual({ namespace: ['ns1', 'ns2'] });
  });

  it('returns string array for multi-value variable with curly brace syntax', () => {
    const result = interpolateQueryParams({ namespace: '${multi}' }, variableState);
    expect(result).toEqual({ namespace: ['ns1', 'ns2'] });
  });

  it('returns single string for single-value variable with pure variable reference', () => {
    const result = interpolateQueryParams({ ns: '$namespace' }, variableState);
    expect(result).toEqual({ ns: 'default' });
  });

  it('returns string array for multi-value variable with queryparam formatter to avoid double-encoding', () => {
    const result = interpolateQueryParams({ namespace: '${multi:queryparam}' }, variableState);
    expect(result).toEqual({ namespace: ['ns1', 'ns2'] });
  });

  it('returns formatted string for complex template (not pure variable reference)', () => {
    const result = interpolateQueryParams({ filter: 'tenant=${multi:csv}' }, variableState);
    expect(result).toEqual({ filter: 'tenant=ns1,ns2' });
  });

  it('handles undefined variable gracefully', () => {
    const result = interpolateQueryParams({ namespace: '$undefined' }, variableState);
    expect(result).toEqual({ namespace: '$undefined' });
  });

  it('expands multi-value variable embedded with other text', () => {
    const result = interpolateQueryParams({ filter: 'ns=$multi' }, variableState);
    expect(result).toEqual({ filter: ['ns=ns1', 'ns=ns2'] });
  });

  it('preserves existing array handling', () => {
    const result = interpolateQueryParams(
      {
        namespaces: ['$namespace', '${multi:csv}'],
      },
      variableState
    );
    expect(result).toEqual({
      namespaces: ['default', 'ns1,ns2'],
    });
  });

  it('expands multi-value variable in mixed params', () => {
    const result = interpolateQueryParams({ namespace: '$multi', cluster: '$cluster', dedup: 'false' }, variableState);
    expect(result).toEqual({
      namespace: ['ns1', 'ns2'],
      cluster: 'prod',
      dedup: 'false',
    });
  });

  describe('customAllValue ($__all with string value)', () => {
    const customAllValueState: VariableStateMap = {
      namespace: {
        value: '(project-alpha|project-beta|project-gamma)',
        customAllValue: '(project-alpha|project-beta|project-gamma)',
        options: [
          { label: 'project-alpha', value: 'project-alpha' },
          { label: 'project-beta', value: 'project-beta' },
          { label: 'project-gamma', value: 'project-gamma' },
        ],
        loading: false,
      },
      cluster: { value: 'prod', loading: false },
    };

    it('expands customAllValue to individual options with queryparam format', () => {
      const result = interpolateQueryParams({ namespace: '${namespace:queryparam}' }, customAllValueState);
      expect(result).toEqual({ namespace: ['project-alpha', 'project-beta', 'project-gamma'] });
    });

    it('expands customAllValue to individual options with no format', () => {
      const result = interpolateQueryParams({ namespace: '$namespace' }, customAllValueState);
      expect(result).toEqual({ namespace: ['project-alpha', 'project-beta', 'project-gamma'] });
    });

    it('expands wildcard customAllValue to individual options', () => {
      const wildcardState: VariableStateMap = {
        namespace: {
          value: '.*',
          customAllValue: '.*',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '${namespace:queryparam}' }, wildcardState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2'] });
    });

    it('does not expand single-value selection that matches an option', () => {
      const singleSelectState: VariableStateMap = {
        namespace: {
          value: 'project-alpha',
          options: [
            { label: 'project-alpha', value: 'project-alpha' },
            { label: 'project-beta', value: 'project-beta' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, singleSelectState);
      expect(result).toEqual({ namespace: 'project-alpha' });
    });

    it('expands customAllValue alongside other params', () => {
      const result = interpolateQueryParams(
        { namespace: '${namespace:queryparam}', cluster: '$cluster' },
        customAllValueState
      );
      expect(result).toEqual({
        namespace: ['project-alpha', 'project-beta', 'project-gamma'],
        cluster: 'prod',
      });
    });

    it('expands only options matching customAllValue regex when it references a subset', () => {
      const mismatchedState: VariableStateMap = {
        namespace: {
          value: '(project-alpha|project-beta|project-gamma)',
          customAllValue: '(project-alpha|project-beta|project-gamma)',
          options: [
            { label: 'project-alpha', value: 'project-alpha' },
            { label: 'project-beta', value: 'project-beta' },
            { label: 'project-gamma', value: 'project-gamma' },
            { label: 'project-delta', value: 'project-delta' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '${namespace:queryparam}' }, mismatchedState);
      expect(result).toEqual({
        namespace: ['project-alpha', 'project-beta', 'project-gamma'],
      });
    });

    it('falls back to all options when customAllValue is not a valid regex', () => {
      const invalidRegexState: VariableStateMap = {
        namespace: {
          value: '(unclosed-group',
          customAllValue: '(unclosed-group',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, invalidRegexState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2'] });
    });

    it('returns only the matching option when customAllValue is a plain string that matches an option', () => {
      const exactMatchState: VariableStateMap = {
        namespace: {
          value: 'ns1',
          customAllValue: 'ns1',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
            { label: 'ns3', value: 'ns3' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, exactMatchState);
      expect(result).toEqual({ namespace: ['ns1'] });
    });

    it('falls back to all options when non-regex customAllValue does not match any option', () => {
      const plainStringState: VariableStateMap = {
        namespace: {
          value: 'all',
          customAllValue: 'all',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
            { label: 'ns3', value: 'ns3' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, plainStringState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2', 'ns3'] });
    });

    it('falls back to all options when non-regex customAllValue does not match any option (numeric string)', () => {
      const exactMatchState: VariableStateMap = {
        namespace: {
          value: '123',
          customAllValue: '123',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
            { label: 'ns3', value: 'ns3' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, exactMatchState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2', 'ns3'] });
    });

    it('falls back to all options when non-regex customAllValue does not match any option (boolean-like string)', () => {
      const exactMatchState: VariableStateMap = {
        namespace: {
          value: 'true',
          customAllValue: 'true',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
            { label: 'ns3', value: 'ns3' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, exactMatchState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2', 'ns3'] });
    });

    it('falls back to all options when non-regex customAllValue does not match any option (undefined-like string)', () => {
      const exactMatchState: VariableStateMap = {
        namespace: {
          value: 'undefined',
          customAllValue: 'undefined',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
            { label: 'ns3', value: 'ns3' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, exactMatchState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2', 'ns3'] });
    });

    it('falls back to all options when non-regex customAllValue does not match any option (comma-separated string)', () => {
      const exactMatchState: VariableStateMap = {
        namespace: {
          value: 'ns1,ns2',
          customAllValue: 'ns1,ns2',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
            { label: 'ns3', value: 'ns3' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, exactMatchState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2', 'ns3'] });
    });

    it('treats dot in plain string customAllValue as regex metacharacter', () => {
      const dotState: VariableStateMap = {
        namespace: {
          value: 'ns.1',
          customAllValue: 'ns.1',
          options: [
            { label: 'ns-1', value: 'ns-1' },
            { label: 'ns11', value: 'ns11' },
            { label: 'ns21', value: 'ns21' },
            { label: 'other', value: 'other' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, dotState);
      expect(result).toEqual({ namespace: ['ns-1', 'ns11', 'ns21'] });
    });

    it('expands all options when customAllValue contains special chars that form invalid regex', () => {
      const specialCharState: VariableStateMap = {
        namespace: {
          value: 'select[all',
          customAllValue: 'select[all',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, specialCharState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2'] });
    });

    it('handles customAllValue with plus regex metacharacter', () => {
      const metacharState: VariableStateMap = {
        namespace: {
          value: 'ns+',
          customAllValue: 'ns+',
          options: [
            { label: 'ns', value: 'ns' },
            { label: 'nss', value: 'nss' },
            { label: 'nsss', value: 'nsss' },
            { label: 'other', value: 'other' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, metacharState);
      expect(result).toEqual({ namespace: ['ns', 'nss', 'nsss'] });
    });

    it('falls back to all options when customAllValue regex matches no options', () => {
      const noMatchState: VariableStateMap = {
        namespace: {
          value: '(nonexistent-a|nonexistent-b)',
          customAllValue: '(nonexistent-a|nonexistent-b)',
          options: [
            { label: 'ns1', value: 'ns1' },
            { label: 'ns2', value: 'ns2' },
          ],
          loading: false,
        },
      };
      const result = interpolateQueryParams({ namespace: '$namespace' }, noMatchState);
      expect(result).toEqual({ namespace: ['ns1', 'ns2'] });
    });
  });
});
