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

import type { BoxProps } from '@mui/material';
import type { DatasourceSpec, PluginDefinitionMetadata, UnknownSpec } from '@perses-dev/spec';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { useRef, useEffect } from 'react';

import type { PanelPlugin, PluginType, PluginImplementation } from '../../model';
import { usePluginRegistry } from '../../runtime';
import { useEvent } from '../../utils';
import type { PluginKindSelectProps } from '../PluginKindSelect';
import type { PluginSpecEditorProps } from '../PluginSpecEditor';

export interface PluginEditorSelection {
  type: PluginType;
  kind: string;
  /**
   * Optional plugin definition metadata (version and/or registry), matching the `metadata` field of a spec
   * `Definition`. Only set when the user explicitly picks a specific version/registry of a plugin that has several of
   * them available. When omitted, the latest available version is used.
   */
  metadata?: PluginDefinitionMetadata;
}

export interface PluginEditorValue {
  selection: PluginEditorSelection;
  spec: UnknownSpec;
}

// Props on MUI Box that we don't want people to pass because we're either redefining them or providing them in
// this component
type OmittedMuiProps = 'children' | 'value' | 'onChange';

export interface PluginEditorProps extends Omit<BoxProps, OmittedMuiProps> {
  pluginTypes: PluginType[];
  pluginKindLabel: string;
  value: PluginEditorValue;
  isReadonly?: boolean;
  withRunQueryButton?: boolean;
  filteredQueryPlugins?: string[];
  onChange: (next: PluginEditorValue) => void;
  onRunQuery?: () => void;
  testConnection?: (spec: DatasourceSpec, healthCheckPath: string) => Promise<void>;
}

export interface PluginEditorRef {
  flushChanges?: () => void;
}

type PreviousSpecState = Record<string, Record<string, UnknownSpec>>;
type HideQueryEditorState = Record<string, boolean>;

/**
 * Props needed by the usePluginEditor hook.
 */
export type UsePluginEditorProps = Pick<PluginEditorProps, 'pluginTypes' | 'value' | 'onChange'> & {
  onHideQueryEditorChange?: (isHidden: boolean) => void;
};

/**
 * Returns the state/handlers that power the `PluginEditor` component. Useful for custom components that want to provide
 * a different UI, but want the same behavior of changing `kind` and `spec` together on plugin kind changes. Also
 * remembers previous `spec` values that it's seen, allowing and restores those values if a user switches the plugin
 * kind back.
 */
export function usePluginEditor(props: UsePluginEditorProps): {
  pendingSelection?: PluginEditorSelection;
  isLoading: boolean;
  error: Error | null;
  onSelectionChange: (s: PluginEditorSelection) => void;
  onSpecChange: (next: UnknownSpec) => void;
  rememberCurrentSpecState: () => void;
} {
  const { pluginTypes, value, onHideQueryEditorChange = (): void => {} } = props; // setting onHideQueryEditorChange to empty function here because useEvent requires a function

  // Keep a stable reference, so we don't run the effect below when we don't need to
  const onChange = useEvent(props.onChange);
  const onHideQuery = useEvent(onHideQueryEditorChange);

  // The previous spec state for PluginType and kind and a helper function for remembering current values
  const prevSpecState = useRef<PreviousSpecState>({
    [value.selection.type]: { [value.selection.kind]: value.spec },
  });
  const rememberCurrentSpecState = useEvent(() => {
    let byPluginType = prevSpecState.current[value.selection.type];
    if (byPluginType === undefined) {
      byPluginType = {};
      prevSpecState.current[value.selection.type] = byPluginType;
    }
    byPluginType[value.selection.kind] = value.spec;
  });

  // The previous hide query state for each panel kind
  const hideQueryState = useRef<HideQueryEditorState>({
    [value.selection.kind]: false,
  });

  const { defaultPluginKinds, getPlugin } = usePluginRegistry();
  const queryClient = useQueryClient();
  const currentRequest = useRef<PluginEditorSelection | undefined>(undefined);
  const selectionLoad = useMutation<PluginImplementation<PluginType>, Error, PluginEditorSelection>({
    mutationFn: (selection) =>
      queryClient.fetchQuery({
        queryKey: [
          'getPlugin',
          selection.type,
          selection.kind,
          selection.metadata?.version ?? '',
          selection.metadata?.registry ?? '',
        ],
        queryFn: () =>
          getPlugin({
            kind: selection.type,
            name: selection.kind,
            version: selection.metadata?.version,
            registry: selection.metadata?.registry,
          }),
      }),
  });
  const pendingSelection = selectionLoad.isSuccess ? undefined : selectionLoad.variables;
  const defaultPluginType = pluginTypes[0];
  const defaultPluginKind = defaultPluginType ? defaultPluginKinds?.[defaultPluginType] : undefined;

  // Notify the owner instead of mutating the selection passed by the caller.
  useEffect(() => {
    if (value.selection.kind === '' && defaultPluginKind) {
      onChange({ ...value, selection: { ...value.selection, kind: defaultPluginKind } });
    }
  }, [value, defaultPluginKind, onChange]);

  // Apply each completed load once, independently of how the owner stores the selection metadata.
  const applyLoadedSelection = useEvent(
    (plugin: PluginImplementation<PluginType> | undefined, selection: PluginEditorSelection) => {
      // v4 `reset()` still observes the in-flight load, which then reports the current (empty or newer) result.
      if (!plugin || selection !== currentRequest.current) return;
      currentRequest.current = undefined;
      rememberCurrentSpecState();
      onChange({
        selection,
        spec: plugin.createInitialOptions ? plugin.createInitialOptions() : {},
      });

      if (selection.type === 'Panel') {
        const panelPlugin = plugin as PanelPlugin;
        hideQueryState.current[selection.kind] = !!panelPlugin.hideQueryEditor;
        if (!!panelPlugin.hideQueryEditor !== hideQueryState.current[value.selection.kind]) {
          onHideQuery(!!panelPlugin.hideQueryEditor);
        }
      }
    },
  );

  /**
   * When the user tries to change the plugin kind, make sure we have the correct spec for that plugin kind before we
   * make the switch.
   */
  const onSelectionChange: PluginKindSelectProps['onChange'] = (nextSelection) => {
    // If we already have state for this plugin type/kind from a previous selection, just use it
    const previousState = prevSpecState.current[nextSelection.type]?.[nextSelection.kind];
    if (previousState !== undefined) {
      currentRequest.current = undefined;
      selectionLoad.reset();
      rememberCurrentSpecState();
      onChange({
        selection: nextSelection,
        spec: previousState,
      });
    } else {
      // Otherwise, kick off the async loading process
      // Per-call callbacks run only for the latest mutation while the editor is mounted.
      currentRequest.current = nextSelection;
      selectionLoad.mutate(nextSelection, { onSuccess: applyLoadedSelection });
    }

    if (
      nextSelection.type === 'Panel' &&
      hideQueryState.current[nextSelection.kind] !== undefined &&
      hideQueryState.current[value.selection.kind] !== hideQueryState.current[nextSelection.kind]
    ) {
      onHideQuery(!!hideQueryState.current[nextSelection.kind]);
    }
  };

  /**
   * Spec changes are independent and always just set the spec state.
   */
  const onSpecChange: PluginSpecEditorProps['onChange'] = (next) => {
    onChange(
      produce(value, (draft) => {
        draft.spec = next;
      }),
    );
  };

  return {
    pendingSelection,
    isLoading: selectionLoad.isLoading,
    error: selectionLoad.error,
    onSelectionChange,
    onSpecChange,
    rememberCurrentSpecState,
  };
}
