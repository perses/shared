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

import { MenuItem, Stack, StackProps, Typography } from '@mui/material';
import { Transform } from '@perses-dev/core';
import { ReactElement } from 'react';
import { TextField } from '../controls';
import { JoinByColumnValueTransformEditor } from './JoinByColumnValueTransformEditor';
import { MergeColumnsTransformEditor } from './MergeColumnsTransformEditor';
import { MergeIndexedColumnsTransformEditor } from './MergeIndexedColumnsTransformEditor';
import { MergeSeriesTransformEditor } from './MergeSeriesTransformEditor';

export interface TransformSpecEditorProps<Spec> {
  value: Spec;
  onChange: (transform: Spec) => void;
}

export interface TransformEditorProps extends Omit<StackProps, 'children' | 'value' | 'onChange'> {
  value: Transform;
  onChange: (transform: Transform) => void;
}

type TransformKindInfo = Record<Transform['kind'], { label: string; description: string }>;

export const TRANSFORMS_KINDS: TransformKindInfo = {
  JoinByColumnValue: {
    label: 'Join by column value',
    description: 'Regroup rows with equal cell value in a column',
  },
  MergeColumns: {
    label: 'Merge columns',
    description: 'Multiple columns are merged to one column',
  },
  MergeIndexedColumns: {
    label: 'Merge indexed columns',
    description: 'Indexed columns are merged to one column',
  },
  MergeSeries: {
    label: 'Merge series',
    description: 'Series will be merged by their labels',
  },
};

export function TransformEditor({ value, onChange, ...props }: TransformEditorProps): ReactElement {
  return (
    <Stack gap={2} sx={{ width: '100%' }} mt={1} {...props}>
      <TextField
        select
        label="Kind"
        value={value.kind}
        onChange={(kind) => onChange({ ...value, kind: kind as unknown as Transform['kind'] } as Transform)}
      >
        {Object.entries(TRANSFORMS_KINDS).map(([kind, info]) => (
          <MenuItem data-testid={`menu-item-${kind}`} key={kind} value={kind}>
            <Stack>
              <Typography>{info.label}</Typography>
              <Typography variant="caption">{info.description}</Typography>
            </Stack>
          </MenuItem>
        ))}
      </TextField>
      {value.kind === 'JoinByColumnValue' && <JoinByColumnValueTransformEditor value={value} onChange={onChange} />}
      {value.kind === 'MergeColumns' && <MergeColumnsTransformEditor value={value} onChange={onChange} />}
      {value.kind === 'MergeIndexedColumns' && <MergeIndexedColumnsTransformEditor value={value} onChange={onChange} />}
      {value.kind === 'MergeSeries' && <MergeSeriesTransformEditor value={value} onChange={onChange} />}
    </Stack>
  );
}
