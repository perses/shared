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
});
