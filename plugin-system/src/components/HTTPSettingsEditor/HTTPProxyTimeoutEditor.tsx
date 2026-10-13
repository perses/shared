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

import { TextField } from '@mui/material';
import type { DurationString, HTTPProxySpec } from '@perses-dev/spec';
import { isDurationString } from '@perses-dev/spec';
import type { ChangeEvent, ReactElement } from 'react';
import { useCallback, useMemo } from 'react';

const timeoutFieldSx = { mb: 2 };

interface HTTPProxyTimeoutEditorProps {
  value: HTTPProxySpec;
  onChange: (next: HTTPProxySpec) => void;
  isReadonly?: boolean;
}

/** Edits the optional connection timeout of an HTTP proxy. An empty value unsets the timeout. */
export function HTTPProxyTimeoutEditor({ value, onChange, isReadonly }: HTTPProxyTimeoutEditorProps): ReactElement {
  const timeout = value.timeout ?? '';
  // TODO this thing should be handled by a form schema.
  const isInvalid = timeout !== '' && !isDurationString(timeout);

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
      const nextTimeout = e.target.value;
      onChange({ ...value, timeout: nextTimeout === '' ? undefined : (nextTimeout as DurationString) });
    },
    [value, onChange],
  );
  const inputProps = useMemo(() => ({ readOnly: isReadonly }), [isReadonly]);
  const inputLabelProps = useMemo(() => ({ shrink: isReadonly ? true : undefined }), [isReadonly]);

  return (
    <TextField
      fullWidth
      label="Timeout"
      placeholder="e.g. 30s, 1m30s"
      value={timeout}
      error={isInvalid}
      helperText={
        isInvalid
          ? 'Must be a valid duration string (e.g. 30s, 1m30s)'
          : 'Maximum time allowed to establish a connection to the datasource. Leave empty or set to 0s to use the Perses server default.'
      }
      InputProps={inputProps}
      InputLabelProps={inputLabelProps}
      onChange={handleChange}
      sx={timeoutFieldSx}
    />
  );
}
