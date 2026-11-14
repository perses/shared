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

import { linkSchema } from '@perses-dev/spec';
import type { Link } from '@perses-dev/spec';

// Editor draft. A saved link is the spec union, which needs either a URL or tags.
export interface DashboardLink {
  name?: string;
  url?: string;
  tooltip?: string;
  renderVariables?: boolean;
  targetBlank?: boolean;
  tags?: string[] | null;
  keepTime?: boolean;
  includeVariables?: boolean;
}

export function isTagLink(link: DashboardLink): boolean {
  const tags = link.tags ?? [];
  return tags.some((tag) => tag.trim() !== '') && (link.url?.trim() ?? '') === '';
}

export function isDashboardLinkValid(link: DashboardLink): boolean {
  return linkSchema.safeParse(link).success;
}

export function normalizeDashboardLink(link: DashboardLink): Link {
  return linkSchema.parse(link);
}
