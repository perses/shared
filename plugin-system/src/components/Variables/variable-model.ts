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

import { ListVariableDefinition, VariableDefinition, VariableValue } from '@perses-dev/spec';
import { useQueries, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { GetVariableOptionsContext, VariableOption, VariablePlugin } from '../../model';
import {
  useAllVariableValues,
  useDatasourceStore,
  usePlugin,
  usePlugins,
  useTimeRange,
  VariableStateMap,
} from '../../runtime';

export function filterVariableList(data: VariableOption[], capturedRegexp: RegExp): VariableOption[] {
  const result: VariableOption[] = [];
  const filteredSet = new Set<string>();
  for (const variableValue of data) {
    const matches = variableValue.value.matchAll(capturedRegexp);
    let concat = '';
    for (const match of matches) {
      for (let i = 1; i < match.length; i++) {
        const m = match[i];
        if (m !== undefined) {
          concat = `${concat}${m}`;
        }
      }
    }
    if (concat !== '' && !filteredSet.has(concat)) {
      // like that we are avoiding to have duplicating variable value
      filteredSet.add(concat);
      result.push({ label: variableValue.label, value: concat });
    }
  }
  return result;
}

function useVariablePluginContext(): GetVariableOptionsContext {
  const datasourceStore = useDatasourceStore();
  const allVariables = useAllVariableValues();
  const { absoluteTimeRange: timeRange } = useTimeRange();

  return { timeRange, datasourceStore, variables: allVariables };
}

const getVariableQueryConfig = (
  definition: ListVariableDefinition,
  variablePluginCtx: GetVariableOptionsContext,
  variablePlugin: VariablePlugin | undefined,
  enabled: boolean,
  onFetched?: (name: string, options: VariableOption[], definition: ListVariableDefinition) => void
): UseQueryOptions<VariableOption[]> => {
  const capturingRegexp =
    definition.spec.capturingRegexp !== undefined ? new RegExp(definition.spec.capturingRegexp, 'g') : undefined;
  const variablesValueKey = getVariableValuesKey(variablePluginCtx.variables);
  return {
    queryKey: ['variable', definition, variablePluginCtx.timeRange, variablesValueKey],
    queryFn: async ({ signal }): Promise<VariableOption[]> => {
      const resp = await variablePlugin?.getVariableOptions(definition.spec.plugin.spec, variablePluginCtx, signal);
      if (!resp?.data?.length) {
        onFetched?.(definition.spec.name, [], definition);
        return [];
      }
      const options = capturingRegexp ? filterVariableList(resp.data, capturingRegexp) : resp.data;
      onFetched?.(definition.spec.name, options, definition);
      return options;
    },
    enabled,
  };
};

function resolveDependsOnVariables(
  variablePlugin: VariablePlugin | undefined,
  variablePluginCtx: GetVariableOptionsContext,
  definition: ListVariableDefinition
): string[] {
  let dependsOnVariables: string[] = Object.keys(variablePluginCtx.variables); // Default to all variables
  if (variablePlugin?.dependsOn) {
    const dependencies = variablePlugin.dependsOn(definition.spec.plugin.spec, variablePluginCtx);
    dependsOnVariables = dependencies.variables ? dependencies.variables : dependsOnVariables;
  }
  // Exclude self variable to avoid circular dependency
  return dependsOnVariables.filter((v) => v !== definition.spec.name);
}

export function useListVariablePluginValues(definition: ListVariableDefinition): UseQueryResult<VariableOption[]> {
  const { data: variablePlugin } = usePlugin('Variable', definition.spec.plugin.kind);

  const variablePluginCtx = useVariablePluginContext();

  const dependsOnVariables = resolveDependsOnVariables(variablePlugin, variablePluginCtx, definition);

  const dependentVariables = useAllVariableValues(dependsOnVariables);
  const waitToLoad = dependsOnVariables.some((v) => dependentVariables[v]?.loading);

  const ctx = { ...variablePluginCtx, variables: dependentVariables };

  return useQuery(getVariableQueryConfig(definition, ctx, variablePlugin, !!variablePlugin && !waitToLoad));
}

function resolveDefaultValue(definition: ListVariableDefinition, options: VariableOption[]): VariableValue {
  const { defaultValue, allowMultiple } = definition.spec;
  if (defaultValue !== undefined && defaultValue !== null) {
    return defaultValue;
  }
  if (options.length > 0 && options[0]?.value) {
    const first = options[0].value;
    return allowMultiple ? [first] : first;
  }
  return allowMultiple ? [] : '';
}

/**
 * Resolves initial values for all ListVariable definitions by fetching their options in dependency order.
 * Returns a map of variable names to their resolved default values, merging with any already-provided outer variables.
 */
export function useResolveListVariableValues(variableDefinitions: VariableDefinition[]): {
  initialValues: Record<string, VariableValue>;
  isLoading: boolean;
} {
  const { timeRange, datasourceStore, variables: outerVariables } = useVariablePluginContext();

  const listVariables = useMemo(
    () =>
      variableDefinitions
        .filter((v): v is ListVariableDefinition => v.kind === 'ListVariable')
        // query only variables that are not already provided by outerVariables
        .filter((v) => outerVariables[v.spec.name] === undefined),
    [outerVariables, variableDefinitions]
  );

  const pluginResults = usePlugins(
    'Variable',
    listVariables.map((d) => ({ kind: d.spec.plugin.kind }))
  );

  // Resolved variable state, seeded with outer variables. Updated by onFetched when queries resolve.
  // Needed because of dependencies between variables that require multiple rounds of fetching.
  const [variables, setVariables] = useState<VariableStateMap>(outerVariables);

  const onFetched = useCallback((name: string, options: VariableOption[], definition: ListVariableDefinition) => {
    setVariables((prev) => ({
      ...prev,
      [name]: { value: resolveDefaultValue(definition, options), loading: false, options },
    }));
  }, []);

  const queryResults = useQueries({
    queries: listVariables.map((definition, index) => {
      const plugin = pluginResults[index]?.data;
      const isPluginLoading = pluginResults[index]?.isLoading ?? true;

      const dependsOn = resolveDependsOnVariables(plugin, { timeRange, datasourceStore, variables }, definition);

      const hasPendingDeps = dependsOn.some(
        (v) => (variables[v] === undefined && listVariables.some((lv) => lv.spec.name === v)) || variables[v]?.loading
      );

      const dependentVariables: VariableStateMap = {};
      for (const v of dependsOn) {
        const state = variables[v];
        if (state) {
          dependentVariables[v] = state;
        }
      }

      const ctx = { timeRange, datasourceStore, variables: dependentVariables };
      return getVariableQueryConfig(definition, ctx, plugin, !hasPendingDeps && !isPluginLoading, onFetched);
    }),
  });

  const initialValues: Record<string, VariableValue> = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(variables)
          .filter(([, state]) => state?.value !== undefined)
          .map(([name, state]) => [name, state!.value])
      ),
    [variables]
  );

  return { initialValues, isLoading: queryResults.some((r) => r.isLoading) };
}

/**
 * Returns a serialized string of the current state of variable values.
 */
export function getVariableValuesKey(v: VariableStateMap): string {
  return Object.values(v)
    .map((v) => JSON.stringify(v.value))
    .join(',');
}

export const VARIABLE_TYPES = [
  { label: 'List', kind: 'ListVariable' },
  { label: 'Text', kind: 'TextVariable' },
] as const;
