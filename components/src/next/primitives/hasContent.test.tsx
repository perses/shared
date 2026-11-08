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

import { hasContent } from './hasContent';

describe('hasContent', () => {
  it('treats 0, text and elements as content', () => {
    expect(hasContent(0)).toBe(true);
    expect(hasContent('Name')).toBe(true);
    expect(hasContent(<span>Name</span>)).toBe(true);
  });

  it('treats empty string, booleans, null and undefined as absent', () => {
    expect(hasContent('')).toBe(false);
    expect(hasContent(false)).toBe(false);
    expect(hasContent(true)).toBe(false);
    expect(hasContent(null)).toBe(false);
    expect(hasContent(undefined)).toBe(false);
  });
});
