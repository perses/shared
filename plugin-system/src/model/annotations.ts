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

import { DatasourceStore, VariableStateMap } from '@perses-dev/plugin-system';
import { AbsoluteTimeRange, AnnotationData, UnknownSpec } from '@perses-dev/spec';

import { Plugin } from './plugin-base';

/**
 * An object containing all the dependencies of a AnnotationQuery.
 */
export type AnnotationQueryPluginDependencies = {
  /**
   * Returns a list of variables name this annotation query depends on.
   */
  variables?: string[];
};

/**
 * A plugin for running annotation queries.
 */
export interface AnnotationPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getAnnotationData: (spec: Spec, ctx: AnnotationContext, abortSignal?: AbortSignal) => Promise<AnnotationData[]>;
  dependsOn?: (spec: Spec, ctx: AnnotationContext) => AnnotationQueryPluginDependencies;
}

/**
 * Context available to AnnotationQuery plugins at runtime.
 */
export interface AnnotationContext {
  datasourceStore: DatasourceStore;
  absoluteTimeRange: AbsoluteTimeRange;
  variableState: VariableStateMap;
}
