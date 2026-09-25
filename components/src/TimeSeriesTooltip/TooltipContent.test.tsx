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

import { screen } from '@testing-library/dom';
import { render } from '@testing-library/react';

import { EMPHASIZED_SERIES_DESCRIPTION, NEARBY_SERIES_DESCRIPTION } from './tooltip-model';
import type { TooltipContentProps } from './TooltipContent';
import { TooltipContent } from './TooltipContent';
import type { NearbySeriesArray } from './types';

const series: NearbySeriesArray = [
  {
    seriesIdx: 1,
    datumIdx: 23,
    seriesName: 'Requests',
    date: 100,
    x: 100,
    y: 1,
    formattedY: '1',
    markerColor: 'red',
    isClosestToCursor: false,
  },
];

const nextSeries = series.map((item) =>
  Object.assign({}, item, { datumIdx: 24, date: 200, x: 200, y: 2, formattedY: '2' }),
);

describe('TooltipContent', () => {
  it('keeps series rows mounted when the hovered timestamp changes', () => {
    const { rerender } = render(<TooltipContent series={series} />);
    const label = screen.getByText('Requests');
    rerender(<TooltipContent series={nextSeries} />);
    expect(screen.getByText('Requests')).toBe(label);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  const renderComponent = (props: TooltipContentProps): void => {
    render(<TooltipContent {...props} />);
  };

  it('should display a single series name', () => {
    const tooltipContent: TooltipContentProps = {
      series: [
        {
          seriesIdx: 0,
          datumIdx: 84,
          seriesName: 'Test node demo.do.prometheus.io:9100',
          date: 1671803580000,
          x: 1671821580000,
          y: 0.1,
          formattedY: '0.1',
          markerColor: 'hsla(19838016,50%,50%,0.8)',
          isClosestToCursor: false,
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('Test node demo.do.prometheus.io:9100')).toBeInTheDocument();
    expect(screen.getByText('0.1')).toBeInTheDocument();
  });

  it('should display multiple series data', () => {
    const tooltipContent: TooltipContentProps = {
      series: [
        {
          seriesIdx: 2,
          datumIdx: 48,
          seriesName: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 1671803040000,
          x: 1671821040000,
          y: 84635648,
          formattedY: '84.64M',
          markerColor: 'hsla(1887856572,50%,50%,0.8)',
          isClosestToCursor: false,
        },
        {
          seriesIdx: 1,
          datumIdx: 48,
          seriesName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 1671803040000,
          x: 1671821040000,
          y: 33771520,
          formattedY: '33.77M',
          markerColor: 'hsla(158479636,50%,50%,0.8)',
          isClosestToCursor: false,
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    expect(screen.getByText('84.64M')).toBeInTheDocument();
    expect(screen.getByText('33.77M')).toBeInTheDocument();
    expect(
      screen.getAllByText('node_memory_Buffers_bytes{env="demo", instance="demo.do.prometheus.io:9100", job="node"}'),
    ).toHaveLength(1);
    expect(
      screen.getAllByText('node_memory_MemFree_bytes{env="demo", instance="demo.do.prometheus.io:9100", job="node"}'),
    ).toHaveLength(1);
  });

  it('should display query before wrapped labels with correct series font weights', () => {
    const tooltipContent: TooltipContentProps = {
      series: [
        {
          seriesIdx: 2,
          datumIdx: 48,
          seriesName: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 1671803040000,
          x: 1671821040000,
          y: 84635648,
          formattedY: '84.64M',
          markerColor: 'hsla(1887856572,50%,50%,0.8)',
          isClosestToCursor: false,
        },
        {
          seriesIdx: 1,
          datumIdx: 48,
          seriesName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 1671803040000,
          x: 1671821040000,
          y: 33771520,
          formattedY: '33.77M',
          markerColor: 'hsla(158479636,50%,50%,0.8)',
          isClosestToCursor: false,
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    expect(
      screen.getByText('node_memory_MemFree_bytes{env="demo", instance="demo.do.prometheus.io:9100", job="node"}'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('node_memory_Buffers_bytes{env="demo", instance="demo.do.prometheus.io:9100", job="node"}'),
    ).toBeInTheDocument();
    expect(screen.queryByText(EMPHASIZED_SERIES_DESCRIPTION)).not.toBeInTheDocument();
    expect(screen.getAllByLabelText(NEARBY_SERIES_DESCRIPTION)).toHaveLength(2);
  });

  it('should display series closest to cursor as bold', () => {
    const tooltipContent: TooltipContentProps = {
      series: [
        {
          seriesIdx: 2,
          datumIdx: 48,
          seriesName: 'node_memory_MemFree_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 1671803040000,
          x: 1671821040000,
          y: 84635648,
          formattedY: '84.64M',
          markerColor: 'hsla(1887856572,50%,50%,0.8)',
          isClosestToCursor: true,
        },
        {
          seriesIdx: 1,
          datumIdx: 48,
          seriesName: 'node_memory_Buffers_bytes{env="demo",instance="demo.do.prometheus.io:9100",job="node"}',
          date: 1671803040000,
          x: 1671821040000,
          y: 33771520,
          formattedY: '33.77M',
          markerColor: 'hsla(158479636,50%,50%,0.8)',
          isClosestToCursor: false,
        },
      ],
      wrapLabels: true,
    };
    renderComponent(tooltipContent);
    const boldSeriesText = screen.getByLabelText(EMPHASIZED_SERIES_DESCRIPTION);
    expect(boldSeriesText).toBeInTheDocument();
    const regularSeriesText = screen.getByLabelText(NEARBY_SERIES_DESCRIPTION);
    expect(regularSeriesText).toBeInTheDocument();
  });
});
