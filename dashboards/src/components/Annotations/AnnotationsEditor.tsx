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

import { useState, useMemo, ReactElement } from 'react';
import {
  Button,
  Stack,
  Box,
  TableContainer,
  TableBody,
  TableRow,
  TableCell as MuiTableCell,
  Table,
  TableHead,
  Switch,
  Typography,
  IconButton,
  Alert,
  styled,
} from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import { Action } from '@perses-dev/core';
import { AnnotationDefinition, Definition, UnknownSpec } from '@perses-dev/spec';
import { useImmer } from 'use-immer';
import PencilIcon from 'mdi-material-ui/Pencil';
import TrashIcon from 'mdi-material-ui/TrashCan';
import ArrowUp from 'mdi-material-ui/ArrowUp';
import ArrowDown from 'mdi-material-ui/ArrowDown';

import { ValidationProvider, AnnotationEditorForm } from '@perses-dev/plugin-system';
import { useDiscardChangesConfirmationDialog } from '../../context';

function getValidation(annotationDefinitions: AnnotationDefinition[]): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  /**  Annotation names must be unique */
  const annotationNames = annotationDefinitions.map((annotationDefinition) => annotationDefinition.spec.display.name);
  const uniqueAnnotationNames = new Set(annotationNames);
  if (annotationNames.length !== uniqueAnnotationNames.size) {
    errors.push('Annotation names must be unique');
  }
  return {
    errors: errors,
    isValid: errors.length === 0,
  };
}

export function AnnotationEditor(props: {
  annotationDefinitions: AnnotationDefinition[];
  onChange: (annotationDefinitions: AnnotationDefinition[]) => void;
  onCancel: () => void;
}): ReactElement {
  const [annotationDefinitions, setAnnotationDefinitions] = useImmer(props.annotationDefinitions);
  const [annotationEditIdx, setAnnotationEditIdx] = useState<number | null>(null);
  const [annotationFormAction, setAnnotationFormAction] = useState<Action>('update');

  const validation = useMemo(() => getValidation(annotationDefinitions), [annotationDefinitions]);
  const currentEditingAnnotationDefinition: AnnotationDefinition | undefined = annotationEditIdx
    ? annotationDefinitions[annotationEditIdx]
    : undefined;

  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();
  const handleCancel = (): void => {
    if (JSON.stringify(props.annotationDefinitions) !== JSON.stringify(annotationDefinitions)) {
      openDiscardChangesConfirmationDialog({
        onDiscardChanges: () => {
          closeDiscardChangesConfirmationDialog();
          props.onCancel();
        },
        onCancel: () => {
          closeDiscardChangesConfirmationDialog();
        },
        description:
          'You have unapplied changes. Are you sure you want to discard these changes? Changes cannot be recovered.',
      });
    } else {
      props.onCancel();
    }
  };

  const removeAnnotation = (index: number): void => {
    setAnnotationDefinitions((draft) => {
      draft.splice(index, 1);
    });
  };

  const addAnnotation = (): void => {
    setAnnotationFormAction('create');
    setAnnotationDefinitions((draft) => {
      draft.push({
        kind: 'Annotation',
        spec: {
          display: { name: 'NewAnnotation' },
          plugin: {} as Definition<UnknownSpec>,
        },
      });
    });
    setAnnotationEditIdx(annotationDefinitions.length);
  };

  const editAnnotation = (index: number): void => {
    setAnnotationFormAction('update');
    setAnnotationEditIdx(index);
  };

  const toggleAnnotationVisibility = (index: number, visible: boolean): void => {
    setAnnotationDefinitions((draft) => {
      const v = draft[index];
      if (!v) {
        return;
      }
      v.spec.display.hidden = !visible;
    });
  };

  const changeAnnotationOrder = (index: number, direction: 'up' | 'down'): void => {
    setAnnotationDefinitions((draft) => {
      if (direction === 'up') {
        const prevElement = draft[index - 1];
        const currentElement = draft[index];
        if (index === 0 || !prevElement || !currentElement) {
          return;
        }
        draft[index - 1] = currentElement;
        draft[index] = prevElement;
      } else {
        const nextElement = draft[index + 1];
        const currentElement = draft[index];
        if (index === draft.length - 1 || !nextElement || !currentElement) {
          return;
        }
        draft[index + 1] = currentElement;
        draft[index] = nextElement;
      }
    });
  };

  return (
    <>
      {annotationEditIdx && currentEditingAnnotationDefinition ? (
        <ValidationProvider>
          <AnnotationEditorForm
            initialAnnotationDefinition={currentEditingAnnotationDefinition}
            action={annotationFormAction}
            isDraft={true}
            onActionChange={setAnnotationFormAction}
            onSave={(definition: AnnotationDefinition) => {
              setAnnotationDefinitions((draft) => {
                draft[annotationEditIdx] = definition;
                setAnnotationEditIdx(null);
              });
            }}
            onClose={() => {
              if (annotationFormAction === 'create') {
                removeAnnotation(annotationEditIdx);
              }
              setAnnotationEditIdx(null);
            }}
          />
        </ValidationProvider>
      ) : (
        <>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: (theme) => theme.spacing(1, 2),
              borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h2">Edit Dashboard Annotations</Typography>
            <Stack direction="row" spacing={1} marginLeft="auto">
              <Button
                disabled={props.annotationDefinitions === annotationDefinitions || !validation.isValid}
                variant="contained"
                onClick={() => {
                  props.onChange(annotationDefinitions);
                }}
              >
                Apply
              </Button>
              <Button color="secondary" variant="outlined" onClick={handleCancel}>
                Cancel
              </Button>
            </Stack>
          </Box>
          <Box padding={2} sx={{ overflowY: 'scroll' }}>
            <Stack spacing={2}>
              <Stack spacing={2}>
                {!validation.isValid &&
                  validation.errors.map((error) => (
                    <Alert severity="error" key={error}>
                      {error}
                    </Alert>
                  ))}
                <TableContainer>
                  <Table sx={{ minWidth: 650 }} aria-label="table of annotations">
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
                      {annotationDefinitions.map((v, idx) => (
                        <TableRow key={v.spec.display.name}>
                          <TableCell component="th" scope="row">
                            <Switch
                              checked={v.spec.display?.hidden !== true}
                              onChange={(e) => {
                                toggleAnnotationVisibility(idx, e.target.checked);
                              }}
                            />
                          </TableCell>
                          <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                            {v.spec.display.name}
                          </TableCell>
                          <TableCell>{v.kind}</TableCell>
                          <TableCell>{v.spec.display?.description ?? ''}</TableCell>
                          <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                            <IconButton onClick={() => changeAnnotationOrder(idx, 'up')} disabled={idx === 0}>
                              <ArrowUp />
                            </IconButton>
                            <IconButton
                              onClick={() => changeAnnotationOrder(idx, 'down')}
                              disabled={idx === annotationDefinitions.length - 1}
                            >
                              <ArrowDown />
                            </IconButton>
                            <IconButton onClick={() => editAnnotation(idx)}>
                              <PencilIcon />
                            </IconButton>
                            <IconButton onClick={() => removeAnnotation(idx)}>
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
                    onClick={addAnnotation}
                  >
                    Add Annotation
                  </Button>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </>
      )}
    </>
  );
}

const TableCell = styled(MuiTableCell)(({ theme }) => ({
  borderBottom: `solid 1px ${theme.palette.divider}`,
}));
