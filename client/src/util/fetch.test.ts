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

import type { StatusError } from './fetch';
import { fetch, FetchError, UserFriendlyError } from './fetch';

function mockResponse(body: string | null, init: ResponseInit): void {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(body, init));
}

describe('fetch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test.each([
    {
      title: 'JSON error body',
      body: JSON.stringify({ error: 'too many requests' }),
      contentType: 'application/json',
      message: 'too many requests',
    },
    {
      title: 'JSON message body',
      body: JSON.stringify({ message: 'slow down' }),
      contentType: 'application/json; charset=utf-8',
      message: 'slow down',
    },
    {
      title: 'JSON body without error or message',
      body: JSON.stringify({ detail: 'rate limited' }),
      contentType: 'application/json',
      message: JSON.stringify({ detail: 'rate limited' }),
    },
    { title: 'text body', body: 'try later', contentType: 'text/plain', message: 'try later' },
  ])('throws UserFriendlyError with status and headers for $title', async ({ body, contentType, message }) => {
    mockResponse(body, { status: 429, headers: { 'Content-Type': contentType, 'Retry-After': '7' } });

    const error = await fetch('/api').catch((e) => e);

    expect(error).toBeInstanceOf(UserFriendlyError);
    expect(error.message).toBe(message);
    expect(error.status).toBe(429);
    expect(error.headers.get('Retry-After')).toBe('7');
  });

  test('throws FetchError with status and headers for an empty body', async () => {
    mockResponse(null, { status: 503, statusText: 'Service Unavailable', headers: { 'Retry-After': '30' } });

    const error = await fetch('/api').catch((e) => e);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(503);
    expect(error.headers.get('Retry-After')).toBe('30');
  });

  test('throws FetchError when a JSON content-type has an empty body', async () => {
    mockResponse('', { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '5' } });

    const error = await fetch('/api').catch((e) => e);

    expect(error).toBeInstanceOf(FetchError);
    expect(error.status).toBe(429);
    expect(error.headers.get('Retry-After')).toBe('5');
  });

  test.each([
    { title: 'invalid JSON', body: '<html>429</html>' },
    { title: 'a null body', body: 'null' },
  ])('keeps status and headers for a JSON content-type with $title', async ({ body }) => {
    mockResponse(body, { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '5' } });

    const error = await fetch('/api').catch((e) => e);

    expect(error).toBeInstanceOf(UserFriendlyError);
    expect(error.message).toBe(body);
    expect(error.status).toBe(429);
    expect(error.headers.get('Retry-After')).toBe('5');
  });

  test('returns OK responses as-is', async () => {
    const response = new Response('ok', { status: 200 });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(response);

    await expect(fetch('/api')).resolves.toBe(response);
  });
});

describe('UserFriendlyError', () => {
  test('leaves headers undefined when not provided', () => {
    const error = new UserFriendlyError('boom', 500);

    const statusError: StatusError = error;

    expect(statusError.status).toBe(500);
    expect(statusError.headers).toBeUndefined();
  });
});
