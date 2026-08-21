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

import { JsonData, UnknownSpec } from '@perses-dev/spec';

import { DatasourceStore, VariableStateMap } from '../runtime';
import { Plugin } from './plugin-base';

type JsonQueryPluginDependencies = {
  variables?: string[];
};

export interface JsonQueryContext {
  variableState: VariableStateMap;
  datasourceStore: DatasourceStore;
}

export interface JsonQueryPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getJsonData: (spec: Spec, ctx: JsonQueryContext, abortSignal?: AbortSignal) => Promise<JsonData>;
  dependsOn?: (spec: Spec, ctx: JsonQueryContext) => JsonQueryPluginDependencies;
}
