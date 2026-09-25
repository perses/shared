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

import type { ModuleFederation } from '@module-federation/enhanced/runtime';
import { act, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import type { PersesPlugin, RemotePluginModule } from './PersesPlugin.types';
import { PluginLoaderComponent } from './PluginLoaderComponent';
import * as PluginRuntime from './PluginRuntime';

globalThis.fetch = vi.fn(() => Promise.resolve({ ok: true } as Response));

vi.mock('@module-federation/enhanced/runtime', () => ({
  init: vi.fn(() => ({
    options: {
      remotes: [],
    },
    registerRemotes: vi.fn(),
  })),
  loadRemote: vi.fn(),
}));

vi.mock('./PluginRuntime', () => ({
  usePluginRuntime: vi.fn(),
  pluginRuntime: {} as ModuleFederation,
}));

class SimpleErrorBoundary extends React.Component<React.PropsWithChildren, { error: Error | null }> {
  constructor(props: React.PropsWithChildren) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): { error: Error } {
    return { error };
  }

  render(): React.ReactNode {
    if (this.state.error !== null) {
      return this.state.error.message;
    }

    return this.props.children;
  }
}

const mockPlugin: PersesPlugin = {
  name: 'test-plugin',
  moduleName: 'test-module',
  baseURL: 'https://example.com',
};
const firstProps = { label: 'First' };
const secondProps = { label: 'Second' };
const samePlugin = { ...mockPlugin };
const previousPlugin = { ...mockPlugin, version: '1' };
const nextPlugin = { ...mockPlugin, version: '2' };

describe('PluginLoaderComponent', () => {
  it('keeps the loaded plugin mounted when only its props change', async () => {
    const loadPlugin = vi.fn().mockResolvedValue({
      'test-plugin': ({ label }: { label: string }): React.ReactNode => <div>{label}</div>,
    });
    vi.mocked(PluginRuntime.usePluginRuntime).mockReturnValue({
      loadPlugin,
      pluginRuntime: {} as ModuleFederation,
    });
    const { rerender } = render(<PluginLoaderComponent plugin={mockPlugin} props={firstProps} />);
    expect(await screen.findByText('First')).toBeInTheDocument();

    rerender(<PluginLoaderComponent plugin={samePlugin} props={secondProps} />);
    expect(screen.getByText('Second')).toBeInTheDocument();
    expect(loadPlugin).toHaveBeenCalledTimes(1);
  });

  it('reloads a changed plugin version and ignores the previous pending load', async () => {
    let resolvePrevious!: (module: RemotePluginModule) => void;
    const previousLoad = vi.fn(
      () =>
        new Promise<RemotePluginModule>((resolve) => {
          resolvePrevious = resolve;
        }),
    );
    const nextLoad = vi.fn().mockResolvedValue({
      'test-plugin': (): React.ReactNode => <div>New version</div>,
    });
    vi.mocked(PluginRuntime.usePluginRuntime).mockImplementation(({ plugin }) => ({
      loadPlugin: plugin.version === '2' ? nextLoad : previousLoad,
      pluginRuntime: {} as ModuleFederation,
    }));
    const { rerender } = render(<PluginLoaderComponent plugin={previousPlugin} />);
    rerender(<PluginLoaderComponent plugin={nextPlugin} />);
    expect(await screen.findByText('New version')).toBeInTheDocument();

    await act(async () => {
      resolvePrevious({ 'test-plugin': (): React.ReactNode => <div>Old version</div> });
    });
    expect(screen.queryByText('Old version')).not.toBeInTheDocument();
    expect(screen.getByText('New version')).toBeInTheDocument();
    expect(previousLoad).toHaveBeenCalledTimes(1);
    expect(nextLoad).toHaveBeenCalledTimes(1);
  });

  it('should render the plugin component', async () => {
    const mockPluginModule = vi.fn(() => <div>Mock Plugin Component</div>);

    vi.spyOn(PluginRuntime, 'usePluginRuntime').mockReturnValue({
      loadPlugin: (): Promise<{ 'test-plugin': () => React.ReactNode }> =>
        Promise.resolve({ 'test-plugin': mockPluginModule }),
      pluginRuntime: {} as ModuleFederation,
    });

    act(() => {
      render(<PluginLoaderComponent plugin={mockPlugin} />);
    });

    await waitFor(() => {
      expect(mockPluginModule).toHaveBeenCalled();
    });

    expect(screen.getByText('Mock Plugin Component')).toBeInTheDocument();
  });

  it('should throw an error if the plugin module does not have a named export', async () => {
    const mockPluginModule = vi.fn(() => <div>Mock Plugin Component</div>);

    vi.spyOn(PluginRuntime, 'usePluginRuntime').mockReturnValue({
      loadPlugin: (): Promise<RemotePluginModule> => Promise.resolve({ mockPluginModule } as RemotePluginModule),
      pluginRuntime: {} as ModuleFederation,
    });

    act(() => {
      render(
        <SimpleErrorBoundary>
          <PluginLoaderComponent plugin={mockPlugin} />
        </SimpleErrorBoundary>,
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('PluginLoaderComponent: Plugin module test-module does not have a test-plugin export'),
      ).toBeInTheDocument();
    });
  });

  it('should throw an error if the plugin module named export is not a function', async () => {
    vi.spyOn(PluginRuntime, 'usePluginRuntime').mockReturnValue({
      loadPlugin: (): Promise<RemotePluginModule> =>
        Promise.resolve({ 'test-plugin': 'not a function' } as unknown as RemotePluginModule),
      pluginRuntime: {} as ModuleFederation,
    });

    act(() => {
      render(
        <SimpleErrorBoundary>
          <PluginLoaderComponent plugin={mockPlugin} />
        </SimpleErrorBoundary>,
      );
    });

    await waitFor(() => {
      expect(
        screen.getByText('PluginLoaderComponent: Plugin test-plugin export is not a function'),
      ).toBeInTheDocument();
    });
  });
});
