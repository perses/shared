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

import { ReactElement, useMemo } from 'react';
import { useVariableValues, VariableContext } from '@perses-dev/plugin-system';
import { GridItemContent, PanelOptions } from '@perses-dev/dashboards';
import { PanelGroupId } from '@perses-dev/spec';
import { Box } from '@mui/material';

interface RepeatPanelItemProps {
  panelGroupId: PanelGroupId;
  panelGroupItemLayoutId: string;
  panelRepeatVariable: {
    name: string;
    values: string[];
    maxPer?: number;
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
}: RepeatPanelItemProps): ReactElement {
  const { name: repeatVariableName, values: variableValues, maxPer } = panelRepeatVariable;
  const variables = useVariableValues();
  const perRow = useMemo(() => {
    const maxPerRow = maxPer ?? variableValues.length;
    if (variableValues.length < maxPerRow) {
      return variableValues.length;
    }
    return maxPerRow;
  }, [maxPer, variableValues.length]);
  const rows: string[][] = useMemo(() => {
    const result: string[][] = [];
    for (let i = 0; i < variableValues.length; i += perRow) {
      result.push(variableValues.slice(i, i + perRow));
    }
    return result;
  }, [variableValues, perRow]);
  const perPanelWidth = Math.floor((width - itemGap * (perRow - 1)) / perRow);

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        gap: `${itemGap}px`,
        overflow: 'hidden',
      }}
    >
      {rows.map((rowValues, rowIndex) => (
        <Box key={rowIndex} sx={{ display: 'flex', flex: 1, gap: `${itemGap}px`, overflow: 'hidden' }}>
          {rowValues.map((value, index) => {
            const isNotFirst = index + rowIndex !== 0;
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
          })}
        </Box>
      ))}
    </Box>
  );
}
