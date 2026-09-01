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

import type { TextFieldProps } from '@mui/material';
import { MenuItem, TextField } from '@mui/material';
import type { PluginDefinitionMetadata } from '@perses-dev/spec';
import type { ReactElement } from 'react';
import { forwardRef, useCallback, useMemo } from 'react';

import type { PluginMetadataWithModule, PluginType } from '../../model';
import { useListPluginMetadata } from '../../runtime';
import { comparePluginVersions } from '../../utils';
import type { PluginEditorSelection } from '../PluginEditor';

export interface PluginKindSelectProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'children'> {
  filteredQueryPlugins?: string[];
  pluginTypes: PluginType[];
  value?: PluginEditorSelection;
  onChange?: (s: PluginEditorSelection) => void;
  /**
   * When true, a plugin that has more than one version available is listed once per version, labeled
   * `<display name> - <version>`. Selecting such an option sets `metadata.version` on the selection so it can be
   * persisted on the definition. A plugin with a single available version is listed without a version, so it keeps
   * resolving to the latest one. Defaults to false.
   */
  enableVersionSelection?: boolean;
  /**
   * When true, a plugin that is available in more than one registry is listed once per registry, labeled
   * `<display name> (<registry>)`. Selecting such an option sets `metadata.registry` on the selection. A plugin
   * available in a single registry is listed without it. Defaults to false.
   */
  enableRegistrySelection?: boolean;
}

/** A plugin kind grouped with all of the variants it is installed under. */
interface PluginKindGroup {
  type: PluginType;
  kind: string;
  displayName: string;
  /** Available variants, sorted from the newest version to the oldest. */
  variants: PluginDefinitionMetadata[];
  hasMultipleVersions: boolean;
  hasMultipleRegistries: boolean;
}

/** A selectable entry of the select input. */
interface PluginKindOption {
  selection: PluginEditorSelection;
  label: string;
  /** Stringified `selection`, used as the MUI Select option value. */
  value: string;
}

function getVariant(metadata: PluginMetadataWithModule): PluginDefinitionMetadata {
  return {
    version: metadata.metadata?.version ?? metadata.module?.version,
    registry: metadata.metadata?.registry ?? metadata.module?.registry,
  };
}

function getVariantKey(variant: PluginDefinitionMetadata): string {
  return `${variant.version ?? ''}:${variant.registry ?? ''}`;
}

/**
 * Build the selectable entries of a plugin kind. A version (resp. registry) is only part of the entries when the caller
 * enabled its selection *and* the plugin is actually installed in more than one version (resp. registry): there is
 * nothing to pick otherwise, and leaving it out keeps the definition floating on the latest version.
 */
function getGroupOptions(
  group: PluginKindGroup,
  enableVersionSelection: boolean,
  enableRegistrySelection: boolean,
): PluginKindOption[] {
  const showVersion = enableVersionSelection && group.hasMultipleVersions;
  const showRegistry = enableRegistrySelection && group.hasMultipleRegistries;

  if (!showVersion && !showRegistry) {
    const selection: PluginEditorSelection = { type: group.type, kind: group.kind };
    return [{ selection, label: group.displayName, value: selectionToOptionValue(selection) }];
  }

  const options: PluginKindOption[] = [];
  const seen = new Set<string>();
  for (const variant of group.variants) {
    const version = showVersion ? variant.version : undefined;
    const registry = showRegistry ? variant.registry : undefined;
    const metadata: PluginDefinitionMetadata = {
      ...(version ? { version } : {}),
      ...(registry ? { registry } : {}),
    };
    // Variants that only differ on a field we don't display collapse into a single entry.
    const key = getVariantKey({ version, registry });
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);

    const selection: PluginEditorSelection = {
      type: group.type,
      kind: group.kind,
      ...(version || registry ? { metadata } : {}),
    };
    const label = `${group.displayName}${version ? ` - ${version}` : ''}${registry ? ` (${registry})` : ''}`;
    options.push({ selection, label, value: selectionToOptionValue(selection) });
  }
  return options;
}

/**
 * Displays a MUI Select input for selecting a plugin's kind from a list of all the available plugins of some specific
 * plugin types. (e.g. "Show a list of all the Panel plugins", or "Show a list of all the Variable plugins", or "Show
 * a list of all the TimeSeriesQuery, TraceQuery, ProfileQuery, and LogQuery plugins").
 * The value of the select is the kind of the plugin, but you can also listen to the `onPluginTypeChange` event to know
 * when the user changes the plugin type (it fires at start for the default value.)
 */
export const PluginKindSelect = forwardRef((props: PluginKindSelectProps, ref): ReactElement => {
  const {
    pluginTypes,
    value: propValue,
    onChange,
    filteredQueryPlugins,
    enableVersionSelection = false,
    enableRegistrySelection = false,
    ...others
  } = props;
  const { data, isLoading } = useListPluginMetadata(pluginTypes);

  const sortedData = useMemo(() => {
    const filtered = filteredQueryPlugins?.length
      ? data?.filter((i) => filteredQueryPlugins.includes(i.spec.name))
      : data;
    return filtered?.toSorted((a, b) => a.spec.display.name.localeCompare(b.spec.display.name));
  }, [data, filteredQueryPlugins]);

  // Group the metadata by plugin kind, collecting all the variants each one is installed under (newest version first).
  const kindGroups = useMemo<PluginKindGroup[]>(() => {
    const groups = new Map<string, PluginKindGroup>();
    for (const metadata of sortedData ?? []) {
      const key = `${metadata.kind}:${metadata.spec.name}`;
      let group = groups.get(key);
      if (group === undefined) {
        group = {
          type: metadata.kind,
          kind: metadata.spec.name,
          displayName: metadata.spec.display.name,
          variants: [],
          hasMultipleVersions: false,
          hasMultipleRegistries: false,
        };
        groups.set(key, group);
      }
      const variant = getVariant(metadata);
      if (!group.variants.some((existing) => getVariantKey(existing) === getVariantKey(variant))) {
        group.variants.push(variant);
      }
    }
    for (const group of groups.values()) {
      group.variants = group.variants.toSorted((a, b) => comparePluginVersions(b.version ?? '', a.version ?? ''));
      group.hasMultipleVersions = new Set(group.variants.map((v) => v.version ?? '')).size > 1;
      group.hasMultipleRegistries = new Set(group.variants.map((v) => v.registry ?? '')).size > 1;
    }
    return [...groups.values()];
  }, [sortedData]);

  const options = useMemo(
    () => kindGroups.flatMap((group) => getGroupOptions(group, enableVersionSelection, enableRegistrySelection)),
    [kindGroups, enableVersionSelection, enableRegistrySelection],
  );

  const labelsByValue = useMemo(() => new Map(options.map((option) => [option.value, option.label])), [options]);

  // Pass an empty value while options are still loading so MUI doesn't complain about us using an "out of range" value
  const value = useMemo(() => {
    if (!propValue || isLoading) {
      return '';
    }
    const optionValue = selectionToOptionValue(propValue);
    if (labelsByValue.has(optionValue)) {
      return optionValue;
    }
    // The definition is not pinned (or is pinned to something we don't list): fall back to the first entry of that
    // plugin kind, which is the one that will actually be used, so the Select has a matching value.
    const fallback = options.find(
      (option) => option.selection.type === propValue.type && option.selection.kind === propValue.kind,
    );
    return fallback?.value ?? optionValue;
  }, [propValue, isLoading, labelsByValue, options]);

  const handleChange = (event: { target: { value: string } }): void => {
    onChange?.(optionValueToSelection(event.target.value));
  };

  const renderValue = useCallback(
    (selected: unknown) => {
      if (selected === '') {
        return '';
      }
      const optionValue = selected as string;
      const label = labelsByValue.get(optionValue);
      if (label !== undefined) {
        return label;
      }
      const selectedValue = optionValueToSelection(optionValue);
      return kindGroups.find((group) => group.type === selectedValue.type && group.kind === selectedValue.kind)
        ?.displayName;
    },
    [labelsByValue, kindGroups],
  );

  // TODO: Does this need a loading indicator of some kind?
  return (
    <TextField
      select
      inputRef={ref}
      {...others}
      value={value}
      aria-label={value}
      onChange={handleChange}
      SelectProps={{ renderValue }}
      data-testid="plugin-kind-select"
    >
      {isLoading && <MenuItem value="">Loading...</MenuItem>}
      {options.map((option) => (
        <MenuItem data-testid="option" key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
});
PluginKindSelect.displayName = 'PluginKindSelect';

// Delimiter used to stringify/parse option values
const OPTION_VALUE_DELIMITER = '_____';

/**
 * Given a PluginEditorSelection, returns a string value like `{type}_____{kind}` that can be used as a Select input
 * value. A pinned version and/or registry is appended as `{type}_____{kind}_____{version}_____{registry}`, with empty
 * segments for the parts that are not pinned.
 * @param selector
 */
function selectionToOptionValue(selector: PluginEditorSelection): string {
  const { version, registry } = selector.metadata ?? {};
  const parts = [selector.type, selector.kind];
  if (version || registry) {
    parts.push(version ?? '');
  }
  if (registry) {
    parts.push(registry);
  }
  return parts.join(OPTION_VALUE_DELIMITER);
}

/**
 * Given an option value name like `{type}_____{kind}` or `{type}_____{kind}_____{version}_____{registry}`, returns a
 * PluginEditorSelection to be used by the query data model.
 * @param optionValue
 */
function optionValueToSelection(optionValue: string): PluginEditorSelection {
  const words = optionValue.split(OPTION_VALUE_DELIMITER);
  const type = words[0] as PluginType | undefined;
  const kind = words[1];
  const version = words[2];
  const registry = words[3];
  if (type === undefined || kind === undefined) {
    throw new Error('Invalid optionValue string');
  }
  const metadata: PluginDefinitionMetadata = {
    ...(version ? { version } : {}),
    ...(registry ? { registry } : {}),
  };
  return {
    type,
    kind,
    ...(version || registry ? { metadata } : {}),
  };
}
