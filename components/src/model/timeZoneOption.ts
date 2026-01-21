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

export interface TimeZoneOption {
  value: string;
  display: string;
}

/**
 * List of common timezone options
 */
const TIMEZONE_OPTIONS: TimeZoneOption[] = [
  { value: 'local', display: 'Local' },
  { value: 'UTC', display: 'UTC' },
  { value: 'America/New_York', display: 'America/New_York' },
  { value: 'America/Chicago', display: 'America/Chicago' },
  { value: 'America/Denver', display: 'America/Denver' },
  { value: 'America/Los_Angeles', display: 'America/Los_Angeles' },
  { value: 'America/Anchorage', display: 'America/Anchorage' },
  { value: 'Pacific/Honolulu', display: 'Pacific/Honolulu' },
  { value: 'Europe/London', display: 'Europe/London' },
  { value: 'Europe/Paris', display: 'Europe/Paris' },
  { value: 'Europe/Berlin', display: 'Europe/Berlin' },
  { value: 'Europe/Moscow', display: 'Europe/Moscow' },
  { value: 'Asia/Dubai', display: 'Asia/Dubai' },
  { value: 'Asia/Kolkata', display: 'Asia/Kolkata' },
  { value: 'Asia/Bangkok', display: 'Asia/Bangkok' },
  { value: 'Asia/Shanghai', display: 'Asia/Shanghai' },
  { value: 'Asia/Hong_Kong', display: 'Asia/Hong_Kong' },
  { value: 'Asia/Singapore', display: 'Asia/Singapore' },
  { value: 'Asia/Tokyo', display: 'Asia/Tokyo' },
  { value: 'Australia/Sydney', display: 'Australia/Sydney' },
];

/**
 * Get all available timezone options
 * @returns Array of timezone options
 */
export function getTimeZoneOptions(): TimeZoneOption[] {
  return TIMEZONE_OPTIONS;
}
