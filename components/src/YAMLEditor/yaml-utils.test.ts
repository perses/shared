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

import { toYAMLText, yamlDiagnostics } from './yaml-utils';

describe('yamlDiagnostics', () => {
  it.each([
    { name: 'valid YAML', text: 'kind: Dashboard\nspec:\n  duration: 1h\n' },
    { name: 'valid JSON', text: '{"kind": "Dashboard", "spec": {"duration": "1h"}}' },
    { name: 'multiple documents', text: 'kind: a\n---\nkind: b\n' },
    { name: 'empty text', text: '' },
  ])('returns no diagnostic for $name', ({ text }) => {
    expect(yamlDiagnostics(text)).toEqual([]);
  });

  it.each([
    { name: 'broken flow sequence', text: ':invalid: yaml: [broken' },
    { name: 'bad indentation', text: 'kind: a\n  spec: b\n' },
    { name: 'unterminated JSON', text: '{"kind": "Dashboard"' },
  ])('returns errors within the text bounds for $name', ({ text }) => {
    const diagnostics = yamlDiagnostics(text);
    expect(diagnostics.length).toBeGreaterThan(0);
    for (const diagnostic of diagnostics) {
      expect(diagnostic.severity).toBe('error');
      expect(diagnostic.from).toBeGreaterThanOrEqual(0);
      expect(diagnostic.from).toBeLessThanOrEqual(diagnostic.to);
      expect(diagnostic.to).toBeLessThanOrEqual(text.length);
      expect(diagnostic.message).not.toContain('\n');
    }
  });

  it.each([
    { name: 'unresolved tag', text: 'a: !foo x\n', from: 3, to: 7 },
    { name: 'unknown directive', text: '%FOO bar\n---\na: 1\n', from: 0, to: 8 },
  ])('returns a warning for $name', ({ text, from, to }) => {
    const diagnostics = yamlDiagnostics(text);
    expect(diagnostics).toHaveLength(1);
    expect(diagnostics[0]).toMatchObject({ from, to, severity: 'warning' });
    expect(diagnostics[0]?.message).not.toContain('\n');
  });
});

describe('toYAMLText', () => {
  it.each([
    { name: 'undefined', value: undefined, expected: '' },
    { name: 'a string as is', value: 'kind: Dashboard', expected: 'kind: Dashboard' },
    {
      name: 'an object as YAML',
      value: { kind: 'Dashboard', spec: { duration: '1h' } },
      expected: 'kind: Dashboard\nspec:\n  duration: 1h\n',
    },
    { name: 'YAML 1.1 booleans quoted', value: { value: 'on' }, expected: 'value: "on"\n' },
  ])('converts $name', ({ value, expected }) => {
    expect(toYAMLText(value)).toBe(expected);
  });
});
