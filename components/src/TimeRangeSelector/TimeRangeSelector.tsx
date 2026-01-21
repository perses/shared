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

import { Box, MenuItem, Popover, Select, IconButton, TextField } from '@mui/material';
import Calendar from 'mdi-material-ui/Calendar';
import EarthIcon from 'mdi-material-ui/Earth';
import { TimeRangeValue, isRelativeTimeRange, AbsoluteTimeRange, toAbsoluteTimeRange } from '@perses-dev/core';
import { ReactElement, useMemo, useRef, useState } from 'react';
import { useTimeZone } from '../context';
import { TimeZoneOption, getTimeZoneOptions } from '../model/timeZoneOption';
import { TimeOption } from '../model';
import { SettingsAutocomplete, SettingsAutocompleteOption } from '../SettingsAutocomplete';
import { DateTimeRangePicker } from './DateTimeRangePicker';
import { buildCustomTimeOption, formatTimeRange } from './utils';

interface TimeRangeSelectorProps {
  /**
   * The current value of the time range.
   */
  value: TimeRangeValue;
  /**
   * The list of time options to display in the dropdown.
   * The component will automatically add the last two options as a zoom out x2 and a custom absolute time range.
   */
  timeOptions: TimeOption[];
  /**
   * The callback to call when the time range changes.
   */
  onChange: (value: TimeRangeValue) => void;
  /**
   * Custom line height for the select component.
   */
  height?: string;
  /**
   * Whether to show the custom time range option.
   * Defaults to true.
   */
  showCustomTimeRange?: boolean;
  /** Optional explicit timezone and change handler to enable changing tz from the selector */
  timeZone?: string;
  timeZoneOptions?: TimeZoneOption[];
  onTimeZoneChange?: (timeZone: TimeZoneOption) => void;
}

/**
 * Date & time selection component to customize what data renders on dashboard.
 * This includes relative shortcuts and the ability to pick absolute start and end times.
 * @param props
 * @constructor
 */
export function TimeRangeSelector({
  value,
  timeOptions,
  onChange,
  height,
  showCustomTimeRange = true,
  timeZone: timeZoneProp,
  timeZoneOptions,
  onTimeZoneChange,
}: TimeRangeSelectorProps): ReactElement {
  const { timeZone: ctxTimeZone } = useTimeZone();
  const timeZone = timeZoneProp ?? ctxTimeZone;

  const anchorEl = useRef();
  const [showCustomDateSelector, setShowCustomDateSelector] = useState(false);

  const convertedTimeRange = useMemo(() => {
    return isRelativeTimeRange(value) ? toAbsoluteTimeRange(value) : value;
  }, [value]);

  const lastOption = useMemo(
    () => buildCustomTimeOption(isRelativeTimeRange(value) ? undefined : value, timeZone),
    [value, timeZone]
  );

  const [open, setOpen] = useState(false);
  const tzOptions = useMemo(() => timeZoneOptions ?? getTimeZoneOptions(), [timeZoneOptions]);
  const [tzAnchorEl, setTzAnchorEl] = useState<HTMLElement | null>(null);
  const tzOpen = Boolean(tzAnchorEl);
  const tzLabel = useMemo(() => tzOptions.find((o) => o.value === timeZone)?.display ?? timeZone, [tzOptions, timeZone]);

  return (
    <>
      {/* Timezone selector popover opened from globe icon */}
      <Popover
        anchorEl={tzAnchorEl}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        open={tzOpen}
        onClose={() => setTzAnchorEl(null)}
        sx={(theme) => ({ padding: theme.spacing(1) })}
      >
        <Box
          sx={{ p: 1, minWidth: 260 }}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <SettingsAutocomplete
            options={useMemo<SettingsAutocompleteOption[]>(
              () => tzOptions.map((o) => ({ id: o.value, label: o.display })),
              [tzOptions]
            )}
            value={useMemo<SettingsAutocompleteOption | undefined>(() => {
              const current = tzOptions.find((o) => o.value === timeZone);
              return current ? { id: current.value, label: current.display } : undefined;
            }, [tzOptions, timeZone])}
            onChange={(_e, option) => {
              if (option) {
                const selected = tzOptions.find((o) => o.value === option.id);
                if (selected) onTimeZoneChange?.(selected);
              }
              setTzAnchorEl(null);
            }}
            disableClearable
            renderInput={(params) => (
              <TextField {...params} placeholder="Search timezones" size="small" autoFocus />
            )}
          />
        </Box>
      </Popover>

      <Popover
        anchorEl={anchorEl.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        open={showCustomDateSelector}
        onClose={() => setShowCustomDateSelector(false)}
        sx={(theme) => ({ padding: theme.spacing(2) })}
      >
        <DateTimeRangePicker
          initialTimeRange={convertedTimeRange}
          onChange={(value: AbsoluteTimeRange) => {
            onChange(value);
            setShowCustomDateSelector(false);
            setOpen(false);
          }}
          onCancel={() => setShowCustomDateSelector(false)}
          timeZone={timeZone}
        />
      </Popover>

      {/* Header and options */}
      <Box ref={anchorEl}>
        <Select
          open={open}
          value={formatTimeRange(value, timeZone)}
          onClick={() => setOpen(!open)}
          IconComponent={Calendar}
          inputProps={{ 'aria-label': `Select time range. Currently set to ${value}` }}
          sx={{
            '.MuiSelect-icon': { marginTop: '1px', transform: 'none' },
            '.MuiSelect-select.MuiSelect-outlined.MuiInputBase-input': { paddingRight: '36px' },
            '.MuiSelect-select': height ? { lineHeight: height, paddingY: 0 } : {},
          }}
        >
          <MenuItem
            disableRipple
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            sx={{ cursor: 'default', '&:hover': { backgroundColor: 'transparent' }, py: 0.5, px: 1 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ typography: 'subtitle1' }}>Time Range</Box>
                <Box sx={{ color: 'text.secondary', typography: 'caption', mt: 0.25 }}>Timezone: {tzLabel}</Box>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', pr: 1, ml: 1.5 }}>
                <IconButton
                  size="small"
                  aria-label="Select timezone"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setTzAnchorEl(e.currentTarget);
                  }}
                >
                  <EarthIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </MenuItem>

          {timeOptions.map((item, idx) => (
            <MenuItem
              key={idx}
              value={formatTimeRange(item.value, timeZone)}
              onClick={() => {
                onChange(item.value);
              }}
            >
              {item.display}
            </MenuItem>
          ))}

          {showCustomTimeRange && (
            <MenuItem value={formatTimeRange(lastOption.value, timeZone)} onClick={() => setShowCustomDateSelector(true)}>
              {lastOption.display}
            </MenuItem>
          )}
        </Select>
      </Box>
    </>
  );
}
