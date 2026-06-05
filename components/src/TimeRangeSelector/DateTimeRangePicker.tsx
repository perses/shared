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

import { ReactElement, useState } from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import { DateTimeField, LocalizationProvider, StaticDateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';
import { AbsoluteTimeRange } from '@perses-dev/spec';
import { TZDate } from '@date-fns/tz';
import { ErrorBoundary } from '../ErrorBoundary';
import { ErrorAlert } from '../ErrorAlert';
import { DATE_TIME_FORMAT, validateDateRange } from './utils';

export interface AbsoluteTimeFormProps {
  initialTimeRange: AbsoluteTimeRange;
  onChange: (timeRange: AbsoluteTimeRange) => void;
  onCancel: () => void;
  timeZone: string;
}

/**
 * Start and End datetime picker, allowing use to select a specific time range selecting two absolute dates and times.
 * TODO: Use directly the MUI X ``DateTimePicker`` for datetime selection which is better. https://next.mui.com/x/react-date-pickers/date-time-picker/
 *   Use ``DateTimeRangePicker`` directly would be cool but paid https://next.mui.com/x/react-date-pickers/date-time-range-picker/
 * @param initialTimeRange initial time range to pre-select.
 * @param onChange event received when start and end has been selected (click on apply)
 * @param onCancel event received when user click on cancel
 * @constructor
 */
export const DateTimeRangePicker = ({
  initialTimeRange,
  onChange,
  onCancel,
  timeZone,
}: AbsoluteTimeFormProps): ReactElement => {
  const stdTimeZone = ['local', 'browser'].includes(timeZone.toLowerCase())
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : timeZone;
  const [timeRange, setTimeRange] = useState<AbsoluteTimeRange>(initialTimeRange);
  const [showStartCalendar, setShowStartCalendar] = useState<boolean>(true);

  const changeTimeRange = (newTime: Date, segment: keyof AbsoluteTimeRange): void => {
    setTimeRange((prevTimeRange) => {
      return {
        ...prevTimeRange,
        [segment]: newTime,
      };
    });
  };

  const onChangeStartTime = (newStartTime: Date): void => {
    changeTimeRange(newStartTime, 'start');
  };

  const onChangeEndTime = (newEndTime: Date): void => {
    changeTimeRange(newEndTime, 'end');
  };

  const updateDateRange = (): { start: Date; end: Date } | undefined => {
    const newDates = {
      start: timeRange.start,
      end: timeRange.end,
    };
    const isValidDateRange = validateDateRange(newDates.start, newDates.end);
    if (isValidDateRange) {
      return newDates;
    }
  };

  const onApply = (): void => {
    const newDates = updateDateRange();
    if (newDates) {
      onChange(newDates);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Stack
        spacing={2}
        sx={(theme) => ({
          padding: theme.spacing(1, 0, 2),
        })}
      >
        {showStartCalendar && (
          <Box
            sx={(theme) => ({
              // TODO: create separate reusable calendar component
              '.MuiPickersLayout-contentWrapper': {
                backgroundColor: theme.palette.background.default,
              },
            })}
          >
            <Typography variant="h3" padding={1} paddingLeft={2}>
              Select Start Time
            </Typography>
            <StaticDateTimePicker
              timezone={stdTimeZone}
              displayStaticWrapperAs="desktop"
              openTo="day"
              disableHighlightToday={true}
              value={new TZDate(timeRange.start, stdTimeZone)}
              onChange={(newValue) => {
                if (newValue === null) return;
                onChangeStartTime(newValue);
              }}
              onAccept={() => {
                setShowStartCalendar(false);
              }}
            />
          </Box>
        )}
        {!showStartCalendar && (
          <Box
            sx={(theme) => ({
              '.MuiPickersLayout-contentWrapper': {
                backgroundColor: theme.palette.background.default,
              },
            })}
          >
            <Typography variant="h3" padding={1} paddingLeft={2}>
              Select End Time
            </Typography>
            <StaticDateTimePicker
              timezone={stdTimeZone}
              displayStaticWrapperAs="desktop"
              openTo="day"
              disableHighlightToday={true}
              value={new TZDate(timeRange.end, stdTimeZone)}
              minDateTime={new TZDate(timeRange.start, stdTimeZone)}
              onChange={(newValue) => {
                if (newValue === null) return;
                onChangeEndTime(newValue);
              }}
              onAccept={(newValue) => {
                if (newValue === null) return;
                setShowStartCalendar(true);
                onChangeEndTime(newValue);
              }}
            />
          </Box>
        )}
        <Stack direction="row" alignItems="center" gap={1} pl={1} pr={1}>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <DateTimeField
              data-testid="start_time_input"
              timezone={stdTimeZone}
              label="Start Time"
              value={new TZDate(timeRange.start, stdTimeZone)}
              onChange={(event: Date | null) => {
                if (event) {
                  onChangeStartTime(event);
                }
              }}
              onBlur={() => updateDateRange()}
              format={DATE_TIME_FORMAT}
            />
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <DateTimeField
              data-testid="end_time_input"
              timezone={stdTimeZone}
              label="End Time"
              value={new TZDate(timeRange.end, stdTimeZone)}
              onChange={(event: Date | null) => {
                if (event) {
                  onChangeEndTime(event);
                }
              }}
              onBlur={() => updateDateRange()}
              format={DATE_TIME_FORMAT}
            />
          </ErrorBoundary>
        </Stack>
        <Stack direction="row" sx={{ padding: (theme) => theme.spacing(0, 1) }} gap={1}>
          <Button variant="contained" onClick={() => onApply()} fullWidth>
            Apply
          </Button>
          <Button variant="outlined" onClick={() => onCancel()} fullWidth>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </LocalizationProvider>
  );
};
