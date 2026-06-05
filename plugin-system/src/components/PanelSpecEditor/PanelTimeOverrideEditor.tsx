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

// LOGZ.IO CHANGE START:: Panel-level time range override editor (Grafana parity) [APPZ-2474]
// Renders three react-hook-form-bound inputs for the panel-level "Relative time" /
// "Time shift" / "Hide override" fields. Lives in plugin-system because it's used
// by `PanelSpecEditor` (also plugin-system); only depends on react-hook-form + MUI
// + the `PanelEditorValues` type from `@perses-dev/spec`.
//
// Field paths are cast to `any` because the `PanelSpec` interface in `@perses-dev/spec`
// doesn't declare these fields (we deliberately avoided module-augmenting it — see the
// commit body on the runtime override provider for why). The runtime path resolution
// in react-hook-form is string-based and works regardless of the static types.
import { Stack, TextField, FormControlLabel, Checkbox, Typography, Box, Collapse, IconButton } from '@mui/material';
import { Control, Controller, FieldPath, useWatch } from 'react-hook-form';
import { PanelEditorValues } from '@perses-dev/spec';
import { ReactElement, useState } from 'react';
import ChevronDownIcon from 'mdi-material-ui/ChevronDown';
import ChevronRightIcon from 'mdi-material-ui/ChevronRight';

export interface PanelTimeOverrideEditorProps {
  control: Control<PanelEditorValues>;
}

const TIME_FROM_PATH = 'panelDefinition.spec.timeFrom' as unknown as FieldPath<PanelEditorValues>;
const TIME_SHIFT_PATH = 'panelDefinition.spec.timeShift' as unknown as FieldPath<PanelEditorValues>;
const HIDE_OVERRIDE_PATH = 'panelDefinition.spec.hideTimeOverride' as unknown as FieldPath<PanelEditorValues>;

export function PanelTimeOverrideEditor({ control }: PanelTimeOverrideEditorProps): ReactElement {
  // Watch the three override fields so we can decide whether to start expanded (any
  // value already set) or collapsed (the common case for new panels). We only read the
  // values once at mount via the lazy `useState` initializer — toggling the section
  // shouldn't depend on the live value, otherwise typing would auto-collapse the
  // section the moment the user clears the field.
  const timeFrom = useWatch({ control, name: TIME_FROM_PATH });
  const timeShift = useWatch({ control, name: TIME_SHIFT_PATH });
  const hideOverride = useWatch({ control, name: HIDE_OVERRIDE_PATH });
  const [isOpen, setIsOpen] = useState(() => Boolean(timeFrom || timeShift || hideOverride));

  return (
    <Box sx={{ pb: 2, borderBottom: 1, borderColor: (theme) => theme.palette.divider }}>
      <Stack
        direction="row"
        alignItems="center"
        sx={{ cursor: 'pointer', userSelect: 'none' }}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <IconButton size="small" aria-label={isOpen ? 'Collapse override time range' : 'Expand override time range'}>
          {isOpen ? <ChevronDownIcon fontSize="small" /> : <ChevronRightIcon fontSize="small" />}
        </IconButton>
        <Typography variant="overline" component="h4">
          Override Time Range (Optional)
        </Typography>
      </Stack>
      <Collapse in={isOpen} unmountOnExit>
        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mt: 1, ml: 4 }}>
          <Controller
            control={control}
            name={TIME_FROM_PATH}
            render={({ field }) => (
              <TextField
                size="small"
                label="Relative time"
                placeholder="e.g. 14d"
                helperText="Override dashboard time range"
                value={(field.value as string | undefined) ?? ''}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                sx={{ width: 240 }}
              />
            )}
          />
          <Controller
            control={control}
            name={TIME_SHIFT_PATH}
            render={({ field }) => (
              <TextField
                size="small"
                label="Time shift"
                placeholder="e.g. 1d"
                helperText="Shift both ends back by this duration"
                value={(field.value as string | undefined) ?? ''}
                onChange={(e) => field.onChange(e.target.value || undefined)}
                onBlur={field.onBlur}
                inputRef={field.ref}
                sx={{ width: 240 }}
              />
            )}
          />
          <Controller
            control={control}
            name={HIDE_OVERRIDE_PATH}
            render={({ field }) => (
              <FormControlLabel
                sx={{ pt: 1 }}
                control={
                  <Checkbox
                    size="small"
                    checked={Boolean(field.value)}
                    onChange={(e) => field.onChange(e.target.checked || undefined)}
                    inputRef={field.ref}
                  />
                }
                label="Hide override badge"
              />
            )}
          />
        </Stack>
      </Collapse>
    </Box>
  );
}
// LOGZ.IO CHANGE END:: Panel-level time range override editor [APPZ-2474]
