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

import { resolvePluginKeys } from './getPluginSearchHelper';

describe('resolvePluginKeys', () => {
  describe('fallback only (no version/registry in query)', () => {
    it('should return the higher version when same registry', () => {
      const keys = ['Panel:TimeSeriesChart:dev:1.0.0', 'Panel:TimeSeriesChart:dev:2.0.0'];
      expect(resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart' })).toEqual([
        'Panel:TimeSeriesChart:dev:2.0.0',
      ]);
    });

    it('should return the higher version across registries', () => {
      const keys = [
        'Panel:TimeSeriesChart:dev:2.0.0',
        'Panel:TimeSeriesChart::1.0.0',
        'Panel:TimeSeriesChartX:dev:1.0.0',
        'Panel:TimeSeriesChartX::2.0.0',
      ];

      expect(resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart' })).toEqual([
        'Panel:TimeSeriesChart:dev:2.0.0',
      ]);

      expect(resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChartX' })).toEqual([
        'Panel:TimeSeriesChartX::2.0.0',
      ]);
    });

    it('should prefer no-registry variant on version tie by default', () => {
      const keys = ['Panel:TimeSeriesChart:dev:2.0.0', 'Panel:TimeSeriesChart::2.0.0'];
      expect(resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart' })).toEqual([
        'Panel:TimeSeriesChart::2.0.0',
      ]);
    });

    it('should prefer registry variant on version tie with registryOverVersion', () => {
      const keys = ['Panel:TimeSeriesChart:dev:2.0.0', 'Panel:TimeSeriesChart::2.0.0'];
      expect(
        resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart' }, { registryOverVersion: true })
      ).toEqual(['Panel:TimeSeriesChart:dev:2.0.0']);
    });

    it('should return empty array when no match', () => {
      const keys = ['Panel:OtherChart::1.0.0'];
      expect(resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart' })).toEqual([]);
    });
  });

  describe('exact match with version/registry', () => {
    it('should return exact-match key first, then fallback', () => {
      const keys = ['Panel:TimeSeriesChart:dev:1.0.0', 'Panel:TimeSeriesChart:dev:2.0.0'];
      expect(
        resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart', version: '1.0.0', registry: 'dev' })
      ).toEqual(['Panel:TimeSeriesChart:dev:1.0.0', 'Panel:TimeSeriesChart:dev:2.0.0']);
    });

    it('should not duplicate if exact match is the same as fallback', () => {
      const keys = ['Panel:TimeSeriesChart:dev:2.0.0'];
      expect(
        resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart', version: '2.0.0', registry: 'dev' })
      ).toEqual(['Panel:TimeSeriesChart:dev:2.0.0']);
    });

    it('should include exact-match key even if it is not in allKeys', () => {
      const keys = ['Panel:TimeSeriesChart:dev:2.0.0'];
      expect(
        resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart', version: '3.0.0', registry: 'dev' })
      ).toEqual(['Panel:TimeSeriesChart:dev:3.0.0', 'Panel:TimeSeriesChart:dev:2.0.0']);
    });

    it('should return exact-match key with version only (no registry)', () => {
      const keys = ['Panel:TimeSeriesChart::1.0.0', 'Panel:TimeSeriesChart::2.0.0'];
      expect(resolvePluginKeys(keys, { kind: 'Panel', name: 'TimeSeriesChart', version: '1.0.0' })).toEqual([
        'Panel:TimeSeriesChart::1.0.0',
        'Panel:TimeSeriesChart::2.0.0',
      ]);
    });
  });
});
