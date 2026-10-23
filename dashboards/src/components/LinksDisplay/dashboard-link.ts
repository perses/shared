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

import type { Link } from '@perses-dev/spec';

/** Until @perses-dev/spec publishes optional url and tags. */
export type DashboardLink = Omit<Link, 'url'> & {
  url?: string;
  tags?: string[];
  keepTime?: boolean;
  includeVariables?: boolean;
};

export function linkTags(link: DashboardLink): string[] {
  return (link.tags ?? []).map((tag) => tag.trim()).filter((tag) => tag.length > 0);
}

export function isTagLink(link: DashboardLink): boolean {
  return linkTags(link).length > 0 && (link.url?.trim() ?? '') === '';
}

export function isDashboardLinkValid(link: DashboardLink): boolean {
  const url = link.url?.trim() ?? '';
  const tags = linkTags(link);
  if (url !== '' && tags.length > 0) {
    return false;
  }
  if (url !== '') {
    return true;
  }
  return tags.length > 0 && (link.name?.trim() ?? '') !== '';
}

export function normalizeDashboardLink(link: DashboardLink): DashboardLink {
  const tags = linkTags(link);
  const url = link.url?.trim() ?? '';
  if (tags.length > 0 && url === '') {
    return {
      name: link.name?.trim() || undefined,
      tooltip: link.tooltip,
      tags,
      keepTime: link.keepTime,
      includeVariables: link.includeVariables,
    };
  }
  return {
    name: link.name,
    url,
    tooltip: link.tooltip,
    renderVariables: link.renderVariables,
    targetBlank: link.targetBlank,
  };
}
