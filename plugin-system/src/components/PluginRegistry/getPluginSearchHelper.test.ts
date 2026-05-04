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

import { lookUpDefaultPluginKey } from './getPluginSearchHelper';

describe('getPluginSearchHelper', () => {
  describe('same registers but different versions', () => {
    const keys: string[] = ['Panel:TimeSeriesChart:dev:1.0.0', 'Panel:TimeSeriesChart:dev:2.0.0'];
    it('should take the higher version', () => {
      expect(lookUpDefaultPluginKey(keys, { kind: 'Panel', name: 'TimeSeriesChart' })).toBe(
        'Panel:TimeSeriesChart:dev:2.0.0'
      );
    });
  });

  describe('with and without registry, versions race', () => {
    const keys: string[] = [
      'Panel:TimeSeriesChart:dev:2.0.0',
      'Panel:TimeSeriesChart::1.0.0',
      'Panel:TimeSeriesChartX:dev:1.0.0',
      'Panel:TimeSeriesChartX::2.0.0',
    ];

    it('should take the higher version', () => {
      expect(lookUpDefaultPluginKey(keys, { kind: 'Panel', name: 'TimeSeriesChart' })).toBe(
        'Panel:TimeSeriesChart:dev:2.0.0'
      );

      expect(lookUpDefaultPluginKey(keys, { kind: 'Panel', name: 'TimeSeriesChartX' })).toBe(
        'Panel:TimeSeriesChartX::2.0.0'
      );
    });
  });

  describe('with and without registry - same versions - check policy', () => {
    const keys: string[] = ['Panel:TimeSeriesChart:dev:2.0.0', 'Panel:TimeSeriesChart::2.0.0'];
    it('should return the one without the registry by default', () => {
      expect(lookUpDefaultPluginKey(keys, { kind: 'Panel', name: 'TimeSeriesChart' })).toBe(
        'Panel:TimeSeriesChart::2.0.0'
      );
    });

    it('should return the one with the registry', () => {
      expect(
        lookUpDefaultPluginKey(keys, { kind: 'Panel', name: 'TimeSeriesChart' }, { registryOverVersion: true })
      ).toBe('Panel:TimeSeriesChart:dev:2.0.0');
    });
  });
});
