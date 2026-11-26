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

import { isURLLink } from '@perses-dev/components';
import type { PanelDefinition, PluginSchema } from '@perses-dev/spec';
import { panelDefinitionSchema, buildPanelDefinitionSchema } from '@perses-dev/spec';
import { z } from 'zod';

import type { PanelEditorValues } from '../model';

// The spec schema accepts a looser link input than PanelDefinition, so its input type is `unknown`.
// The editor form always feeds a PanelDefinition, so narrowing the input keeps the form resolver typed.
type PanelDefinitionEditorSchema = z.ZodType<PanelDefinition, PanelDefinition>;

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

// The spec accepts an empty URL on a URL link, but the editor requires one, so that a link added with "+" and left
// empty is not saved. The error is set on the link, where the links editor displays it.
function requireLinkUrls(values: PanelEditorValues, ctx: z.RefinementCtx): void {
  values.panelDefinition.spec.links?.forEach((link, index) => {
    if (isURLLink(link) && (link.url ?? '').trim().length === 0) {
      ctx.addIssue({ code: 'custom', message: 'URL is required', path: ['panelDefinition', 'spec', 'links', index] });
    }
  });
}

export const panelEditorSchema: z.ZodType<PanelEditorValues, PanelEditorValues> = z
  .object({
    groupId: z.number(),
    panelDefinition: panelDefinitionSchema as PanelDefinitionEditorSchema,
    layoutDefinition: layoutDefinitionSchema,
  })
  .superRefine(requireLinkUrls);

export function buildPanelEditorSchema(pluginSchema: PluginSchema): z.ZodType<PanelEditorValues, PanelEditorValues> {
  return z
    .object({
      groupId: z.number(),
      panelDefinition: buildPanelDefinitionSchema(pluginSchema) as PanelDefinitionEditorSchema,
      layoutDefinition: layoutDefinitionSchema,
    })
    .superRefine(requireLinkUrls);
}
