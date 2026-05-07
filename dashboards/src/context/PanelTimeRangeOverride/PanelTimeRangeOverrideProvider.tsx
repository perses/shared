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

// LOGZ.IO CHANGE START:: Panel-level time range override provider [APPZ-2474]
// Supplies a nested TimeRangeContext value scoped to a single panel, applying the panel's
// `timeFrom` / `timeShift` override on top of the parent (dashboard) time range. Mutators
// (`setTimeRange`, `setRefreshInterval`, `refresh`) delegate upward to the dashboard
// provider, so user actions still apply to the dashboard.
//
// We render the underlying `TimeRangeContext.Provider` directly (not the upstream
// `TimeRangeProvider` component) for two reasons:
//   1. `TimeRangeProvider` captures `absoluteTimeRange` in `useState` once at mount and
//      ignores subsequent prop changes — so updating the override in the panel editor
//      wouldn't re-flow to queries.
//   2. The element shape must stay stable across keystrokes that toggle the override on/
//      off, otherwise React unmounts the entire subtree (focus loss, value loss).
//
// Known limitation (matches Grafana's own behavior): `$__from` / `$__to` builtin variables
// are computed by the dashboard-level VariableProvider and continue to read the dashboard
// range, not the panel override.
import { ReactElement, ReactNode, useMemo } from 'react';
import { TimeRange, TimeRangeContext, useTimeRange } from '@perses-dev/plugin-system';
import { PanelTimeOverrideSpec, resolvePanelTimeOverride } from './resolve';

export interface PanelTimeRangeOverrideProviderProps {
  spec: PanelTimeOverrideSpec;
  children?: ReactNode;
}

/**
 * Provides a TimeRangeContext value scoped to the panel, with `spec`'s override applied
 * to the parent range. When the override is empty/unparseable the resolved range is the
 * parent range unchanged — i.e. consumers see no behavior difference.
 */
export function PanelTimeRangeOverrideProvider({ spec, children }: PanelTimeRangeOverrideProviderProps): ReactElement {
  const parent = useTimeRange();

  // Destructure into local vars so useMemo's dep array can list each field directly. Callers
  // typically rebuild the `spec` object on every render (e.g. from `useWatch`); depending on
  // `spec` itself would re-resolve every render even when timeFrom/timeShift didn't change.
  const { timeFrom, timeShift } = spec;

  const resolved = useMemo(
    () =>
      resolvePanelTimeOverride(
        { timeRange: parent.timeRange, absoluteTimeRange: parent.absoluteTimeRange },
        { timeFrom, timeShift }
      ),
    [parent.timeRange, parent.absoluteTimeRange, timeFrom, timeShift]
  );

  const ctx = useMemo<TimeRange>(
    () => ({
      timeRange: resolved.timeRange,
      absoluteTimeRange: resolved.absoluteTimeRange,
      // Mutators / refresh delegate upward — there's no separate panel-level
      // refresh state; the panel re-resolves automatically when the dashboard does.
      setTimeRange: parent.setTimeRange,
      setRefreshInterval: parent.setRefreshInterval,
      refresh: parent.refresh,
      refreshInterval: parent.refreshInterval,
      refreshIntervalInMs: parent.refreshIntervalInMs,
    }),
    [
      resolved.timeRange,
      resolved.absoluteTimeRange,
      parent.setTimeRange,
      parent.setRefreshInterval,
      parent.refresh,
      parent.refreshInterval,
      parent.refreshIntervalInMs,
    ]
  );

  return <TimeRangeContext.Provider value={ctx}>{children}</TimeRangeContext.Provider>;
}
// LOGZ.IO CHANGE END:: Panel-level time range override provider [APPZ-2474]
