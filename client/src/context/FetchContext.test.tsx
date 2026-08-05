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

import { render, screen, waitFor } from '@testing-library/react';
import { FetchProvider, useFetch, FetchFn } from './FetchContext';

function TestConsumer(): React.ReactElement {
  const { fetch } = useFetch();
  return <button onClick={() => fetch('/test')}>fire</button>;
}

function TestJsonConsumer({ url }: { url: string }): React.ReactElement {
  const { fetchJson } = useFetch();
  return (
    <button
      onClick={async () => {
        const data = await fetchJson<{ ok: boolean }>(url);
        document.title = JSON.stringify(data);
      }}
    >
      json
    </button>
  );
}

describe('FetchContext', () => {
  describe('useFetch without provider', () => {
    it('returns the default fetch wrapper from @perses-dev/client', () => {
      let hookResult: ReturnType<typeof useFetch> | undefined;
      function Capture(): React.ReactNode {
        hookResult = useFetch();
        return null;
      }
      render(<Capture />);
      expect(hookResult).toBeDefined();
      expect(typeof hookResult!.fetch).toBe('function');
      expect(typeof hookResult!.fetchJson).toBe('function');
    });
  });

  describe('FetchProvider with custom fetchFn', () => {
    it('provides the custom fetch to useFetch consumers', async () => {
      const customFetch: FetchFn = jest.fn().mockResolvedValue({
        ok: true,
      } as unknown as Response);

      render(
        <FetchProvider fetchFn={customFetch}>
          <TestConsumer />
        </FetchProvider>
      );

      screen.getByText('fire').click();

      await waitFor(() => {
        expect(customFetch).toHaveBeenCalledWith('/test');
      });
    });

    it('derives fetchJson from the custom fetch', async () => {
      const customFetch: FetchFn = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ ok: true }),
      } as unknown as Response);

      render(
        <FetchProvider fetchFn={customFetch}>
          <TestJsonConsumer url="/api/data" />
        </FetchProvider>
      );

      screen.getByText('json').click();

      await waitFor(() => {
        expect(customFetch).toHaveBeenCalledWith('/api/data');
        expect(document.title).toBe('{"ok":true}');
      });
    });
  });
});
