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

import { Collapse, useTheme } from '@mui/material';
import type { PanelGroupId } from '@perses-dev/plugin-system';
import { useVariableValues } from '@perses-dev/plugin-system';
import type { Layout } from '@snapgridjs/react';
import { GridLayout as SnapgridLayout, useContainerWidth, useResponsiveLayout } from '@snapgridjs/react';
import type { ReactElement } from 'react';
import { useMemo, useState } from 'react';

import { DEFAULT_MARGIN, GRID_LAYOUT_COLS, ROW_HEIGHT } from '../../constants';
import { useRepeatVariableMaxValues, useViewPanelGroup } from '../../context';
import type { PanelGroupDefinition, PanelGroupItemLayout } from '../../model';
import {
  buildRepeatMeta,
  compactLayout,
  decodeGridItemId,
  encodeGridItemId,
  restoreRepeatItemLayout,
} from '../../utils';
import type { PanelOptions } from '../Panel/Panel';
import { GridContainer } from './GridContainer';
import { GridItemRenderer } from './GridItemRenderer';
import { GridTitle } from './GridTitle';

const GRID_MARGIN: [number, number] = [DEFAULT_MARGIN, DEFAULT_MARGIN];
const GRID_PADDING: [number, number] = [0, 10];
const DRAG_CONFIG = { handle: '.drag-handle' };
// Editing uses persisted coordinates at every width so a resize survives the next render.
const EDIT_GRID_COLS = { sm: GRID_LAYOUT_COLS.sm, xxs: GRID_LAYOUT_COLS.sm };

export interface RowProps {
  panelGroupId: PanelGroupId;
  groupDefinition: PanelGroupDefinition;
  panelFullHeight?: number;
  panelOptions?: PanelOptions;
  isEditMode?: boolean;
  onLayoutChange?: (layout: PanelGroupItemLayout[]) => void;
  repeatVariable?: [string, string];
}

export function Row({
  panelGroupId,
  groupDefinition,
  panelFullHeight,
  panelOptions,
  isEditMode = false,
  onLayoutChange,
  repeatVariable,
}: RowProps): ReactElement {
  const { width, containerRef } = useContainerWidth();
  const theme = useTheme();
  const viewPanelItemId = useViewPanelGroup();
  const variableValues = useVariableValues();
  const repeatVariableMaxValues = useRepeatVariableMaxValues();

  const [isOpen, setIsOpen] = useState(!groupDefinition.isCollapsed);

  const { expandedItemLayouts, repeatMeta } = useMemo(
    () =>
      buildRepeatMeta(
        groupDefinition.itemLayouts,
        variableValues,
        repeatVariable,
        repeatVariableMaxValues || undefined,
      ),
    [groupDefinition.itemLayouts, repeatVariable, variableValues, repeatVariableMaxValues],
  );

  const hasViewPanel =
    viewPanelItemId?.panelGroupId === panelGroupId &&
    // Check for repeatVariable panels
    viewPanelItemId.repeatVariable?.group?.[0] === repeatVariable?.[0] &&
    viewPanelItemId.repeatVariable?.group?.[1] === repeatVariable?.[1];
  const itemLayoutViewed = viewPanelItemId?.panelGroupItemLayoutId;

  // If there is a panel in view mode, we should hide the grid if the panel is not in the current group.
  const isGridDisplayed = !viewPanelItemId || hasViewPanel;

  // Item layout is override if there is a panel in view mode
  const itemLayouts: PanelGroupItemLayout[] = useMemo(() => {
    if (itemLayoutViewed) {
      const viewedItem = expandedItemLayouts.find((item) => item.i === itemLayoutViewed);
      if (!viewedItem) return [];
      const rowTitleHeight = 40 + 8; // 40 is the height of the row title and 8 is the margin height
      return [
        {
          ...viewedItem,
          h: Math.max(
            1,
            Math.round(((panelFullHeight ?? window.innerHeight) - rowTitleHeight) / (ROW_HEIGHT + DEFAULT_MARGIN)),
          ),
          w: GRID_LAYOUT_COLS.sm,
          x: 0,
          y: 0,
        },
      ];
    }
    // Snapgrid renders a controlled layout as-is: resolve overlaps caused by expanded repeat panels.
    return compactLayout(expandedItemLayouts);
  }, [expandedItemLayouts, itemLayoutViewed, panelFullHeight]);

  const layouts = useMemo(
    () => ({ sm: itemLayouts.map((item) => ({ ...item, i: encodeGridItemId(item.i, repeatVariable) })) }),
    [itemLayouts, repeatVariable],
  );
  const breakpoints = useMemo(() => ({ sm: theme.breakpoints.values.sm, xxs: 0 }), [theme.breakpoints.values.sm]);
  const { layout: responsiveLayout, cols } = useResponsiveLayout({
    width,
    layouts,
    breakpoints,
    cols: isEditMode ? EDIT_GRID_COLS : GRID_LAYOUT_COLS,
  });
  // Column width in px (margins and padding excluded); panels derive their suggested step from it.
  const gridColWidth = (width - GRID_MARGIN[0] * (cols - 1) - GRID_PADDING[0] * 2) / cols;
  const gridConfig = useMemo(
    () => ({ cols, rowHeight: ROW_HEIGHT, margin: GRID_MARGIN, containerPadding: GRID_PADDING }),
    [cols],
  );

  const handleLayoutChange = useMemo(() => {
    if (!onLayoutChange) return undefined;
    return (currentLayout: Layout): void => {
      const canonicalLayout = currentLayout.map((item) => {
        const id = decodeGridItemId(item.i);
        const layout: PanelGroupItemLayout = {
          ...item,
          i: id,
        };
        const meta = repeatMeta.get(id);
        return meta ? restoreRepeatItemLayout(layout, meta) : layout;
      });
      onLayoutChange(canonicalLayout);
    };
  }, [onLayoutChange, repeatMeta]);

  // Keep later groups stationary while Snapgrid previews removing a tile from this group.
  const gridStyle = useMemo(
    () =>
      isEditMode
        ? {
            minHeight: Math.max(
              ROW_HEIGHT * 3,
              responsiveLayout.reduce((bottom, item) => Math.max(bottom, item.y + item.h), 0) *
                (ROW_HEIGHT + DEFAULT_MARGIN) -
                DEFAULT_MARGIN +
                GRID_PADDING[1] * 2,
            ),
          }
        : undefined,
    [isEditMode, responsiveLayout],
  );

  const containerSx = useMemo(
    () => ({
      display: isGridDisplayed ? 'block' : 'none',
      height: itemLayoutViewed ? `${panelFullHeight}px` : 'unset',
      overflow: itemLayoutViewed ? 'hidden' : 'unset',
    }),
    [isGridDisplayed, itemLayoutViewed, panelFullHeight],
  );
  const collapse = useMemo(
    () =>
      groupDefinition.isCollapsed === undefined
        ? undefined
        : {
            isOpen: isOpen || hasViewPanel,
            onToggleOpen: (): void => setIsOpen((current) => !current),
          },
    [groupDefinition.isCollapsed, isOpen, hasViewPanel],
  );

  return (
    <GridContainer sx={containerSx}>
      {groupDefinition.title && (
        <GridTitle
          panelGroupId={panelGroupId}
          title={groupDefinition.title}
          panelCount={groupDefinition.itemLayouts.length}
          collapse={collapse}
        />
      )}
      <Collapse in={isOpen || hasViewPanel} unmountOnExit appear={false} data-testid="panel-group-content">
        <div ref={containerRef}>
          <SnapgridLayout
            width={width}
            className="layout"
            gridConfig={gridConfig}
            dragConfig={DRAG_CONFIG}
            isDraggable={isEditMode && !hasViewPanel}
            isResizable={isEditMode && !hasViewPanel}
            layout={responsiveLayout}
            onLayoutChange={handleLayoutChange}
            style={gridStyle}
          >
            {itemLayouts.map(({ i, w }) => (
              <div key={encodeGridItemId(i, repeatVariable)}>
                <GridItemRenderer
                  panelGroupId={panelGroupId}
                  panelGroupItemLayoutId={i}
                  width={calculateGridItemWidth(Math.min(w, cols), gridColWidth)}
                  repeatItemMeta={repeatMeta.get(i)}
                  groupRepeatVariable={repeatVariable}
                  panelOptions={panelOptions}
                  isEditMode={isEditMode}
                />
              </div>
            ))}
          </SnapgridLayout>
        </div>
      </Collapse>
    </GridContainer>
  );
}

const calculateGridItemWidth = (w: number, colWidth: number): number => {
  // 0 * Infinity === NaN, which causes problems with resize constraints
  if (!Number.isFinite(w)) return w;
  return Math.round(colWidth * w + Math.max(0, w - 1) * DEFAULT_MARGIN);
};
