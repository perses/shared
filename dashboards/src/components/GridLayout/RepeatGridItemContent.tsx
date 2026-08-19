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

import { RepeatGrid } from '@perses-dev/components';
import { PanelGroupId } from '@perses-dev/plugin-system';
import { ReactNode, useMemo } from 'react';

import { calcPerPanelWidth } from '../../utils/repeatLayoutUtils';
import { PanelOptions } from '../Panel/Panel';
import { FixedValueVariableProvider } from '../Variables';
import { GridItemContent } from './GridItemContent';

interface RepeatPanelItemProps {
  panelGroupId: PanelGroupId;
  panelGroupItemLayoutId: string;
  panelRepeatVariable: {
    name: string;
    values: string[];
    maxPer: number;
  };
  groupRepeatVariable?: [string, string];
  width: number;
  itemGap: number;
  panelOptions?: PanelOptions;
  isEditMode: boolean;
  isCapped?: boolean;
}

function getRepeatPanelTooltip(
  isFirst: boolean,
  isEditMode: boolean,
  isCapped: boolean | undefined,
  repeatVariableName: string,
  value: string,
): string | undefined {
  if (!isFirst && isEditMode) {
    return `This panel is generated from the variable "${repeatVariableName}" with the value "${value}". To change panel definition, please edit the first panel.`;
  }
  if (isFirst && isCapped) {
    return `Not all values are displayed. To display more, update the repeat variable limit in the server configuration or exit full screen mode.`;
  }
  return undefined;
}

/**
 * Renders a grid item that repeats based on a variable.
 * It calculates the number of items per row and the width of each item,
 * then renders the appropriate number of GridItemContent components with the correct variable context.
 */
export function RepeatGridItemContent({
  panelGroupId,
  panelGroupItemLayoutId,
  panelRepeatVariable,
  groupRepeatVariable,
  width,
  itemGap,
  panelOptions,
  isEditMode,
  isCapped,
}: RepeatPanelItemProps): ReactNode {
  const { name: repeatVariableName, values: variableValues, maxPer: perRow } = panelRepeatVariable;

  const perPanelWidth = useMemo(() => calcPerPanelWidth(width, itemGap, perRow), [itemGap, perRow, width]);

  return (
    <RepeatGrid
      repeatItems={variableValues}
      maxPer={perRow}
      gap={itemGap}
      containerSx={{ overflow: 'hidden' }}
      rowSx={{ flex: 1, overflow: 'hidden' }}
      renderItem={(value, { rowIndex, colIndex }) => {
        const isFirst = colIndex + rowIndex === 0;
        return (
          <FixedValueVariableProvider
            key={`${repeatVariableName}-${value}`}
            variableName={repeatVariableName}
            value={value}
          >
            <GridItemContent
              panelOptions={panelOptions}
              panelGroupItemId={{
                panelGroupId,
                panelGroupItemLayoutId,
                repeatVariable: {
                  panel: [repeatVariableName, value],
                  group: groupRepeatVariable,
                },
              }}
              width={perPanelWidth}
              readonly={!isFirst}
              informationTooltip={getRepeatPanelTooltip(isFirst, isEditMode, isCapped, repeatVariableName, value)}
            />
          </FixedValueVariableProvider>
        );
      }}
    />
  );
}
