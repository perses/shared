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

import type { Link } from '@perses-dev/spec';

import { isTagLink, isURLLink } from './link';

describe('isTagLink / isURLLink', () => {
  const cases: Array<{ title: string; link: Link; tag: boolean }> = [
    { title: 'a URL link', link: { url: 'https://perses.dev' }, tag: false },
    { title: 'a URL link with an empty URL', link: { url: '' }, tag: false },
    { title: 'a tag link', link: { name: 'Related', tags: ['team-a'] }, tag: true },
    { title: 'a link with an empty tag list', link: { url: '', tags: [] } as unknown as Link, tag: false },
    { title: 'a tag link with an empty URL', link: { name: 'R', url: '', tags: ['a'] } as unknown as Link, tag: true },
    { title: 'a link with neither a URL nor tags', link: { name: 'x' } as unknown as Link, tag: false },
  ];

  it.each(cases)('classifies $title', ({ link, tag }) => {
    expect(isTagLink(link)).toBe(tag);
    expect(isURLLink(link)).toBe(!tag);
  });
});
