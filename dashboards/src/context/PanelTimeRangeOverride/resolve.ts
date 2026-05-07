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

// LOGZ.IO CHANGE START:: Panel-level time range override resolution [APPZ-2474]
// Maps Grafana panel `timeFrom` / `timeShift` semantics onto Perses time-range types.
// Grafana semantics (verified against Grafana docs + source):
//   - timeFrom: "14d" or "now-14d" → [now - 14d, now] anchored to NOW (not dashboard `to`)
//   - timeShift: "1d" → both ends of the resolved range shift back by 1d
//   - Order: timeFrom resolves first, then timeShift applies
// Grafana also accepts alignment modifiers like "/d" / "/w"; Perses has no built-in alignment,
// so we strip them with a console.warn for v1.
import {
  AbsoluteTimeRange,
  DurationString,
  RelativeTimeRange,
  TimeRangeValue,
  isDurationString,
  parseDurationString,
  toAbsoluteTimeRange,
} from '@perses-dev/core';
import { sub } from 'date-fns';

export interface PanelTimeOverrideSpec {
  timeFrom?: string;
  timeShift?: string;
}

export interface ResolvedTimeRange {
  timeRange: TimeRangeValue;
  absoluteTimeRange: AbsoluteTimeRange;
}

/**
 * Parses a Grafana-style relative time spec (e.g. "14d", "now-14d", "now-14d/d") into a
 * Perses `DurationString`. Returns `null` on invalid input. Logs a warning when alignment
 * modifiers are present (they're dropped for v1).
 */
export function parseGrafanaTimeOverride(value: string | undefined): DurationString | null {
  if (!value) return null;

  let s = value.trim();
  if (s.length === 0) return null;

  // Strip optional "now-" prefix.
  if (s.startsWith('now-')) {
    s = s.slice(4);
  } else if (s.startsWith('now')) {
    // "now" alone → no duration, treat as invalid.
    return null;
  }

  // Strip alignment modifier ("/d", "/w", etc.) — Perses has no equivalent.
  const slashIdx = s.indexOf('/');
  if (slashIdx >= 0) {
    // eslint-disable-next-line no-console
    console.warn(`[panel time override] alignment modifier "${s.slice(slashIdx)}" is not supported and was ignored`);
    s = s.slice(0, slashIdx);
  }

  if (!isDurationString(s)) return null;

  return s;
}

/**
 * Computes the time range a panel should use given its parent (dashboard) time range and
 * its override spec. Returns the parent range unchanged when the override is empty or
 * fails to parse.
 */
export function resolvePanelTimeOverride(
  parent: ResolvedTimeRange,
  override: PanelTimeOverrideSpec
): ResolvedTimeRange {
  const timeFrom = parseGrafanaTimeOverride(override.timeFrom);
  const timeShift = parseGrafanaTimeOverride(override.timeShift);

  if (override.timeFrom && timeFrom === null) {
    // eslint-disable-next-line no-console
    console.warn(`[panel time override] invalid timeFrom "${override.timeFrom}", ignoring`);
  }
  if (override.timeShift && timeShift === null) {
    // eslint-disable-next-line no-console
    console.warn(`[panel time override] invalid timeShift "${override.timeShift}", ignoring`);
  }

  if (!timeFrom && !timeShift) return parent;

  // Step 1: apply timeFrom (anchored to "now") if set; otherwise inherit parent.
  let timeRange: TimeRangeValue;
  let absoluteTimeRange: AbsoluteTimeRange;
  if (timeFrom) {
    const relative: RelativeTimeRange = { pastDuration: timeFrom };
    timeRange = relative;
    absoluteTimeRange = toAbsoluteTimeRange(relative);
  } else {
    timeRange = parent.timeRange;
    absoluteTimeRange = parent.absoluteTimeRange;
  }

  // Step 2: apply timeShift to both ends. Result is always absolute — relative semantics
  // ("last N hours, but a day ago") aren't representable as a `RelativeTimeRange`.
  if (timeShift) {
    const duration = parseDurationString(timeShift);
    const shiftedStart = sub(absoluteTimeRange.start, duration);
    const shiftedEnd = sub(absoluteTimeRange.end, duration);
    absoluteTimeRange = { start: shiftedStart, end: shiftedEnd };
    timeRange = absoluteTimeRange;
  }

  return { timeRange, absoluteTimeRange };
}

/**
 * Renders a short human label for the active override, suitable for a panel-header badge.
 * Returns `null` when no override is active or `hideTimeOverride` is true.
 */
export function getPanelTimeOverrideLabel(spec: {
  timeFrom?: string;
  timeShift?: string;
  hideTimeOverride?: boolean;
}): string | null {
  if (spec.hideTimeOverride) return null;
  const timeFrom = parseGrafanaTimeOverride(spec.timeFrom);
  const timeShift = parseGrafanaTimeOverride(spec.timeShift);
  if (!timeFrom && !timeShift) return null;

  const parts: string[] = [];
  if (timeFrom) parts.push(`Last ${timeFrom}`);
  if (timeShift) parts.push(`shifted ${timeShift}`);
  return `⏱ ${parts.join(', ')}`;
}
// LOGZ.IO CHANGE END:: Panel-level time range override resolution [APPZ-2474]
