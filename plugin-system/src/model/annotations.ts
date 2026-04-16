import { AbsoluteTimeRange, AnnotationData, UnknownSpec } from '@perses-dev/spec';
import { DatasourceStore, VariableStateMap } from '@perses-dev/plugin-system';
import { Plugin } from './plugin-base';

/**
 * An object containing all the dependencies of a AnnotationQuery.
 */
type AnnotationQueryQueryPluginDependencies = {
  /**
   * Returns a list of variables name this annotation query depends on.
   */
  variables?: string[];
};

/**
 * A plugin for running annotation queries.
 */
export interface AnnotationPlugin<Spec = UnknownSpec> extends Plugin<Spec> {
  getAnnotationData: (spec: Spec, ctx: AnnotationContext, abortSignal?: AbortSignal) => Promise<AnnotationData>;
  dependsOn?: (spec: Spec, ctx: AnnotationContext) => AnnotationQueryQueryPluginDependencies;
}

/**
 * Context available to AnnotationQuery plugins at runtime.
 */
export interface AnnotationContext {
  datasourceStore: DatasourceStore;
  absoluteTimeRange?: AbsoluteTimeRange;
  variableState: VariableStateMap;
}
