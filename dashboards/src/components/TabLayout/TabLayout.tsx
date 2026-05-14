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
import { PanelGroupId } from '@perses-dev/spec';
import { ErrorAlert, ErrorBoundary } from '@perses-dev/components';
import { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { Layout, Layouts, Responsive, WidthProvider } from 'react-grid-layout';
import { useEditMode, usePanelGroup, useTabActions, useViewPanelGroup } from '../../context';
import {
  GRID_LAYOUT_COLS,
  GRID_LAYOUT_MARGIN,
  GRID_LAYOUT_ROW_HEIGHT,
  GRID_LAYOUT_SMALL_BREAKPOINT,
  calculateGridItemWidth,
} from '../../constants';
import { TabPanelGroup, PanelGroupItemLayout } from '../../model';
import { PanelOptions } from '../Panel';
import { GridContainer } from '../GridLayout/GridContainer';
import { GridItemContent } from '../GridLayout/GridItemContent';
import { GridTitle } from '../GridLayout/GridTitle';
import { TabBar } from './TabBar';

const ResponsiveGridLayout = WidthProvider(Responsive);

export interface TabLayoutProps {
  panelGroupId: PanelGroupId;
  panelOptions?: PanelOptions;
  panelFullHeight?: number;
}

export function TabLayout(props: TabLayoutProps): ReactElement {
  const { panelGroupId, panelOptions, panelFullHeight } = props;
  const panelGroup = usePanelGroup(panelGroupId);
  if (panelGroup.layoutKind !== 'Tabs') {
    throw new Error(`TabLayout expects a Tabs panel group, got ${panelGroup.layoutKind}`);
  }
  const groupDefinition: TabPanelGroup = panelGroup;

  const { setActiveTab, updateTabLayouts, updateTabName, setDefaultTab, addTab, removeTab, reorderTabs } =
    useTabActions(panelGroupId);
  const { isEditMode } = useEditMode();
  const viewPanelItemId = useViewPanelGroup();

  const [isOpen, setIsOpen] = useState(!groupDefinition.isCollapsed);
  const [gridColWidth, setGridColWidth] = useState(0);

  const hasViewPanel = viewPanelItemId?.panelGroupId === panelGroupId;
  const isGridDisplayed = !viewPanelItemId || hasViewPanel;

  const tabParamKey = `perses-tab-${panelGroupId}`;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlTab = params.get(tabParamKey);
    if (urlTab !== null) {
      const tabIndex = parseInt(urlTab, 10);
      if (!isNaN(tabIndex) && tabIndex >= 0 && tabIndex < groupDefinition.tabs.length) {
        setActiveTab(tabIndex);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // If view panel is in this group, expand it
  useEffect(() => {
    if (hasViewPanel) {
      setIsOpen(true);
    }
  }, [hasViewPanel]);

  const handleTabChange = useCallback(
    (index: number): void => {
      setActiveTab(index);
      const params = new URLSearchParams(window.location.search);
      params.set(tabParamKey, String(index));
      const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
      history.replaceState(null, '', newUrl);
    },
    [setActiveTab, tabParamKey]
  );

  const activeTabIndex = groupDefinition.activeTab;
  const activeTabState = groupDefinition.tabs[activeTabIndex];

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts): void => {
      const smallLayout = allLayouts[GRID_LAYOUT_SMALL_BREAKPOINT];
      if (smallLayout && !hasViewPanel) {
        updateTabLayouts(activeTabIndex, smallLayout as PanelGroupItemLayout[]);
      }
    },
    [activeTabIndex, hasViewPanel, updateTabLayouts]
  );

  const handleWidthChange = useCallback(
    (containerWidth: number, margin: [number, number], cols: number, containerPadding: [number, number]): void => {
      const marginX = margin[0];
      const marginWidth = marginX * (cols - 1);
      const containerPaddingWidth = containerPadding[0] * 2;
      setGridColWidth((containerWidth - marginWidth - containerPaddingWidth) / cols);
    },
    []
  );

  const theme = useTheme();

  // Get the active tab's item layouts
  const itemLayouts: PanelGroupItemLayout[] = useMemo(() => {
    if (!activeTabState) return [];

    if (viewPanelItemId?.panelGroupId === panelGroupId) {
      const itemLayoutViewed = viewPanelItemId.panelGroupItemLayoutId;
      return activeTabState.itemLayouts.map((itemLayout) => {
        if (itemLayout.i === itemLayoutViewed) {
          const rowTitleHeight = 40 + 8;
          return {
            h: Math.round(((panelFullHeight ?? window.innerHeight) - rowTitleHeight) / (GRID_LAYOUT_ROW_HEIGHT + GRID_LAYOUT_MARGIN)),
            i: itemLayoutViewed,
            w: 48,
            x: 0,
            y: 0,
          } as PanelGroupItemLayout;
        }
        return itemLayout;
      });
    }
    return activeTabState.itemLayouts;
  }, [activeTabState, viewPanelItemId, panelGroupId, panelFullHeight]);

  const itemLayoutViewed = hasViewPanel ? viewPanelItemId?.panelGroupItemLayoutId : undefined;

  return (
    <GridContainer
      sx={{
        display: isGridDisplayed ? 'block' : 'none',
        height: itemLayoutViewed ? `${panelFullHeight}px` : 'unset',
        overflow: itemLayoutViewed ? 'hidden' : 'unset',
      }}
    >
      {groupDefinition.title && (
        <GridTitle
          panelGroupId={panelGroupId}
          title={groupDefinition.title}
          collapse={
            groupDefinition.isCollapsed === undefined
              ? undefined
              : { isOpen: isOpen, onToggleOpen: () => setIsOpen((current) => !current) }
          }
        />
      )}
      <Collapse in={isOpen} unmountOnExit appear={false} data-testid="tab-group-content">
        <TabBar
          panelGroupId={panelGroupId}
          tabs={groupDefinition.tabs}
          activeTab={activeTabIndex}
          defaultTab={groupDefinition.defaultTab}
          isEditMode={isEditMode}
          onTabChange={handleTabChange}
          onTabRename={updateTabName}
          onTabReorder={reorderTabs}
          onSetDefaultTab={setDefaultTab}
          onAddTab={addTab}
          onRemoveTab={removeTab}
        />
        {activeTabState && (
          <ResponsiveGridLayout
            className="layout"
            breakpoints={{ [GRID_LAYOUT_SMALL_BREAKPOINT]: theme.breakpoints.values.sm, xxs: 0 }}
            cols={GRID_LAYOUT_COLS}
            rowHeight={GRID_LAYOUT_ROW_HEIGHT}
            draggableHandle=".drag-handle"
            resizeHandles={['se']}
            isDraggable={isEditMode && !hasViewPanel}
            isResizable={isEditMode && !hasViewPanel}
            margin={[GRID_LAYOUT_MARGIN, GRID_LAYOUT_MARGIN]}
            containerPadding={[0, 10]}
            layouts={{ sm: itemLayouts }}
            onLayoutChange={handleLayoutChange}
            onWidthChange={handleWidthChange}
            allowOverlap={hasViewPanel}
          >
            {itemLayouts.map(({ i, w }) => (
              <div
                key={i}
                style={{
                  display: itemLayoutViewed ? (itemLayoutViewed === i ? 'unset' : 'none') : 'unset',
                }}
              >
                <ErrorBoundary FallbackComponent={ErrorAlert}>
                  <GridItemContent
                    panelOptions={panelOptions}
                    panelGroupItemId={{ panelGroupId, panelGroupItemLayoutId: i }}
                    width={calculateGridItemWidth(w, gridColWidth)}
                  />
                </ErrorBoundary>
              </div>
            ))}
          </ResponsiveGridLayout>
        )}
      </Collapse>
    </GridContainer>
  );
}
