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

import type { PluginSchema } from '@perses-dev/spec';
import { panelDefinitionSchema, buildPanelDefinitionSchema } from '@perses-dev/spec';
import { z } from 'zod';

import type { PanelEditorValues } from '../model';

const layoutDefinitionSchema = z
  .object({
    width: z.number(),
    height: z.number(),
    repeatVariable: z
      .object({
        value: z.string(),
        maxPer: z.number().min(1).max(12).optional(),
        alignment: z.enum(['horizontal', 'vertical']).optional(),
      })
      .optional(),
  })
  .optional();

// Spec publishes panelDefinitionSchema as ZodType<PanelDefinition>, so the input defaults to unknown.
// The editor stores the parsed panel and validates that value. preprocess runs the spec parser unchanged.
function editorValue<T>(schema: z.ZodType<T>): z.ZodType<T, T> {
  return z.preprocess<unknown, z.ZodType<T>, T>((value) => value, schema);
}

export const panelEditorSchema: z.ZodType<PanelEditorValues, PanelEditorValues> = z.object({
  groupId: z.number(),
  panelDefinition: editorValue(panelDefinitionSchema),
  layoutDefinition: layoutDefinitionSchema,
});

export function buildPanelEditorSchema(pluginSchema: PluginSchema): z.ZodType<PanelEditorValues, PanelEditorValues> {
  return z.object({
    groupId: z.number(),
    panelDefinition: editorValue(buildPanelDefinitionSchema(pluginSchema)),
    layoutDefinition: layoutDefinitionSchema,
  });
}
