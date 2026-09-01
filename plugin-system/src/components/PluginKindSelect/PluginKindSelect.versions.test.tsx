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

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { PluginModuleResource } from '../../model';
import { dynamicImportPluginLoader } from '../../model';
import type { PluginEditorSelection } from '../PluginEditor';
import { PluginRegistry } from '../PluginRegistry';
import type { PluginKindSelectProps } from './PluginKindSelect';
import { PluginKindSelect } from './PluginKindSelect';

/** A plugin module exposing a single Panel plugin, installed under the given version/registry. */
function buildResource(pluginName: string, version: string, registry?: string): PluginModuleResource {
  return {
    kind: 'PluginModule',
    metadata: { name: `${pluginName}-${registry ?? 'default'}-${version}`, version, registry },
    spec: {
      plugins: [{ kind: 'Panel', spec: { name: pluginName, display: { name: pluginName } } }],
    },
  };
}

// `Multi` is installed in three versions, `Single` in only one, and `Registries` once per registry.
const RESOURCES: PluginModuleResource[] = [
  buildResource('Multi', '1.0.0'),
  buildResource('Multi', '2.0.0'),
  buildResource('Multi', '1.10.0'),
  buildResource('Single', '1.0.0'),
  buildResource('Registries', '1.0.0', 'alpha'),
  buildResource('Registries', '2.0.0', 'beta'),
];

function renderSelect(props: Omit<PluginKindSelectProps, 'pluginTypes'>): void {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const pluginLoader = dynamicImportPluginLoader(
    RESOURCES.map((resource) => ({
      resource,
      // The select only needs the metadata, never the implementation.
      importPlugin: (): Promise<Record<string, unknown>> => Promise.resolve({}),
    })),
  );
  render(
    <QueryClientProvider client={queryClient}>
      <PluginRegistry pluginLoader={pluginLoader}>
        <PluginKindSelect pluginTypes={['Panel']} {...props} />
      </PluginRegistry>
    </QueryClientProvider>,
  );
}

/** Opens the select and waits for the options to be loaded, returning their labels in display order. */
async function openSelect(): Promise<string[]> {
  userEvent.click(screen.getByRole('combobox'));
  const options = await screen.findAllByTestId('option');
  return options.map((option) => option.textContent ?? '');
}

describe('PluginKindSelect version and registry selection', () => {
  it('lists a single entry per plugin kind by default, even when several versions are installed', async () => {
    renderSelect({ value: undefined });

    const labels = await openSelect();
    // One entry per kind, de-duplicated: no version suffix and no duplicated option.
    expect(labels).toEqual(['Multi', 'Registries', 'Single']);
  });

  it('lists one entry per version, newest first, when version selection is enabled', async () => {
    renderSelect({ value: undefined, enableVersionSelection: true });

    const labels = await openSelect();
    // `Multi` has several versions so each one is selectable, ordered with semver (1.10.0 sorts above 1.0.0, which a
    // lexicographic comparison would get wrong). `Single` has one version only, so it stays version-less and keeps
    // floating on the latest.
    expect(labels).toEqual([
      'Multi - 2.0.0',
      'Multi - 1.10.0',
      'Multi - 1.0.0',
      'Registries - 2.0.0',
      'Registries - 1.0.0',
      'Single',
    ]);
  });

  it('emits the selected version as definition metadata', async () => {
    let selection: PluginEditorSelection | undefined = undefined;
    renderSelect({ value: undefined, enableVersionSelection: true, onChange: (s) => (selection = s) });

    await openSelect();
    userEvent.click(screen.getByRole('option', { name: 'Multi - 1.0.0' }));

    expect(selection).toStrictEqual({ type: 'Panel', kind: 'Multi', metadata: { version: '1.0.0' } });
  });

  it('does not pin anything when the plugin only has one version', async () => {
    let selection: PluginEditorSelection | undefined = undefined;
    renderSelect({ value: undefined, enableVersionSelection: true, onChange: (s) => (selection = s) });

    await openSelect();
    userEvent.click(screen.getByRole('option', { name: 'Single' }));

    expect(selection).toStrictEqual({ type: 'Panel', kind: 'Single' });
  });

  it('shows the version an existing definition is pinned to', async () => {
    renderSelect({
      value: { type: 'Panel', kind: 'Multi', metadata: { version: '1.0.0' } },
      enableVersionSelection: true,
    });

    expect(await screen.findByText('Multi - 1.0.0')).toBeInTheDocument();
  });

  it('shows the version that will actually be used when the definition is not pinned', async () => {
    renderSelect({ value: { type: 'Panel', kind: 'Multi' }, enableVersionSelection: true });

    // Unpinned means "latest", so the newest version is displayed rather than an out-of-range empty value.
    expect(await screen.findByText('Multi - 2.0.0')).toBeInTheDocument();
  });

  it('keeps a pin the select does not list rather than dropping it silently', async () => {
    let selection: PluginEditorSelection | undefined = undefined;
    renderSelect({
      // Version selection is disabled, so no version option exists, yet the definition is pinned.
      value: { type: 'Panel', kind: 'Multi', metadata: { version: '1.0.0' } },
      onChange: (s) => (selection = s),
    });

    // The displayed value falls back to the plugin kind, and nothing changes until the user picks another option.
    expect(await screen.findByText('Multi')).toBeInTheDocument();
    expect(selection).toBeUndefined();
  });

  it('lists one entry per registry, and emits it, when registry selection is enabled', async () => {
    let selection: PluginEditorSelection | undefined = undefined;
    renderSelect({ value: undefined, enableRegistrySelection: true, onChange: (s) => (selection = s) });

    const labels = await openSelect();
    // Only `Registries` is available in more than one registry, so it is the only kind listed per registry.
    expect(labels).toEqual(['Multi', 'Registries (beta)', 'Registries (alpha)', 'Single']);

    userEvent.click(screen.getByRole('option', { name: 'Registries (alpha)' }));
    expect(selection).toStrictEqual({ type: 'Panel', kind: 'Registries', metadata: { registry: 'alpha' } });
  });

  it('combines version and registry when both selections are enabled', async () => {
    renderSelect({ value: undefined, enableVersionSelection: true, enableRegistrySelection: true });

    const labels = await openSelect();
    expect(labels).toEqual([
      'Multi - 2.0.0',
      'Multi - 1.10.0',
      'Multi - 1.0.0',
      'Registries - 2.0.0 (beta)',
      'Registries - 1.0.0 (alpha)',
      'Single',
    ]);
  });
});
