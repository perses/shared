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

import { comparePluginVersions, sortPluginVersionsDesc } from './plugin-versions';

describe('comparePluginVersions', () => {
  test.each([
    ['1.0.0', '1.0.0', 0],
    ['1.2.0', '1.1.9', 1],
    ['1.1.0', '1.2.0', -1],
    ['v2.0.0', '1.9.9', 1],
    // Numeric, not lexicographic, comparison of each segment
    ['0.10.0', '0.9.0', 1],
    ['1.10.0', '1.9.0', 1],
    // A pre-release orders below its stable release
    ['1.0.0-beta', '1.0.0', -1],
    ['1.0.0-rc.2', '1.0.0-rc.1', 1],
    // Loose forms the backend also accepts
    ['1.0', '1.0.0', 0],
    // Anything unparseable orders below a real version so it can never be picked as "the latest"
    ['not-a-version', '0.0.1', -1],
    ['0.0.1', 'not-a-version', 1],
  ])('comparePluginVersions(%s, %s)', (a, b, expected) => {
    expect(Math.sign(comparePluginVersions(a as string, b as string))).toBe(expected);
  });

  test('two unparseable versions are compared lexicographically', () => {
    expect(Math.sign(comparePluginVersions('abc', 'abd'))).toBe(-1);
  });
});

describe('sortPluginVersionsDesc', () => {
  test('sorts from newest to oldest without mutating the input', () => {
    const versions = ['1.0.0', '2.0.0-rc1', '1.10.0', '2.0.0'];
    expect(sortPluginVersionsDesc(versions)).toEqual(['2.0.0', '2.0.0-rc1', '1.10.0', '1.0.0']);
    expect(versions).toEqual(['1.0.0', '2.0.0-rc1', '1.10.0', '2.0.0']);
  });
});
