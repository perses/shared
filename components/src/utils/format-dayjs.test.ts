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

import dayjs from 'dayjs';
import { formatWithTimeZone } from './format-dayjs';

describe('formatWithTimeZone', () => {
  const mockDate = new Date('2024-03-10T12:00:00Z');

  test('should return local time when no timezone is provided', () => {
    const result = formatWithTimeZone(mockDate);
    expect(result.toISOString()).toBe(dayjs(mockDate).toISOString());
  });

  test('should return local time when "local" or "browser" is passed', () => {
    const localResult = formatWithTimeZone(mockDate, 'local');
    const browserResult = formatWithTimeZone(mockDate, 'browser');
    expect(localResult.toISOString()).toBe(dayjs(mockDate).toISOString());
    expect(browserResult.toISOString()).toBe(dayjs(mockDate).toISOString());
  });

  test('should convert to UTC correctly', () => {
    const result = formatWithTimeZone(mockDate, 'utc');
    expect(result.format('Z')).toBe('+00:00');
    expect(result.format('HH:mm')).toBe('12:00');
  });

  test('should convert to Europe/London (GMT/BST)', () => {
    const result = formatWithTimeZone(mockDate, 'Europe/London');
    expect(result.format('Z')).toBe('+00:00');
    expect(result.format('HH:mm')).toBe('12:00');
  });

  test('should handle Daylight Savings correctly (London Summer Time)', () => {
    const summerDate = new Date('2024-07-10T12:00:00Z');
    const result = formatWithTimeZone(summerDate, 'Europe/London');

    expect(result.format('Z')).toBe('+01:00');
    expect(result.format('HH:mm')).toBe('13:00');
  });

  test('should convert to America/New_York (-04:00/-05:00)', () => {
    const result = formatWithTimeZone(mockDate, 'America/New_York');
    expect(result.format('HH:mm')).toBe('08:00');
  });
});
