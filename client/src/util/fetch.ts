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

/**
 * Calls `globalThis.fetch` and determines which type of error to show for non-200 responses: a `UserFriendlyError`
 * with the body's message or text, or a `FetchError` for an empty body. Both carry the status and response headers.
 */
export async function fetch(...args: Parameters<typeof globalThis.fetch>): Promise<Response> {
  const response = await globalThis.fetch(...args);
  if (response.ok === false) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      // Invalid or non-object JSON falls through to the text path so status and headers survive.
      const json = await response
        .clone()
        .json()
        .catch(() => undefined);
      if (json?.error) {
        throw new UserFriendlyError(json.error, response.status, response.headers);
      }
      if (json?.message) {
        throw new UserFriendlyError(json.message, response.status, response.headers);
      }
    }

    const text = await response.clone().text();
    if (text) {
      throw new UserFriendlyError(text, response.status, response.headers);
    }
    throw new FetchError(response);
  }
  return response;
}

/**
 * Calls {@link fetch}, which throws a `UserFriendlyError` or `FetchError` on non-200 responses, and also
 * decodes the response body as JSON, casting it to type `T`. Returns the
 * decoded body.
 */
export async function fetchJson<T>(...args: Parameters<typeof globalThis.fetch>): Promise<T> {
  const response = await fetch(...args);
  if (!response.ok) {
    throw new FetchError(response);
  }
  return await response.json();
}

export interface StatusError extends Error {
  status: number;
  /** Response headers, when the error comes from a response. */
  headers?: Headers;
}

/**
 * Error thrown when fetch returns a non-200 response.
 */
export class FetchError extends Error implements StatusError {
  status: number;
  /** Response headers, e.g. `Retry-After`; cross-origin it needs `Access-Control-Expose-Headers`. */
  headers: Headers;
  constructor(response: Readonly<Response>) {
    super(`${response.status} ${response.statusText}`);
    this.status = response.status;
    this.headers = response.headers;
    Object.setPrototypeOf(this, FetchError.prototype);
  }
}

/**
 * General error type for an error that has a message that is OK to show to the end user.
 */
export class UserFriendlyError extends Error implements StatusError {
  status: number;
  /**
   * Response headers when the error comes from a response, e.g. `Retry-After`;
   * cross-origin it needs `Access-Control-Expose-Headers`.
   */
  headers?: Headers;
  constructor(message: string, status: number, headers?: Headers) {
    super(message);
    this.status = status;
    this.headers = headers;
    Object.setPrototypeOf(this, UserFriendlyError.prototype);
  }
}
