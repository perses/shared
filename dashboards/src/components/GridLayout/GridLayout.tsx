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

import type { PanelGroupId } from '@perses-dev/plugin-system';
import { useVariableValues } from '@perses-dev/plugin-system';
import type { ReactElement } from 'react';
import { useCallback } from 'react';

import { useEditMode, usePanelGroup, usePanelGroupActions, useViewPanelGroup } from '../../context';
import type { PanelGroupDefinition, PanelGroupItemLayout } from '../../model';
import { isPanelGroupVisible, visibilityNotice } from '../../utils';
import type { PanelOptions } from '../Panel';
import { FixedValueVariableProvider } from '../Variables';
import type { RowProps } from './Row';
import { Row } from './Row';

export interface GridLayoutProps {
  panelGroupId: PanelGroupId;
  panelOptions?: PanelOptions;
  panelFullHeight?: number;
}

/**
 * Layout component that arranges children in a Grid based on the definition.
 */
export function GridLayout(props: GridLayoutProps): ReactElement | null {
  const { panelGroupId, panelOptions, panelFullHeight } = props;
  const groupDefinition: PanelGroupDefinition = usePanelGroup(panelGroupId);
  const { updatePanelGroupLayouts } = usePanelGroupActions(panelGroupId);
  const viewPanelItemId = useViewPanelGroup();
  const { isEditMode } = useEditMode();
  const variableValues = useVariableValues();

  const hasViewPanel = viewPanelItemId?.panelGroupId === panelGroupId; // current panelGroup contains the panel extended?

  const handleLayoutChange = useCallback(
    (layout: PanelGroupItemLayout[]): void => {
      if (isEditMode && !hasViewPanel) {
        updatePanelGroupLayouts(layout);
      }
    },
    [hasViewPanel, isEditMode, updatePanelGroupLayouts],
  );

  // Edit mode keeps hidden groups reachable.
  if (!isEditMode && !isPanelGroupVisible(groupDefinition.visibility, variableValues)) {
    return null;
  }
  const notice =
    isEditMode && groupDefinition.visibility ? visibilityNotice(groupDefinition.visibility, variableValues) : undefined;

  return (
    <>
      {!groupDefinition.repeatVariable ? (
        <Row
          panelGroupId={panelGroupId}
          groupDefinition={groupDefinition}
          panelFullHeight={panelFullHeight}
          panelOptions={panelOptions}
          isEditMode={isEditMode}
          onLayoutChange={handleLayoutChange}
          visibilityNotice={notice}
        />
      ) : (
        <RepeatGridLayout
          repeatVariableName={groupDefinition.repeatVariable}
          panelGroupId={panelGroupId}
          groupDefinition={groupDefinition}
          panelFullHeight={panelFullHeight}
          panelOptions={panelOptions}
          isEditMode={isEditMode}
          onLayoutChange={handleLayoutChange}
          visibilityNotice={notice}
        />
      )}
    </>
  );
}

export interface RepeatGridLayoutProps extends RowProps {
  repeatVariableName: string;
}

/**
 * Renders a grid layout for a repeated variable, where each value of the variable will create a new row.
 */
export function RepeatGridLayout({
  repeatVariableName,
  panelGroupId,
  groupDefinition,
  panelFullHeight,
  panelOptions,
  isEditMode = false,
  onLayoutChange,
}: RepeatGridLayoutProps): ReactElement | null {
  const variables = useVariableValues();
  const variable = variables[repeatVariableName];

  // If the variable is not defined, or if it is defined but has no values, render a standard row without repeating
  if (variable === undefined || !Array.isArray(variable.value) || variable.value.length === 0) {
    return (
      <Row
        panelGroupId={panelGroupId}
        groupDefinition={groupDefinition}
        panelFullHeight={panelFullHeight}
        panelOptions={panelOptions}
        isEditMode={isEditMode}
        onLayoutChange={onLayoutChange}
      />
    );
  }

  return (
    <>
      {variable.value.map((value) => (
        <FixedValueVariableProvider
          key={`${repeatVariableName}-${value}`}
          variableName={repeatVariableName}
          value={value}
        >
          <Row
            panelGroupId={panelGroupId}
            groupDefinition={groupDefinition}
            panelFullHeight={panelFullHeight}
            panelOptions={panelOptions}
            isEditMode={isEditMode}
            onLayoutChange={onLayoutChange}
            repeatVariable={[repeatVariableName, value]}
          />
        </FixedValueVariableProvider>
      ))}
    </>
  );
}
