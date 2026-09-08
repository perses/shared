// Copyright The Perses Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import type { Exemplar, Labels } from '@perses-dev/spec';
import { fireEvent, render, screen } from '@testing-library/react';

import type { CursorCoordinates } from '../TimeSeriesTooltip/tooltip-model';
import { ExemplarMetadataTooltip } from './ExemplarMetadataTooltip';

const seriesLabels: Labels = {
  __name__: 'http_requests_total',
  job: 'demo',
};

const exemplar: Exemplar = {
  labels: { trace_id: 'abc-123', span_id: 'def-456' },
  value: 42,
  timestamp: 1700000000000,
};

const pinnedPos: CursorCoordinates = {
  page: { x: 10, y: 10 },
  client: { x: 10, y: 10 },
  plotCanvas: { x: 10, y: 10 },
  target: null,
};

describe('ExemplarMetadataTooltip', () => {
  const onUnpinClick = vi.fn();

  const renderComponent = (props?: Partial<React.ComponentProps<typeof ExemplarMetadataTooltip>>): void => {
    render(
      <ExemplarMetadataTooltip
        exemplar={exemplar}
        seriesLabels={seriesLabels}
        pinnedPos={pinnedPos}
        onUnpinClick={onUnpinClick}
        {...props}
      />,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders exemplar labels, series labels, value and timestamp when pinned', () => {
    renderComponent();
    expect(screen.getByText('Exemplar labels')).toBeVisible();
    expect(screen.getByText('trace_id:')).toBeVisible();
    expect(screen.getByText('abc-123')).toBeVisible();
    expect(screen.getByText('Series labels')).toBeVisible();
    expect(screen.getByText('http_requests_total')).toBeVisible();
    expect(screen.getByText('42')).toBeVisible();
  });

  it('renders while following the mouse when not pinned', () => {
    renderComponent({ pinnedPos: null });
    expect(screen.queryByText('Exemplar labels')).not.toBeInTheDocument();
    fireEvent.mouseMove(window, { pageX: 10, pageY: 10, clientX: 10, clientY: 10 });
    expect(screen.getByText('Exemplar labels')).toBeVisible();
  });

  it('shows the unpin affordance and calls onUnpinClick when the pin icon is clicked', () => {
    renderComponent();
    expect(screen.getByText('Click chart to unpin')).toBeVisible();
    fireEvent.click(screen.getByTestId('PinIcon'));
    expect(onUnpinClick).toHaveBeenCalledTimes(1);
  });

  it('does not render a series labels section when seriesLabels is undefined', () => {
    renderComponent({ seriesLabels: undefined });
    expect(screen.queryByText('Series labels')).not.toBeInTheDocument();
    expect(screen.getByText('Exemplar labels')).toBeVisible();
  });
});
