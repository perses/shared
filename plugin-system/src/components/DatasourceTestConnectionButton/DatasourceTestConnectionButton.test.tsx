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

import { SnackbarContext } from '@perses-dev/components';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { DatasourceTestConnectionButton } from './DatasourceTestConnectionButton';

const mockSuccessSnackbar = vi.fn();
const mockExceptionSnackbar = vi.fn();

vi.mock('@perses-dev/components', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@perses-dev/components')>()),
  useSnackbar: (): Partial<SnackbarContext> => ({
    successSnackbar: mockSuccessSnackbar,
    exceptionSnackbar: mockExceptionSnackbar,
  }),
}));

describe('DatasourceTestConnectionButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the button with "Test Connection" label', () => {
    render(<DatasourceTestConnectionButton testConnection={vi.fn().mockResolvedValue(undefined)} />);
    expect(screen.getByRole('button', { name: /test connection/i })).toBeInTheDocument();
  });

  it('calls testConnection when clicked', async () => {
    const mockTestConnection = vi.fn().mockResolvedValue(undefined);
    render(<DatasourceTestConnectionButton testConnection={mockTestConnection} />);

    await userEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(mockTestConnection).toHaveBeenCalledTimes(1);
    });
  });

  it('shows success snackbar when testConnection resolves', async () => {
    render(<DatasourceTestConnectionButton testConnection={vi.fn().mockResolvedValue(undefined)} />);

    await userEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(mockSuccessSnackbar).toHaveBeenCalledWith('Datasource is healthy');
    });
  });

  it('shows error snackbar when testConnection rejects with an Error', async () => {
    const error = new Error('connection refused');
    render(<DatasourceTestConnectionButton testConnection={vi.fn().mockRejectedValue(error)} />);

    await userEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(mockExceptionSnackbar).toHaveBeenCalledWith(error);
    });
  });

  it('wraps non-Error rejections in a generic Error', async () => {
    render(<DatasourceTestConnectionButton testConnection={vi.fn().mockRejectedValue('string error')} />);

    await userEvent.click(screen.getByRole('button', { name: /test connection/i }));

    await waitFor(() => {
      expect(mockExceptionSnackbar).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  it('respects the disabled prop', () => {
    render(<DatasourceTestConnectionButton testConnection={vi.fn()} disabled />);
    expect(screen.getByRole('button', { name: /test connection/i })).toBeDisabled();
  });

  it('disables the button while testConnection is in flight and re-enables after', async () => {
    let resolve!: () => void;
    const mockTestConnection = vi.fn(
      () =>
        new Promise<void>((res) => {
          resolve = res;
        }),
    );
    render(<DatasourceTestConnectionButton testConnection={mockTestConnection} />);

    const button = screen.getByRole('button', { name: /test connection/i });
    await userEvent.click(button);

    // button is disabled while in flight — a second request cannot be triggered
    expect(button).toBeDisabled();
    expect(mockTestConnection).toHaveBeenCalledTimes(1);

    resolve();
    await waitFor(() => expect(button).not.toBeDisabled());
  });
});
