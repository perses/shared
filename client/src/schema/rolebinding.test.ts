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

import type { RoleBinding } from '../model';
import { WILDCARD_USER } from '../model';
import { nameSchema } from './metadata';
import { roleBindingsEditorSchema, subjectSchema } from './rolebinding';

describe('subjectSchema', () => {
  test.each([
    { title: 'should accept the name of a user', name: 'jane' },
    { title: 'should accept the wildcard user', name: WILDCARD_USER },
  ])('$title', ({ name }) => {
    expect(subjectSchema.safeParse({ kind: 'User', name }).success).toBe(true);
  });

  test.each([
    { title: 'should reject an empty name', name: '' },
    { title: 'should reject a name with a wildcard and other characters', name: 'ja*' },
    { title: 'should reject several wildcards', name: '**' },
    { title: 'should reject a name too long', name: 'a'.repeat(76) },
  ])('$title with the messages of nameSchema', ({ name }) => {
    const result = subjectSchema.safeParse({ kind: 'User', name });
    expect(result.success).toBe(false);
    const expectedMessages = nameSchema.safeParse(name).error?.issues.map((issue) => issue.message);
    expect(expectedMessages?.length).toBeGreaterThan(0);
    expect(result.error?.issues.map((issue) => issue.message)).toEqual(expectedMessages);
    expect(result.error?.issues.every((issue) => issue.path.join('.') === 'name')).toBe(true);
  });
});

describe('roleBindingsEditorSchema', () => {
  test('should accept a role binding granting a role to every user', () => {
    const roleBinding: RoleBinding = {
      kind: 'RoleBinding',
      metadata: { name: 'default-viewer', project: 'MySuperProject' },
      spec: { role: 'viewer', subjects: [{ kind: 'User', name: WILDCARD_USER }] },
    };
    expect(roleBindingsEditorSchema.parse(roleBinding)).toEqual(roleBinding);
  });
});
