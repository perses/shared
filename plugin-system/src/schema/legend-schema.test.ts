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

import { LegendSchema } from './legend-schema';

describe('legend schema', () => {
  test('should pass with minimum required fields', () => {
    const validData = {
      position: 'bottom',
    };
    const result = LegendSchema.safeParse(validData);
    expect(result.success).toBe(true);
    console.log(result.error);
  });

  test('should pass with all fields provided', () => {
    const validData = {
      position: 'bottom',
      mode: 'table',
      size: 'medium',
      values: ['sum', 'abs'],
    };
    const result = LegendSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  test('should fail if position is missing', () => {
    const invalidData = {
      mode: 'list',
    };
    const result = LegendSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result?.error?.issues?.[0]?.path).toContain('position');
    }
  });

  test('should fail if an invalid position value is provided', () => {
    const invalidData = {
      position: 'center',
    };
    const result = LegendSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  test('should handle empty values array', () => {
    const validData = {
      position: 'bottom',
      values: [],
    };
    const result = LegendSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });
});
