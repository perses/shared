// Copyright 2024 The Perses Authors
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

import { Fragment, HTMLAttributes, ReactElement } from 'react';
import { Divider, IconButton, Stack, Typography } from '@mui/material';
import { Controller, useFieldArray, Control } from 'react-hook-form';
import PlusIcon from 'mdi-material-ui/Plus';
import MinusIcon from 'mdi-material-ui/Minus';
import { PanelEditorValues } from '@perses-dev/core';
import { LinkEditorForm } from './LinkEditorForm';

export interface LinksEditorProps extends HTMLAttributes<HTMLDivElement> {
  control: Control<PanelEditorValues>;
}

export function LinksEditor({ control, ...props }: LinksEditorProps): ReactElement {
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: 'panelDefinition.spec.links',
  });

  return (
    <Stack {...props} gap={3}>
      {fields && fields.length > 0 ? (
        fields.map((field, index) => (
          <Fragment key={field.id}>
            <Stack direction="row" gap={1} alignItems="center">
              <LinkControl control={control} index={index} />
              <IconButton style={{ width: 'fit-content', height: 'fit-content' }} onClick={() => remove(index)}>
                <MinusIcon />
              </IconButton>
            </Stack>
            <Divider />
          </Fragment>
        ))
      ) : (
        <Typography variant="subtitle1" mb={2} fontStyle="italic">
          No links defined
        </Typography>
      )}
      <IconButton
        style={{ width: 'fit-content', height: 'fit-content' }}
        onClick={() => append({ url: '', name: '', tooltip: '', renderVariables: false, targetBlank: false })}
      >
        <PlusIcon />
      </IconButton>
    </Stack>
  );
}

function LinkControl({ control, index }: { control: Control<PanelEditorValues>; index: number }): ReactElement {
  const defaultLink = { url: '', name: '', tooltip: '', renderVariables: false, targetBlank: false };
  return (
    <Controller
      control={control}
      name={`panelDefinition.spec.links.${index}`}
      render={({ field, field: { value: link }, fieldState }) => {
        const safeLink = link ?? defaultLink;
        return (
          <LinkEditorForm
            mode="inline"
            url={{
              value: safeLink.url,
              label: 'URL',
              error: { hasError: !!fieldState.error, helperText: fieldState.error?.message },
              onChange: (url) => {
                field.onChange({ ...link, url });
              },
            }}
            newTabOpen={{
              value: !!safeLink.targetBlank,
              onChange: (targetBlank) => {
                field.onChange({ ...link, targetBlank });
              },
              label: 'Open in new tab',
            }}
            name={{
              value: safeLink.name ?? '',
              label: 'Name',
              onChange: (name) => {
                field.onChange({ ...link, name });
              },
            }}
            renderVariables={{
              value: !!safeLink.renderVariables,
              label: 'Render variables',
              onChange: (renderVariables) => {
                field.onChange({ ...link, renderVariables });
              },
            }}
            tooltip={{
              value: safeLink.tooltip ?? '',
              label: 'Tooltip',
              onChange: (tooltip) => {
                field.onChange({ ...link, tooltip });
              },
            }}
          />
        );
      }}
    />
  );
}
