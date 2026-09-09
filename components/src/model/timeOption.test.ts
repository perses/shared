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

import type { DurationString } from '@perses-dev/spec';

import { buildRelativeTimeOption } from './timeOption';
import type { RelativeTimeOptionPrefixString } from './timeOption';

describe('timeOption', () => {
  describe('display prefixString', () => {
    const prefixes: Array<{
      prefix: RelativeTimeOptionPrefixString | undefined;
      expected: string;
    }> = [
      { prefix: 'Last', expected: 'Last 5 minutes' },
      { prefix: 'Every', expected: 'Every 5 minutes' },
      { prefix: '', expected: '5 minutes' },
      { prefix: undefined, expected: 'Last 5 minutes' },
    ];
    const duration: DurationString = '5m';
    for (const { expected, prefix } of prefixes) {
      const { display } =
        typeof prefix === 'string' ? buildRelativeTimeOption(duration, prefix) : buildRelativeTimeOption(duration);
      test(`display should be ${expected}`, () => {
        expect(display).toBe(expected);
      });
    }
  });
});
