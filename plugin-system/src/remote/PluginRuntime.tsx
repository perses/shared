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

import * as EmotionReact from '@emotion/react';
import * as EmotionStyled from '@emotion/styled';
import type { ModuleFederation } from '@module-federation/enhanced/runtime';
import { createInstance } from '@module-federation/enhanced/runtime';
import * as ReactQuery from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactHookForm from 'react-hook-form';
import * as ReactRouterDOM from 'react-router-dom';

import type { PersesPlugin, RemotePluginModule } from './PersesPlugin.types';

let instance: ModuleFederation | null = null;

function createSharedModuleLoader<TModule>(loadModule: () => Promise<TModule>): () => Promise<() => TModule> {
  return async () => {
    const module = await loadModule();
    return () => module;
  };
}

export interface HostSharedModules {
  '@perses-dev/spec': unknown;
  '@perses-dev/client': unknown;
  '@perses-dev/components': unknown;
  '@perses-dev/plugin-system': unknown;
  '@perses-dev/explore': unknown;
  '@perses-dev/dashboards': unknown;
}

type HostSharedModuleName = keyof HostSharedModules;

const hostSharedModules = new Map<HostSharedModuleName, unknown>();

/*
 * Shared singletons must be provided to Module Federation *synchronously* (via `lib`) so the host's
 * copy wins singleton negotiation to avoid loader deadlocks or multiple instances.
 */
export function registerHostSharedModules(modules: HostSharedModules): void {
  for (const [name, module] of Object.entries(modules) as Array<[HostSharedModuleName, unknown]>) {
    hostSharedModules.set(name, module);
  }
}

function getHostSharedModule(name: HostSharedModuleName): unknown {
  const module = hostSharedModules.get(name);
  if (!module) {
    throw new Error(
      `Shared module "${name}" was not registered before a plugin tried to consume it. ` +
        `Call registerHostSharedModules() during app bootstrap.`,
    );
  }
  return module;
}

const getPluginRuntime = (): ModuleFederation => {
  if (instance === null) {
    const pluginRuntime = createInstance({
      name: '@perses/perses-ui-host',
      remotes: [], // all remotes are loaded dynamically
      shared: {
        react: {
          version: React.version,
          lib: () => React,
          shareConfig: {
            singleton: true,
            requiredVersion: `^${React.version}`,
          },
        },
        'react-dom': {
          version: '18.3.1',
          lib: () => ReactDOM,
          shareConfig: {
            singleton: true,
            requiredVersion: `^18.3.1`,
          },
        },
        'react-router-dom': {
          version: '6.30.4',
          lib: () => ReactRouterDOM,
          shareConfig: {
            singleton: true,
            requiredVersion: '^6.26.0',
          },
        },
        '@tanstack/react-query': {
          version: '4.44.0',
          lib: () => ReactQuery,
          shareConfig: {
            singleton: true,
            requiredVersion: '^4.39.1',
          },
        },
        'react-hook-form': {
          version: '7.76.0',
          lib: () => ReactHookForm,
          shareConfig: {
            singleton: true,
            requiredVersion: '^7.52.2',
          },
        },
        '@emotion/react': {
          version: '11.14.0',
          lib: () => EmotionReact,
          shareConfig: {
            singleton: true,
            requiredVersion: '^11.11.3',
          },
        },
        '@emotion/styled': {
          version: '11.14.1',
          lib: () => EmotionStyled,
          shareConfig: {
            singleton: true,
            requiredVersion: '^11.11.0',
          },
        },
        '@perses-dev/spec': {
          version: '0.3.0-beta.5',
          lib: () => getHostSharedModule('@perses-dev/spec'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.3.0-beta.5',
          },
        },
        '@perses-dev/client': {
          version: '0.55.0-beta.7',
          lib: () => getHostSharedModule('@perses-dev/client'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.55.0-beta.7',
          },
        },
        '@perses-dev/components': {
          version: '0.55.0-beta.7',
          lib: () => getHostSharedModule('@perses-dev/components'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.55.0-beta.7',
          },
        },
        '@perses-dev/plugin-system': {
          version: '0.55.0-beta.7',
          lib: () => getHostSharedModule('@perses-dev/plugin-system'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.55.0-beta.7',
          },
        },
        '@perses-dev/explore': {
          version: '0.55.0-beta.7',
          lib: () => getHostSharedModule('@perses-dev/explore'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.55.0-beta.7',
          },
        },
        '@perses-dev/dashboards': {
          version: '0.55.0-beta.7',
          lib: () => getHostSharedModule('@perses-dev/dashboards'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.55.0-beta.7',
          },
        },
        // Below are the shared modules that are used by the plugins and are loaded asynchronously on demand using get rather than lib.
        // This is to avoid loading the modules if they are not used by the plugin.
        echarts: {
          version: '5.5.0',
          get: createSharedModuleLoader(() => import('echarts')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^5.5.0',
          },
        },
        'date-fns': {
          version: '4.2.1',
          get: createSharedModuleLoader(() => import('date-fns')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^4.1.0',
          },
        },
        'date-fns-tz': {
          version: '3.2.0',
          get: createSharedModuleLoader(() => import('date-fns-tz')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^3.2.0',
          },
        },
        lodash: {
          version: '4.18.1',
          get: createSharedModuleLoader(() => import('lodash')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^4.17.21',
          },
        },
        '@hookform/resolvers/zod': {
          version: '3.10.0',
          get: createSharedModuleLoader(() => import('@hookform/resolvers/zod')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^3.3.4',
          },
        },
        'use-resize-observer': {
          version: '9.1.0',
          get: createSharedModuleLoader(() => import('use-resize-observer')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^9.1.0',
          },
        },
        'mdi-material-ui': {
          version: '7.9.4',
          get: createSharedModuleLoader(() => import('mdi-material-ui')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^7.4.0',
          },
        },
        immer: {
          version: '10.2.0',
          get: createSharedModuleLoader(() => import('immer')),
          shareConfig: {
            singleton: true,
            requiredVersion: '^10.1.1',
          },
        },
      },
    });

    instance = pluginRuntime;

    return instance;
  }
  return instance;
};

function getModuleFederationRemoteName(name: string, registry?: string, version?: string): string {
  return `${name}:${registry ?? ''}:${version ?? ''}`;
}

const registerRemote = (name: string, registry?: string, version?: string, baseURL?: string): void => {
  const pluginRuntime = getPluginRuntime();
  const registryName = getModuleFederationRemoteName(name, registry, version);

  const existingRemote = pluginRuntime.options.remotes.find((remote) => remote.name === registryName);
  if (!existingRemote) {
    const nameVersionRegistry = [name, version, registry].filter(Boolean).join('~');
    const prefix = baseURL || '/plugins';
    const remoteEntryURL = `${prefix}/${nameVersionRegistry}/mf-manifest.json`;

    pluginRuntime.registerRemotes([
      {
        name: registryName,
        entry: remoteEntryURL,
        alias: registryName,
      },
    ]);
  }
};

export const loadPlugin = async (target: {
  moduleName: string;
  pluginName: string;
  registry?: string;
  version?: string;
  baseURL?: string;
}): Promise<RemotePluginModule | null> => {
  const { moduleName, pluginName, registry, version, baseURL } = target;
  registerRemote(moduleName, registry, version, baseURL);

  const pluginRuntime = getPluginRuntime();
  const registryName = getModuleFederationRemoteName(moduleName, registry, version);
  return pluginRuntime.loadRemote<RemotePluginModule>(`${registryName}/${pluginName}`);
};

export function usePluginRuntime({ plugin }: { plugin: PersesPlugin }): {
  pluginRuntime: ModuleFederation;
  loadPlugin: () => Promise<RemotePluginModule | null>;
} {
  return {
    pluginRuntime: getPluginRuntime(),
    loadPlugin: (): Promise<RemotePluginModule | null> => {
      const { moduleName, name: pluginName, registry, version, baseURL } = plugin;
      return loadPlugin({ moduleName, pluginName, registry, version, baseURL });
    },
  };
}
