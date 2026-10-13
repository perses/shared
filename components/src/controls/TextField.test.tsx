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

import { act, fireEvent, render, screen } from '@testing-library/react';

import { TextField } from './TextField';

it('debounces changes and cancels pending callbacks when unmounted', () => {
  vi.useFakeTimers();
  const onChange = vi.fn();
  try {
    const { unmount } = render(<TextField label="Query" value="" onChange={onChange} debounceMs={250} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Query' }), { target: { value: 'up' } });
    expect(screen.getByRole('textbox')).toHaveValue('up');
    expect(onChange).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(250));
    expect(onChange).toHaveBeenCalledWith('up');
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'rate(up[5m])' } });
    unmount();
    act(() => vi.runAllTimers());
    expect(onChange).toHaveBeenCalledTimes(1);
  } finally {
    vi.useRealTimers();
  }
});

it('delivers pending input to the latest callback without restarting the debounce', () => {
  vi.useFakeTimers();
  const originalOnChange = vi.fn();
  const latestOnChange = vi.fn();
  try {
    const { rerender } = render(<TextField label="Query" value="" onChange={originalOnChange} debounceMs={250} />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'rate(up[5m])' } });
    act(() => vi.advanceTimersByTime(200));
    rerender(<TextField label="Query" value="" onChange={latestOnChange} debounceMs={250} />);

    expect(screen.getByRole('textbox')).toHaveValue('rate(up[5m])');
    act(() => vi.advanceTimersByTime(50));
    expect(originalOnChange).not.toHaveBeenCalled();
    expect(latestOnChange).toHaveBeenCalledExactlyOnceWith('rate(up[5m])');
  } finally {
    vi.useRealTimers();
  }
});
