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

import { ReactElement, useMemo, useState } from 'react';
import { Box, Stack, Typography, Button } from '@mui/material';
import { DateTimeField, LocalizationProvider, StaticDateTimePicker } from '@mui/x-date-pickers';
import { AbsoluteTimeRange } from '@perses-dev/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ErrorBoundary } from '../ErrorBoundary';
import { ErrorAlert } from '../ErrorAlert';
import { formatWithTimeZone } from '../utils/format-dayjs';
import { DAYJS_DATE_TIME_FORMAT, validateDateRange } from './utils';

dayjs.extend(utc);
dayjs.extend(timezone);

interface AbsoluteTimeFormProps {
  initialTimeRange: AbsoluteTimeRange;
  onChange: (timeRange: AbsoluteTimeRange) => void;
  onCancel: () => void;
  timeZone: string;
}

type AbsoluteTimeRangeInputValue = {
  [Property in keyof AbsoluteTimeRange]: dayjs.Dayjs;
};

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
  const stdTimeZone = timeZone.toLowerCase() === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : timeZone;
  // Time range values as dates that can be used as a time range.
  const [timeRange, setTimeRange] = useState<AbsoluteTimeRange>(initialTimeRange);

  const timeRangeInputs = useMemo<AbsoluteTimeRangeInputValue>(() => {
    return {
      start: formatWithTimeZone(timeRange.start, timeZone),
      end: formatWithTimeZone(timeRange.end, timeZone),
    };
  }, [timeRange.start, timeRange.end, timeZone]);

  const [showStartCalendar, setShowStartCalendar] = useState<boolean>(true);

  const changeTimeRange = (newTime: dayjs.Dayjs, segment: keyof AbsoluteTimeRange): void => {
    setTimeRange((prevTimeRange) => {
      return {
        ...prevTimeRange,
        [segment]: newTime.toDate(),
      };
    });
  };

  const onChangeStartTime = (newStartTime: dayjs.Dayjs): void => {
    changeTimeRange(newStartTime, 'start');
  };

  const onChangeEndTime = (newEndTime: dayjs.Dayjs): void => {
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
    <LocalizationProvider dateAdapter={AdapterDayjs}>
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
              value={dayjs(timeRange.start)}
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
              value={dayjs(timeRange.end)}
              minDateTime={dayjs(timeRange.start)}
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
              label="Start Time"
              value={timeRangeInputs.start}
              onChange={(event: dayjs.Dayjs | null) => {
                if (event) {
                  onChangeStartTime(event);
                }
              }}
              onBlur={() => updateDateRange()}
              format={DAYJS_DATE_TIME_FORMAT}
            />
          </ErrorBoundary>
          <ErrorBoundary FallbackComponent={ErrorAlert}>
            <DateTimeField
              label="End Time"
              value={timeRangeInputs.end}
              onChange={(event: dayjs.Dayjs | null) => {
                if (event) {
                  onChangeEndTime(event);
                }
              }}
              onBlur={() => updateDateRange()}
              format={DAYJS_DATE_TIME_FORMAT}
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
