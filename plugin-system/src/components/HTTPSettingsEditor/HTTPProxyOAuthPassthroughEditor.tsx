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

import type { SwitchProps } from '@mui/material';
import { FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import type { HTTPProxySpec } from '@perses-dev/spec';
import type { ReactElement } from 'react';
import { useCallback, useId, useMemo } from 'react';

interface HTTPProxyOAuthPassthroughEditorProps {
  value: HTTPProxySpec;
  onChange: (next: HTTPProxySpec) => void;
  isReadonly?: boolean;
}

/** Toggles forwarding of the logged-in user's OAuth/OIDC access token to the datasource. Disabling it unsets the field. */
export function HTTPProxyOAuthPassthroughEditor({
  value,
  onChange,
  isReadonly,
}: HTTPProxyOAuthPassthroughEditorProps): ReactElement {
  const descriptionId = useId();
  const checked = value.oauthPassthrough ?? false;

  const handleChange = useCallback<NonNullable<SwitchProps['onChange']>>(
    (_, nextChecked) => {
      // The readOnly attribute does not prevent a checkbox from being toggled.
      if (isReadonly) return;
      onChange({ ...value, oauthPassthrough: nextChecked ? true : undefined });
    },
    [isReadonly, value, onChange],
  );
  const inputProps = useMemo(() => ({ 'aria-describedby': descriptionId }), [descriptionId]);
  const control = useMemo(
    () => <Switch checked={checked} readOnly={isReadonly} inputProps={inputProps} onChange={handleChange} />,
    [checked, isReadonly, inputProps, handleChange],
  );

  return (
    <Stack>
      <FormControlLabel label="Forward OAuth identity" control={control} />
      <Typography id={descriptionId} variant="caption">
        Forward the OAuth/OIDC access token of the logged-in user to the datasource. Users must be signed in through an
        OAuth or OIDC provider. When enabled, the authentication settings of the secret are ignored, but its TLS
        settings still apply.
      </Typography>
    </Stack>
  );
}
