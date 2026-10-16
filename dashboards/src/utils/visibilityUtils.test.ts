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

import type { VariableStateMap } from '@perses-dev/plugin-system';
import type { Visibility } from '@perses-dev/spec';

import { isPanelGroupVisible } from './visibilityUtils';

const visibility = { variable: 'phase', value: ['DEV', 'TST'] };

describe('isPanelGroupVisible', () => {
  it('is visible without visibility', () => {
    expect(isPanelGroupVisible(undefined, {})).toBe(true);
  });

  it('is visible when a single value matches', () => {
    const variables: VariableStateMap = { phase: { value: 'DEV', loading: false } };
    expect(isPanelGroupVisible(visibility, variables)).toBe(true);
  });

  it('is hidden when a single value does not match', () => {
    const variables: VariableStateMap = { phase: { value: 'PRD', loading: false } };
    expect(isPanelGroupVisible(visibility, variables)).toBe(false);
  });

  it('is visible when any selected value matches', () => {
    const variables: VariableStateMap = { phase: { value: ['PRD', 'TST'], loading: false } };
    expect(isPanelGroupVisible(visibility, variables)).toBe(true);
  });

  it('is hidden when no selected value matches', () => {
    const variables: VariableStateMap = { phase: { value: ['PRD', 'UAT'], loading: false } };
    expect(isPanelGroupVisible(visibility, variables)).toBe(false);
  });

  it('is hidden when the selection is empty or null', () => {
    expect(isPanelGroupVisible(visibility, { phase: { value: [], loading: false } })).toBe(false);
    expect(isPanelGroupVisible(visibility, { phase: { value: null, loading: false } })).toBe(false);
  });

  it('is hidden when the variable is unknown', () => {
    expect(isPanelGroupVisible(visibility, {})).toBe(false);
  });

  it('is hidden while the variable is loading', () => {
    const variables: VariableStateMap = { phase: { value: 'DEV', loading: true } };
    expect(isPanelGroupVisible(visibility, variables)).toBe(false);
  });

  it('matches values exactly', () => {
    const variables: VariableStateMap = { phase: { value: 'dev', loading: false } };
    expect(isPanelGroupVisible(visibility, variables)).toBe(false);
  });

  describe('notEquals', () => {
    const notPrd: Visibility = { variable: 'phase', operator: 'notEquals', value: ['PRD'] };

    it('is visible when no selected value is listed', () => {
      expect(isPanelGroupVisible(notPrd, { phase: { value: 'DEV', loading: false } })).toBe(true);
      expect(isPanelGroupVisible(notPrd, { phase: { value: ['DEV', 'TST'], loading: false } })).toBe(true);
    });

    it('is hidden when a selected value is listed', () => {
      expect(isPanelGroupVisible(notPrd, { phase: { value: 'PRD', loading: false } })).toBe(false);
      expect(isPanelGroupVisible(notPrd, { phase: { value: ['DEV', 'PRD'], loading: false } })).toBe(false);
    });

    it('is hidden while the variable is loading or unknown', () => {
      expect(isPanelGroupVisible(notPrd, { phase: { value: 'DEV', loading: true } })).toBe(false);
      expect(isPanelGroupVisible(notPrd, {})).toBe(false);
    });
  });

  describe('matches', () => {
    const devLike: Visibility = { variable: 'phase', operator: 'matches', value: ['DEV.*', 'TST'] };

    it('is visible when a selected value matches a pattern', () => {
      expect(isPanelGroupVisible(devLike, { phase: { value: 'DEV2', loading: false } })).toBe(true);
      expect(isPanelGroupVisible(devLike, { phase: { value: ['PRD', 'TST'], loading: false } })).toBe(true);
    });

    it('anchors the patterns', () => {
      expect(isPanelGroupVisible(devLike, { phase: { value: 'MYDEV', loading: false } })).toBe(false);
      expect(isPanelGroupVisible(devLike, { phase: { value: 'TSTX', loading: false } })).toBe(false);
    });

    it('treats an alternation as a whole', () => {
      const alternation: Visibility = { variable: 'phase', operator: 'matches', value: ['DEV|TST'] };
      expect(isPanelGroupVisible(alternation, { phase: { value: 'TST', loading: false } })).toBe(true);
      expect(isPanelGroupVisible(alternation, { phase: { value: 'DEVTST', loading: false } })).toBe(false);
    });

    it('ignores an invalid pattern', () => {
      const invalid: Visibility = { variable: 'phase', operator: 'matches', value: ['('] };
      expect(isPanelGroupVisible(invalid, { phase: { value: 'DEV', loading: false } })).toBe(false);
    });
  });

  describe('notMatches', () => {
    const notPrd: Visibility = { variable: 'phase', operator: 'notMatches', value: ['PRD.*'] };

    it('is visible when no selected value matches', () => {
      expect(isPanelGroupVisible(notPrd, { phase: { value: ['DEV', 'TST'], loading: false } })).toBe(true);
    });

    it('is hidden when a selected value matches', () => {
      expect(isPanelGroupVisible(notPrd, { phase: { value: ['DEV', 'PRD2'], loading: false } })).toBe(false);
    });
  });
});
