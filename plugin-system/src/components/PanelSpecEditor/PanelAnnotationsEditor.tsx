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
import {
  Alert,
  Box,
  Button,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell as MuiTableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
} from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import PencilIcon from 'mdi-material-ui/Pencil';
import TrashIcon from 'mdi-material-ui/TrashCan';
import ArrowUp from 'mdi-material-ui/ArrowUp';
import ArrowDown from 'mdi-material-ui/ArrowDown';
import { AnnotationSpec, Definition, UnknownSpec } from '@perses-dev/spec';
import { Action } from '@perses-dev/client';
import { ValidationProvider } from '../../context';
import { AnnotationEditorForm } from '../Annotations';

const TableCell = styled(MuiTableCell)(({ theme }) => ({
  borderBottom: `solid 1px ${theme.palette.divider}`,
}));

// The annotation being edited: an existing entry by index, a brand new one, or nothing (list view).
type EditTarget = { kind: 'edit'; index: number } | { kind: 'new' } | null;

function findDuplicateNames(specs: AnnotationSpec[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();
  for (const spec of specs) {
    const name = spec.display.name;
    if (seen.has(name)) {
      duplicates.add(name);
    }
    seen.add(name);
  }
  return Array.from(duplicates);
}

export interface PanelAnnotationsEditorProps {
  value: AnnotationSpec[];
  onChange: (annotations: AnnotationSpec[]) => void;
  isReadonly?: boolean;
}

/**
 * Panel-level annotations editor, rendered as a common tab in the panel editor for panel plugins
 * that declare `supportsAnnotations`. Reuses {@link AnnotationEditorForm} for the per-annotation form
 * and propagates every committed change through `onChange`, so it fits the inline panel-editor flow
 * (no separate apply step).
 */
export function PanelAnnotationsEditor({ value, onChange, isReadonly }: PanelAnnotationsEditorProps): ReactElement {
  const [target, setTarget] = useState<EditTarget>(null);
  const [formAction, setFormAction] = useState<Action>('update');

  const duplicateNames = useMemo(() => findDuplicateNames(value), [value]);

  const initialSpec: AnnotationSpec | undefined = useMemo(() => {
    if (target?.kind === 'new') {
      return { display: { name: 'NewAnnotation' }, plugin: {} as Definition<UnknownSpec> };
    }
    if (target?.kind === 'edit') {
      return value[target.index];
    }
    return undefined;
  }, [target, value]);

  const removeAnnotation = (index: number): void => {
    onChange(value.filter((_, i) => i !== index));
  };

  const changeAnnotationOrder = (index: number, direction: 'up' | 'down'): void => {
    const step = direction === 'up' ? -1 : 1;
    const swapWith = index + step;
    const current = value[index];
    const adjacent = value[swapWith];
    if (!current || !adjacent) {
      return;
    }
    const next = [...value];
    next[index] = adjacent;
    next[swapWith] = current;
    onChange(next);
  };

  const toggleAnnotationVisibility = (index: number, visible: boolean): void => {
    onChange(
      value.map((spec, i) => (i === index ? { ...spec, display: { ...spec.display, hidden: !visible } } : spec))
    );
  };

  const handleSave = (definition: AnnotationSpec): void => {
    if (target?.kind === 'new') {
      onChange([...value, definition]);
    } else if (target?.kind === 'edit') {
      onChange(value.map((spec, i) => (i === target.index ? definition : spec)));
    }
    setTarget(null);
  };

  if (target !== null && initialSpec) {
    return (
      <ValidationProvider>
        <AnnotationEditorForm
          initialAnnotationSpec={initialSpec}
          action={formAction}
          isDraft={true}
          isReadonly={isReadonly}
          onActionChange={setFormAction}
          onSave={handleSave}
          onClose={() => setTarget(null)}
        />
      </ValidationProvider>
    );
  }

  return (
    <Stack spacing={2} padding={1}>
      {duplicateNames.map((name) => (
        <Alert severity="error" key={name}>
          {`Duplicate annotation name: ${name}`}
        </Alert>
      ))}
      <TableContainer>
        <Table aria-label="table of panel annotations">
          <TableHead>
            <TableRow>
              <TableCell>Visibility</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {value.map((annotation, index) => (
              <TableRow key={`${annotation.display.name}-${index}`}>
                <TableCell component="th" scope="row">
                  <Switch
                    checked={annotation.display?.hidden !== true}
                    disabled={isReadonly}
                    onChange={(e) => toggleAnnotationVisibility(index, e.target.checked)}
                  />
                </TableCell>
                <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                  {annotation.display.name}
                </TableCell>
                <TableCell>{annotation.plugin.kind}</TableCell>
                <TableCell>{annotation.display?.description ?? ''}</TableCell>
                <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                  <IconButton onClick={() => changeAnnotationOrder(index, 'up')} disabled={isReadonly || index === 0}>
                    <ArrowUp />
                  </IconButton>
                  <IconButton
                    onClick={() => changeAnnotationOrder(index, 'down')}
                    disabled={isReadonly || index === value.length - 1}
                  >
                    <ArrowDown />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      setFormAction('update');
                      setTarget({ kind: 'edit', index });
                    }}
                  >
                    <PencilIcon />
                  </IconButton>
                  <IconButton disabled={isReadonly} onClick={() => removeAnnotation(index)}>
                    <TrashIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Box display="flex">
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{ marginLeft: 'auto' }}
          disabled={isReadonly}
          onClick={() => {
            setFormAction('create');
            setTarget({ kind: 'new' });
          }}
        >
          Add Annotation
        </Button>
      </Box>
    </Stack>
  );
}
