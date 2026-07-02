// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the \"License\");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an \"AS IS\" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/* eslint-disable @typescript-eslint/no-require-imports */
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

import { createInstance, ModuleFederation } from '@module-federation/enhanced/runtime';

import * as ReactQuery from '@tanstack/react-query';
import React from 'react';
import ReactDOM from 'react-dom';
import * as ReactHookForm from 'react-hook-form';
import * as ReactRouterDOM from 'react-router-dom';
import { PersesPlugin, RemotePluginModule } from './PersesPlugin.types';

let instance: ModuleFederation | null = null;

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
          version: '6.26.0',
          lib: () => ReactRouterDOM,
          shareConfig: {
            singleton: true,
            requiredVersion: '^6.26.0',
          },
        },
        '@tanstack/react-query': {
          version: '4.39.1',
          lib: () => ReactQuery,
          shareConfig: {
            singleton: true,
            requiredVersion: '^4.39.1',
          },
        },
        'react-hook-form': {
          version: '7.52.2',
          lib: () => ReactHookForm,
          shareConfig: {
            singleton: true,
            requiredVersion: '^7.52.2',
          },
        },
        echarts: {
          version: '5.5.0',
          lib: () => require('echarts'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^5.5.0',
          },
        },
        '@perses-dev/spec': {
          version: '0.2.0-beta.6',
          lib: () => require('@perses-dev/spec'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.2.0-beta.6',
          },
        },
        '@perses-dev/core': {
          version: '0.53.1',
          lib: () => require('@perses-dev/core'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.53.1',
          },
        },
        '@perses-dev/client': {
          version: '0.54.0-beta.11',
          lib: () => require('@perses-dev/client'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.54.0-beta.11',
          },
        },
        '@perses-dev/components': {
          version: '0.54.0-beta.11',
          lib: () => require('@perses-dev/components'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.54.0-beta.11',
          },
        },
        '@perses-dev/plugin-system': {
          version: '0.54.0-beta.11',
          lib: () => require('@perses-dev/plugin-system'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.54.0-beta.11',
          },
        },
        '@perses-dev/explore': {
          version: '0.54.0-beta.11',
          lib: () => require('@perses-dev/explore'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.54.0-beta.11',
          },
        },
        '@perses-dev/dashboards': {
          version: '0.54.0-beta.11',
          lib: () => require('@perses-dev/dashboards'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^0.54.0-beta.11',
          },
        },
        // Below are the shared modules that are used by the plugins, this can be part of the SDK
        'date-fns': {
          version: '4.1.0',
          lib: () => require('date-fns'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^4.1.0',
          },
        },
        'date-fns-tz': {
          version: '3.2.0',
          lib: () => require('date-fns-tz'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^3.2.0',
          },
        },
        lodash: {
          version: '4.17.21',
          lib: () => require('lodash'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^4.17.21',
          },
        },
        '@emotion/react': {
          version: '11.11.3',
          lib: () => require('@emotion/react'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^11.11.3',
          },
        },
        '@emotion/styled': {
          version: '11.11.0',
          lib: () => require('@emotion/styled'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^11.11.0',
          },
        },
        '@hookform/resolvers/zod': {
          version: '3.3.4',
          lib: () => require('@hookform/resolvers/zod'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^3.3.4',
          },
        },
        'use-resize-observer': {
          version: '9.1.0',
          lib: () => require('use-resize-observer'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^9.1.0',
          },
        },
        'mdi-material-ui': {
          version: '7.4.0',
          lib: () => require('mdi-material-ui'),
          shareConfig: {
            singleton: true,
            requiredVersion: '^7.4.0',
          },
        },
        immer: {
          version: '10.1.1',
          lib: () => require('immer'),
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
