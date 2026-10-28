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

const SAFE_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);

// Only used to resolve relative URLs, so that they are parsed the way a browser resolves them against the page.
const RELATIVE_URL_BASE = 'http://perses.local';

/**
 * Returns true when the URL is relative or uses the `http:`, `https:` or `mailto:` scheme,
 * i.e. when it is safe to use as the `href` of a link built from user-provided data.
 * Any other scheme, such as `javascript:`, `data:` or `vbscript:`, is considered unsafe.
 *
 * The check relies on the WHATWG URL parser, the one browsers use to resolve an `href`,
 * so obfuscated schemes (mixed case, leading whitespace or control characters, tabs or newlines inside the scheme, ...)
 * are normalized before being verified.
 */
export function isSafeUrl(url: string): boolean {
  try {
    return SAFE_URL_PROTOCOLS.has(new URL(url, RELATIVE_URL_BASE).protocol);
  } catch {
    return false;
  }
}

/**
 * Returns the URL when it is safe to use as the `href` of a link (see {@link isSafeUrl}), undefined otherwise.
 * It must be applied to the final URL, after any interpolation (variables, data fields, ...).
 */
export function sanitizeUrl(url: string | undefined): string | undefined {
  if (url === undefined || !isSafeUrl(url)) {
    return undefined;
  }
  return url;
}
