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

import { ErrorAlert, JSONEditor } from '@perses-dev/components';
import { AnnotationSpec, PanelDefinition, QueryDefinition, UnknownSpec } from '@perses-dev/spec';
import { forwardRef, ReactElement } from 'react';
import { Control, Controller } from 'react-hook-form';

import { PanelEditorValues, PanelPlugin } from '../../model';
import { getPluginOverrides, useDataQueriesContext, usePlugin } from '../../runtime';
import { LayoutEditor, PanelGroup, VariableDefinitionGroup } from '../LayoutEditor';
import { LinksEditor } from '../LinksEditor';
import { MultiQueryEditor } from '../MultiQueryEditor';
import { OptionsEditorTabs, OptionsEditorTabsProps } from '../OptionsEditorTabs';
import { PluginEditorRef } from '../PluginEditor';
import { PanelAnnotationsEditor } from './PanelAnnotationsEditor';

export interface PanelSpecEditorProps {
  control: Control<PanelEditorValues>;
  panelDefinition: PanelDefinition;
  variableDefinitionGroups: VariableDefinitionGroup[];
  panelGroups?: PanelGroup[];
  onQueriesChange: (queries: QueryDefinition[]) => void;
  onQueryRun: (index: number, query: QueryDefinition) => void;
  onPluginSpecChange: (spec: UnknownSpec) => void;
  onAnnotationsChange: (annotations: AnnotationSpec[]) => void;
  onJSONChange: (panelDefinitionStr: string) => void;
}

export const PanelSpecEditor = forwardRef<PluginEditorRef, PanelSpecEditorProps>((props, ref): ReactElement | null => {
  const {
    control,
    panelDefinition,
    variableDefinitionGroups,
    panelGroups,
    onQueriesChange,
    onQueryRun,
    onPluginSpecChange,
    onAnnotationsChange,
    onJSONChange,
  } = props;
  const { kind } = panelDefinition.spec.plugin;
  const {
    data: plugin,
    isLoading,
    error,
  } = usePlugin('Panel', kind, undefined, getPluginOverrides(panelDefinition.spec.plugin));

  const { queryResults } = useDataQueriesContext();

  if (error) {
    return <ErrorAlert error={error} />;
  }

  if (isLoading) {
    return null;
  }

  if (!plugin) {
    throw new Error(`Missing implementation for panel plugin with kind '${kind}'`);
  }

  const { panelOptionsEditorComponents, hideQueryEditor, supportsAnnotations } = plugin as PanelPlugin;
  let tabs: OptionsEditorTabsProps['tabs'] = [];

  if (!hideQueryEditor) {
    tabs.push({
      label: 'Query',
      content: (
        <Controller
          control={control}
          name="panelDefinition.spec.queries"
          render={({ field }) => (
            <MultiQueryEditor
              ref={ref}
              queryTypes={plugin.supportedQueryTypes ?? []}
              queries={panelDefinition.spec.queries ?? []}
              queryResults={queryResults}
              onChange={(queries) => {
                field.onChange(queries);
                onQueriesChange(queries);
              }}
              onQueryRun={(index, query) => {
                onQueryRun(index, query);
                // If spec has not changed, refetch to update the data
                if (JSON.stringify(panelDefinition.spec.queries?.[index]) === JSON.stringify(query)) {
                  queryResults[index]?.refetch?.();
                }
              }}
            />
          )}
        />
      ),
    });
  }

  if (panelOptionsEditorComponents) {
    tabs = tabs.concat(
      panelOptionsEditorComponents.map(({ label, content: OptionsEditorComponent }) => ({
        label,
        content: (
          <Controller
            control={control}
            name="panelDefinition.spec.plugin.spec"
            render={({ field }) => (
              <OptionsEditorComponent
                value={panelDefinition.spec.plugin.spec}
                onChange={(spec) => {
                  field.onChange(spec);
                  onPluginSpecChange(spec);
                }}
              />
            )}
          />
        ),
      })),
    );
  }

  // annotations are common to all panel plugins, but only shown for plugins that render them
  if (supportsAnnotations) {
    tabs.push({
      label: 'Annotations',
      content: (
        <Controller
          control={control}
          name="panelDefinition.spec.annotations"
          render={({ field }) => (
            <PanelAnnotationsEditor
              value={panelDefinition.spec.annotations ?? []}
              onChange={(annotations) => {
                field.onChange(annotations);
                onAnnotationsChange(annotations);
              }}
            />
          )}
        />
      ),
    });
  }

  // Always show the JSON editor, Links editor, and Layout editor by default.
  tabs.push({
    label: 'Links',
    content: <LinksEditor control={control} />,
  });
  tabs.push({
    label: 'JSON',
    content: (
      <Controller
        control={control}
        name="panelDefinition"
        render={({ field }) => (
          <JSONEditor
            maxHeight="80vh"
            value={panelDefinition}
            onChange={(json) => {
              field.onChange(JSON.parse(json));
              onJSONChange(json);
            }}
          />
        )}
      />
    ),
  });
  tabs.push({
    label: 'Layout',
    content: (
      <LayoutEditor control={control} variableDefinitionGroups={variableDefinitionGroups} panelGroups={panelGroups} />
    ),
  });

  return <OptionsEditorTabs key={tabs.length} tabs={tabs} />;
});

PanelSpecEditor.displayName = 'PanelSpecEditor';
