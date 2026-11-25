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

import type { Link, TagLink, URLLink } from '@perses-dev/spec';

/**
 * Returns true when the link is a tag link, i.e. a menu of the dashboards that carry its tags.
 * Like the spec schema, a link with at least one tag is a tag link, whatever its `url`.
 */
export function isTagLink(link: Link): link is TagLink {
  return (link.tags?.length ?? 0) > 0;
}

/**
 * Returns true when the link is a URL link, i.e. any link that is not a tag link (see {@link isTagLink}).
 * Its `url` can be empty, and in persisted data that predates the schema it can even be missing.
 */
export function isURLLink(link: Link): link is URLLink {
  return !isTagLink(link);
}
