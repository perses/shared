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

import { MenuItem, TextField, TextFieldProps } from '@mui/material';
import { forwardRef, ReactElement, useCallback, useMemo } from 'react';

import { gt } from 'semver';
import { PluginType, PluginMetadataWithModule } from '../../model';
import { useListPluginMetadata } from '../../runtime';
import { PluginEditorSelection } from '../PluginEditor';

export interface PluginKindSelectProps extends Omit<TextFieldProps, 'value' | 'onChange' | 'children'> {
  filteredQueryPlugins?: string[];
  pluginTypes: PluginType[];
  value?: PluginEditorSelection;
  onChange?: (s: PluginEditorSelection) => void;
  /**
   * When true, plugins that have more than one version available are listed once per version, labeled
   * `<display name> - <version>`. Selecting such an option sets the version on the selection so it can be persisted on
   * the definition. Plugins with a single available version are listed without a version (they always use the latest).
   * Defaults to false, in which case a single entry per plugin kind is shown (no version).
   */
  enableVersionSelection?: boolean;
}

/** A plugin kind grouped with all of its available versions. */
interface PluginKindGroup {
  type: PluginType;
  kind: string;
  displayName: string;
  /** Available versions, sorted from newest to oldest. */
  versions: string[];
}

function getMetadataVersion(metadata: PluginMetadataWithModule): string | undefined {
  return metadata.metadata?.version ?? metadata.module?.version;
}

/** Sort versions from newest to oldest, falling back to a reverse string comparison for non-semver values. */
function sortVersionsDesc(versions: string[]): string[] {
  return [...versions].sort((a, b) => {
    try {
      if (gt(a, b)) return -1;
      if (gt(b, a)) return 1;
      return 0;
    } catch {
      return b.localeCompare(a);
    }
  });
}

/**
 * Displays a MUI Select input for selecting a plugin's kind from a list of all the available plugins of some specific
 * plugin types. (e.g. "Show a list of all the Panel plugins", or "Show a list of all the Variable plugins", or "Show
 * a list of all the TimeSeriesQuery, TraceQuery, ProfileQuery, and LogQuery plugins").
 * The value of the select is the kind of the plugin, but you can also listen to the `onPluginTypeChange` event to know
 * when the user changes the plugin type (it fires at start for the default value.)
 */
export const PluginKindSelect = forwardRef((props: PluginKindSelectProps, ref): ReactElement => {
  const { pluginTypes, value: propValue, onChange, filteredQueryPlugins, enableVersionSelection, ...others } = props;
  const { data, isLoading } = useListPluginMetadata(pluginTypes);

  const sortedData = useMemo(() => {
    if (filteredQueryPlugins?.length) {
      return data
        ?.filter((i) => filteredQueryPlugins.includes(i.spec.name))
        ?.sort((a, b) => a.spec.display.name.localeCompare(b.spec.display.name));
    }

    return data?.sort((a, b) => a.spec.display.name.localeCompare(b.spec.display.name));
  }, [data, filteredQueryPlugins]);

  // Group the metadata by plugin kind, collecting all the available versions for each one (newest first).
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
          versions: [],
        };
        groups.set(key, group);
      }
      const version = getMetadataVersion(metadata);
      if (version && !group.versions.includes(version)) {
        group.versions.push(version);
      }
    }
    for (const group of groups.values()) {
      group.versions = sortVersionsDesc(group.versions);
    }
    return [...groups.values()];
  }, [sortedData]);

  const findGroup = useCallback(
    (selection: PluginEditorSelection): PluginKindGroup | undefined =>
      kindGroups.find((g) => g.type === selection.type && g.kind === selection.kind),
    [kindGroups]
  );

  // Pass an empty value while options are still loading so MUI doesn't complain about us using an "out of range" value
  const value = useMemo(() => {
    if (!propValue || isLoading) {
      return '';
    }
    // When version selection is enabled and the definition is not pinned to a version, but multiple versions exist,
    // display the newest version option (which is what will actually be used) so the Select has a matching value.
    if (enableVersionSelection && !propValue.version) {
      const group = findGroup(propValue);
      if (group && group.versions.length > 1) {
        return selectionToOptionValue({ ...propValue, version: group.versions[0] });
      }
    }
    return selectionToOptionValue(propValue);
  }, [propValue, isLoading, enableVersionSelection, findGroup]);

  const handleChange = (event: { target: { value: string } }): void => {
    onChange?.(optionValueToSelection(event.target.value));
  };

  const renderValue = useCallback(
    (selected: unknown) => {
      if (selected === '') {
        return '';
      }
      const selectedValue = optionValueToSelection(selected as string);
      const group = findGroup(selectedValue);
      const displayName =
        group?.displayName ??
        sortedData?.find((v) => v.kind === selectedValue.type && v.spec.name === selectedValue.kind)?.spec.display.name;
      if (enableVersionSelection && selectedValue.version && group && group.versions.length > 1) {
        return `${displayName} - ${selectedValue.version}`;
      }
      return displayName;
    },
    [findGroup, sortedData, enableVersionSelection],
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
      {enableVersionSelection
        ? kindGroups.flatMap((group) => {
            // A single available version behaves like "latest": show one entry without a version.
            if (group.versions.length <= 1) {
              return [
                <MenuItem
                  data-testid="option"
                  key={group.type + group.kind}
                  value={selectionToOptionValue({ type: group.type, kind: group.kind })}
                >
                  {group.displayName}
                </MenuItem>,
              ];
            }
            // Multiple versions: one selectable entry per version, labeled "<display name> - <version>".
            return group.versions.map((version) => (
              <MenuItem
                data-testid="option"
                key={`${group.type}${group.kind}${version}`}
                value={selectionToOptionValue({ type: group.type, kind: group.kind, version })}
              >
                {`${group.displayName} - ${version}`}
              </MenuItem>
            ));
          })
        : sortedData?.map((metadata) => (
            <MenuItem
              data-testid="option"
              key={metadata.kind + metadata.spec.name}
              value={selectionToOptionValue({ type: metadata.kind, kind: metadata.spec.name })}
            >
              {metadata.spec.display.name}
            </MenuItem>
          ))}
    </TextField>
  );
});
PluginKindSelect.displayName = 'PluginKindSelect';

// Delimiter used to stringify/parse option values
const OPTION_VALUE_DELIMITER = '_____';

/**
 * Given a PluginEditorSelection, returns a string value like `{type}_____{kind}` (or `{type}_____{kind}_____{version}`
 * when a version is present) that can be used as a Select input value.
 * @param selector
 */
function selectionToOptionValue(selector: PluginEditorSelection): string {
  const parts = [selector.type, selector.kind];
  if (selector.version) {
    parts.push(selector.version);
  }
  return parts.join(OPTION_VALUE_DELIMITER);
}

/**
 * Given an option value name like `{type}_____{kind}` or `{type}_____{kind}_____{version}`, returns a
 * PluginEditorSelection to be used by the query data model.
 * @param optionValue
 */
function optionValueToSelection(optionValue: string): PluginEditorSelection {
  const words = optionValue.split(OPTION_VALUE_DELIMITER);
  const type = words[0] as PluginType | undefined;
  const kind = words[1];
  const version = words[2];
  if (type === undefined || kind === undefined) {
    throw new Error('Invalid optionValue string');
  }
  return {
    type,
    kind,
    ...(version ? { version } : {}),
  };
}
