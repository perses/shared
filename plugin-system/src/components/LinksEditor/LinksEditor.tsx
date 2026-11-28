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

import {
  Checkbox,
  Divider,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { LinkEditorForm } from '@perses-dev/components';
import type { Link, TagLink, URLLink } from '@perses-dev/spec';
import MinusIcon from 'mdi-material-ui/Minus';
import PlusIcon from 'mdi-material-ui/Plus';
import type { HTMLAttributes, ReactElement } from 'react';
import { Fragment, useState } from 'react';
import type { Control } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';

import type { PanelEditorValues } from '../../model';

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

const EMPTY_URL_LINK: URLLink = { url: '', name: '', tooltip: '', renderVariables: false, targetBlank: false };

function isTagLink(link: Link): link is TagLink {
  return 'tags' in link && Array.isArray(link.tags);
}

function LinkControl({ control, index }: { control: Control<PanelEditorValues>; index: number }): ReactElement {
  return (
    <Controller
      control={control}
      name={`panelDefinition.spec.links.${index}`}
      render={({ field, field: { value }, fieldState }) => {
        const link = value ?? EMPTY_URL_LINK;
        const update = (next: Link): void => {
          field.onChange(next);
        };
        return (
          <Stack gap={1} flexGrow={1}>
            <FormControl fullWidth>
              <InputLabel id={`panel-link-kind-${index}`}>Kind</InputLabel>
              <Select
                labelId={`panel-link-kind-${index}`}
                label="Kind"
                value={isTagLink(link) ? 'tags' : 'url'}
                onChange={(event) => {
                  if (event.target.value === 'tags') {
                    update(toTagLink(link));
                    return;
                  }
                  update(toURLLink(link));
                }}
              >
                <MenuItem value="url">URL</MenuItem>
                <MenuItem value="tags">Dashboards by tag</MenuItem>
              </Select>
            </FormControl>
            {isTagLink(link) ? (
              <TagLinkFields link={link} onBlur={field.onBlur} onChange={update} />
            ) : (
              <URLLinkFields
                link={link}
                errorMessage={fieldState.error?.message}
                onBlur={field.onBlur}
                onChange={update}
              />
            )}
          </Stack>
        );
      }}
    />
  );
}

function toTagLink(link: Link): TagLink {
  return {
    name: link.name ?? '',
    tags: isTagLink(link) ? link.tags : [],
    tooltip: link.tooltip,
    targetBlank: link.targetBlank,
    keepTime: link.keepTime,
    includeVariables: link.includeVariables,
  };
}

function toURLLink(link: Link): URLLink {
  return {
    url: isTagLink(link) ? '' : link.url,
    name: link.name,
    tooltip: link.tooltip,
    renderVariables: isTagLink(link) ? false : link.renderVariables,
    targetBlank: link.targetBlank,
    keepTime: link.keepTime,
    includeVariables: link.includeVariables,
  };
}

function URLLinkFields({
  link,
  errorMessage,
  onBlur,
  onChange,
}: {
  link: URLLink;
  errorMessage?: string;
  onBlur: () => void;
  onChange: (link: URLLink) => void;
}): ReactElement {
  return (
    <>
      <LinkEditorForm
        mode="inline"
        url={{
          onBlur,
          value: link.url,
          label: 'URL',
          error: { hasError: errorMessage !== undefined, helperText: errorMessage },
          onChange: (url) => {
            onChange({ ...link, url });
          },
        }}
        newTabOpen={{
          onBlur,
          value: !!link.targetBlank,
          onChange: (targetBlank) => {
            onChange({ ...link, targetBlank });
          },
          label: 'Open in new tab',
        }}
        name={{
          onBlur,
          value: link.name ?? '',
          label: 'Name',
          onChange: (name) => {
            onChange({ ...link, name });
          },
        }}
        renderVariables={{
          onBlur,
          value: !!link.renderVariables,
          label: 'Render variables',
          onChange: (renderVariables) => {
            onChange({ ...link, renderVariables });
          },
        }}
        tooltip={{
          onBlur,
          value: link.tooltip ?? '',
          label: 'Tooltip',
          onChange: (tooltip) => {
            onChange({ ...link, tooltip });
          },
        }}
      />
      <LinkStateFields link={link} onChange={onChange} />
    </>
  );
}

function TagLinkFields({
  link,
  onBlur,
  onChange,
}: {
  link: TagLink;
  onBlur: () => void;
  onChange: (link: TagLink) => void;
}): ReactElement {
  const [tagsText, setTagsText] = useState(link.tags.join(', '));
  return (
    <Stack gap={1}>
      <TextField
        label="Name"
        value={link.name}
        onBlur={onBlur}
        onChange={(event) => onChange({ ...link, name: event.target.value })}
      />
      <TextField
        label="Tags"
        required
        value={tagsText}
        onBlur={onBlur}
        helperText="Comma-separated. A dashboard must have every tag."
        onChange={(event) => {
          const text = event.target.value;
          setTagsText(text);
          onChange({
            ...link,
            tags: text
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0),
          });
        }}
      />
      <TextField
        label="Tooltip"
        value={link.tooltip ?? ''}
        onBlur={onBlur}
        onChange={(event) => onChange({ ...link, tooltip: event.target.value })}
      />
      <FormControlLabel
        label="Open in new tab"
        control={
          <Checkbox
            checked={link.targetBlank === true}
            onChange={(event) => onChange({ ...link, targetBlank: event.target.checked })}
          />
        }
      />
      <LinkStateFields link={link} onChange={onChange} />
    </Stack>
  );
}

function LinkStateFields<T extends Link>({ link, onChange }: { link: T; onChange: (link: T) => void }): ReactElement {
  return (
    <Stack direction="row" gap={1}>
      <FormControlLabel
        label="Keep current time range"
        control={
          <Checkbox
            checked={link.keepTime === true}
            onChange={(event) => onChange({ ...link, keepTime: event.target.checked })}
          />
        }
      />
      <FormControlLabel
        label="Include current variables"
        control={
          <Checkbox
            checked={link.includeVariables === true}
            onChange={(event) => onChange({ ...link, includeVariables: event.target.checked })}
          />
        }
      />
    </Stack>
  );
}
