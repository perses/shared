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

import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { PanelGroupId } from '@perses-dev/plugin-system';
import { ReactElement } from 'react';

import { DEFAULT_MARGIN } from '../../constants';
import { useViewPanelGroup } from '../../context';
import { PanelGroupItemId } from '../../model';
import { getPerRowCount, RepeatItemMeta } from '../../utils';
import { PanelOptions } from '../Panel/Panel';
import { GridItemContent } from './GridItemContent';
import { RepeatGridItemContent } from './RepeatGridItemContent';

interface GridItemRendererProps {
  panelGroupId: PanelGroupId;
  panelGroupItemLayoutId: string;
  width: number;
  repeatItemMeta?: RepeatItemMeta;
  groupRepeatVariable?: [string, string];
  panelOptions?: PanelOptions;
  isEditMode: boolean;
}

export function GridItemRenderer({
  panelGroupId,
  panelGroupItemLayoutId,
  width,
  repeatItemMeta,
  groupRepeatVariable,
  panelOptions,
  isEditMode,
}: GridItemRendererProps): ReactElement {
  const viewPanelItemId = useViewPanelGroup();

  const panelRepeatVariable = repeatItemMeta?.itemRepeatVariable;
  const panelVariableValues = repeatItemMeta?.values;
  const totalValues = repeatItemMeta?.totalValues ?? 0;
  const effectiveValues = viewPanelItemId?.repeatVariable?.panel
    ? [viewPanelItemId.repeatVariable.panel[1]]
    : panelVariableValues;

  const panelGroupItemId: PanelGroupItemId = {
    panelGroupId,
    panelGroupItemLayoutId,
    repeatVariable: { group: groupRepeatVariable },
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorAlert}>
      {panelRepeatVariable && effectiveValues?.length ? (
        <RepeatGridItemContent
          panelGroupId={panelGroupId}
          panelGroupItemLayoutId={panelGroupItemLayoutId}
          panelRepeatVariable={{
            name: panelRepeatVariable.value,
            values: effectiveValues,
            maxPer: getPerRowCount(panelRepeatVariable),
          }}
          groupRepeatVariable={groupRepeatVariable}
          width={width}
          itemGap={DEFAULT_MARGIN}
          panelOptions={panelOptions}
          isEditMode={isEditMode}
          isCapped={!isEditMode && effectiveValues.length < totalValues}
        />
      ) : (
        <GridItemContent panelOptions={panelOptions} panelGroupItemId={panelGroupItemId} width={width} />
      )}
    </ErrorBoundary>
  );
}
