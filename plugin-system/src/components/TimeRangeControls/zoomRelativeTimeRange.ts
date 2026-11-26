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

import type { TimeOption } from '@perses-dev/components';
import type { DurationString, RelativeTimeRange, TimeRangeValue } from '@perses-dev/spec';
import { parseDurationString } from '@perses-dev/spec';

export function fromDurationToMillis(strDuration: DurationString): number {
  const duration = parseDurationString(strDuration);
  return (
    ((duration.seconds ?? 0) +
      (duration.minutes ?? 0) * 60 +
      (duration.hours ?? 0) * 3600 +
      (duration.days ?? 0) * 86400 +
      (duration.weeks ?? 0) * 7 * 86400 +
      (duration.months ?? 0) * 30.436875 * 86400 + // avg month duration is ok for zoom purposes
      (duration.years ?? 0) * 365.2425 * 86400) * // avg year duration is ok for zoom purposes
    1000 // to milliseconds
  );
}

/**
 * For a "last X" range (relative, no end), returns the next larger ("out") or smaller ("in") "last Y" entry of the
 * given presets, so zooming keeps following "now". Returns undefined when the range is not a "last X" one or when
 * there is no preset left in that direction.
 */
export function getNeighbourRelativeTimeRange(
  timeRange: TimeRangeValue,
  presets: TimeOption[],
  direction: 'in' | 'out',
): RelativeTimeRange | undefined {
  if (!('pastDuration' in timeRange) || timeRange.end !== undefined) {
    return undefined;
  }
  const currentMs = fromDurationToMillis(timeRange.pastDuration);
  let best: { value: RelativeTimeRange; ms: number } | undefined;
  for (const option of presets) {
    if (option.value.end !== undefined) {
      continue;
    }
    const ms = fromDurationToMillis(option.value.pastDuration);
    const isCandidate = direction === 'out' ? ms > currentMs : ms < currentMs;
    const isCloser = best === undefined || (direction === 'out' ? ms < best.ms : ms > best.ms);
    if (isCandidate && isCloser) {
      best = { value: option.value, ms };
    }
  }
  return best?.value;
}
