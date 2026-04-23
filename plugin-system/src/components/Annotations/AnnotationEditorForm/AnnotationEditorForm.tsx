// Copyright 2026 The Perses Authors
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

import { DispatchWithoutAction, ReactElement, useCallback, useState } from 'react';
import { Box, Typography, TextField, Grid, Divider } from '@mui/material';
import { Action } from '@perses-dev/core';
import { AnnotationSpec } from '@perses-dev/spec';
import { DiscardChangesConfirmationDialog, ErrorAlert, ErrorBoundary, FormActions } from '@perses-dev/components';
import { Control, Controller, FormProvider, SubmitHandler, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { getSubmitText, getTitleAction } from '../../../utils';
import { PluginEditor } from '../../PluginEditor';
import { useValidationSchemas } from '../../../context';
import { AnnotationPreview } from './AnnotationPreview';

function FallbackPreview(): ReactElement {
  return <div>Error previewing annotations</div>;
}

interface KindAnnotationEditorFormProps {
  action: Action;
  control: Control<AnnotationSpec>;
  onRunQuery: () => void;
}

function AnnotationPluginControl({ action, control, onRunQuery }: KindAnnotationEditorFormProps): ReactElement {
  const plugin = useWatch<AnnotationSpec, 'plugin'>({ control, name: 'plugin' });
  const kind = plugin?.kind;
  const pluginSpec = plugin?.spec;

  return (
    <Controller
      control={control}
      name="plugin"
      render={({ field }) => {
        return (
          <PluginEditor
            withRunQueryButton
            width="100%"
            pluginTypes={['Annotation']}
            pluginKindLabel="Source"
            value={{
              selection: {
                type: 'Annotation',
                kind: kind ?? 'StaticListAnnotation',
              },
              spec: pluginSpec ?? {},
            }}
            isReadonly={action === 'read'}
            onChange={(v) => {
              field.onChange({ kind: v.selection.kind, spec: v.spec });
            }}
            onRunQuery={onRunQuery}
          />
        );
      }}
    />
  );
}

interface AnnotationEditorFormProps {
  initialAnnotationSpec: AnnotationSpec;
  action: Action;
  isDraft: boolean;
  isReadonly?: boolean;
  onActionChange?: (action: Action) => void;
  onSave: (def: AnnotationSpec) => void;
  onClose: () => void;
  onDelete?: DispatchWithoutAction;
}

export function AnnotationEditorForm({
  initialAnnotationSpec,
  action,
  isDraft,
  isReadonly,
  onActionChange,
  onSave,
  onClose,
  onDelete,
}: AnnotationEditorFormProps): ReactElement {
  const queryClient = useQueryClient();

  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState<boolean>(false);
  const titleAction = getTitleAction(action, isDraft);
  const submitText = getSubmitText(action, isDraft);

  const { annotationEditorSchema } = useValidationSchemas();
  const form = useForm<AnnotationSpec>({
    resolver: zodResolver(annotationEditorSchema),
    mode: 'onBlur',
    defaultValues: initialAnnotationSpec,
  });

  /* We use `previewDefinition` to explicitly update the spec
   * that will be used for preview when running query. The reason why we do this is to avoid
   * having to re-fetch the values when the user is still editing the spec.
   * Using structuredClone to not have reference issues with nested objects.
   */
  const [previewSpec, setPreviewSpec] = useState(structuredClone(form.getValues()));

  const handleRunQuery = useCallback(async () => {
    const values = form.getValues();
    if (JSON.stringify(previewSpec) === JSON.stringify(values)) {
      await queryClient.invalidateQueries({ queryKey: ['annotation', previewSpec] });
    } else {
      setPreviewSpec(structuredClone(values));
    }
  }, [form, previewSpec, queryClient]);

  const processForm: SubmitHandler<AnnotationSpec> = (data: AnnotationSpec) => {
    // reset display attributes to undefined when empty, because we don't want to save empty strings
    onSave(data);
  };

  // When user click on cancel, several possibilities:
  // - create action: ask for discard approval
  // - update action: ask for discard approval if changed
  // - read action: don´t ask for discard approval
  function handleCancel(): void {
    if (JSON.stringify(initialAnnotationSpec) !== JSON.stringify(form.getValues())) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  }

  return (
    <FormProvider {...form}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: (theme) => theme.spacing(1, 2),
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h2">{titleAction} Annotation</Typography>
        <FormActions
          action={action}
          submitText={submitText}
          isReadonly={isReadonly}
          isValid={form.formState.isValid}
          onActionChange={onActionChange}
          onSubmit={form.handleSubmit(processForm)}
          onDelete={onDelete}
          onCancel={handleCancel}
        />
      </Box>
      <Box padding={2} sx={{ overflowY: 'scroll' }}>
        <Grid container spacing={2} mb={2}>
          <Grid item xs={12}>
            <Controller
              control={form.control}
              name="display.name"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  required
                  fullWidth
                  label="Name"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    disabled: action === 'update' && !isDraft,
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                  }}
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            <Controller
              control={form.control}
              name="display.description"
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Description"
                  InputLabelProps={{ shrink: action === 'read' ? true : undefined }}
                  InputProps={{
                    readOnly: action === 'read',
                  }}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  value={field.value ?? ''}
                  onChange={(event) => {
                    field.onChange(event);
                  }}
                />
              )}
            />
          </Grid>
        </Grid>

        <Divider />

        <ErrorBoundary FallbackComponent={FallbackPreview} resetKeys={[previewSpec]}>
          <AnnotationPreview spec={previewSpec} sx={{ marginY: 2 }} />
        </ErrorBoundary>

        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <AnnotationPluginControl action={action} control={form.control} onRunQuery={handleRunQuery} />
        </ErrorBoundary>
      </Box>
      <DiscardChangesConfirmationDialog
        description="Are you sure you want to discard these changes? Changes cannot be recovered."
        isOpen={isDiscardDialogOpened}
        onCancel={() => {
          setDiscardDialogOpened(false);
        }}
        onDiscardChanges={() => {
          setDiscardDialogOpened(false);
          onClose();
        }}
      />
    </FormProvider>
  );
}
