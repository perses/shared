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

import { ReactNode, useMemo } from 'react';
import { useVariableValues, VariableContext } from '@perses-dev/plugin-system';
import { PanelGroupId } from '@perses-dev/spec';
import { Box } from '@mui/material';
import { RepeatGrid } from '@perses-dev/components';
import { PanelOptions } from '../Panel/Panel';
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
}: RepeatPanelItemProps): ReactNode {
  const { name: repeatVariableName, values: variableValues, maxPer: perRow } = panelRepeatVariable;
  const variables = useVariableValues();

  const rows: string[][] = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < variableValues.length; i += perRow) {
      result.push(variableValues.slice(i, i + perRow));
    }
    return result;
  }, [variableValues, perRow]);
  const perPanelWidth = useMemo(() => Math.floor((width - itemGap * (perRow - 1)) / perRow), [itemGap, perRow, width]);

  return (
    <RepeatGrid
      rows={rows}
      gap={itemGap}
      containerSx={{ overflow: 'hidden' }}
      rowSx={{ flex: 1, overflow: 'hidden' }}
      renderItem={(value, rowIndex, colIndex) => {
        const isNotFirst = colIndex + rowIndex !== 0;
        return (
          <VariableContext.Provider
            key={`${repeatVariableName}-${value}`}
            value={{
              state: {
                ...variables,
                [repeatVariableName]: { ...variables[repeatVariableName], value, loading: false },
              },
            }}
          >
            <Box sx={{ width: perPanelWidth, overflow: 'hidden' }}>
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
                readonly={isNotFirst}
                informationTooltip={
                  isNotFirst && isEditMode
                    ? `This panel is generated from the variable "${repeatVariableName}" with the value "${value}". To change panel definition, please edit the first panel.`
                    : undefined
                }
              />
            </Box>
          </VariableContext.Provider>
        );
      }}
    />
  );
}
