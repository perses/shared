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

import { Box, IconButton, Tab, Tabs, Tooltip } from '@mui/material';
import { PanelGroupId } from '@perses-dev/spec';
import ArrowLeftIcon from 'mdi-material-ui/ArrowLeft';
import ArrowRightIcon from 'mdi-material-ui/ArrowRight';
import DeleteIcon from 'mdi-material-ui/DeleteOutline';
import PencilIcon from 'mdi-material-ui/PencilOutline';
import PlusIcon from 'mdi-material-ui/Plus';
import { ReactElement, SyntheticEvent, useCallback, useState } from 'react';
import { TabState } from '../../model';
import { TabEditorDialog } from './TabEditorDialog';

const TAB_HEIGHT = 49;

export interface TabBarProps {
  panelGroupId: PanelGroupId;
  tabs: TabState[];
  activeTab: number;
  defaultTab: number;
  isEditMode: boolean;
  onTabChange: (index: number) => void;
  onTabRename?: (tabIndex: number, name: string) => void;
  onTabReorder?: (fromIndex: number, toIndex: number) => void;
  onSetDefaultTab?: (tabIndex: number) => void;
  onAddTab?: (name: string) => void;
  onRemoveTab?: (tabIndex: number) => void;
}

export function TabBar(props: TabBarProps): ReactElement {
  const {
    tabs,
    activeTab,
    defaultTab,
    isEditMode,
    onTabChange,
    onTabRename,
    onTabReorder,
    onSetDefaultTab,
    onAddTab,
    onRemoveTab,
  } = props;

  const [editingTabIndex, setEditingTabIndex] = useState<number | null>(null);

  const handleChange = (_event: SyntheticEvent, newValue: number): void => {
    onTabChange(newValue);
  };

  const handleAddTab = useCallback((): void => {
    const newName = `Tab ${tabs.length + 1}`;
    onAddTab?.(newName);
  }, [tabs.length, onAddTab]);

  const handleDialogSubmit = useCallback(
    (name: string, isDefault: boolean): void => {
      if (editingTabIndex === null) return;
      onTabRename?.(editingTabIndex, name);
      if (isDefault && editingTabIndex !== defaultTab) {
        onSetDefaultTab?.(editingTabIndex);
      }
    },
    [editingTabIndex, defaultTab, onTabRename, onSetDefaultTab]
  );

  const editingTab = editingTabIndex !== null ? tabs[editingTabIndex] : undefined;

  if (!isEditMode) {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }} data-testid="tab-bar">
        <Tabs value={activeTab} onChange={handleChange} aria-label="panel group tabs" sx={{ minHeight: TAB_HEIGHT }}>
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              label={tab.name}
              iconPosition="end"
              data-testid={`tab-${index}`}
              sx={{ minHeight: TAB_HEIGHT }}
            />
          ))}
        </Tabs>
      </Box>
    );
  }

  return (
    <Box sx={{ borderBottom: 1, borderColor: 'divider' }} data-testid="tab-bar">
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Tabs
          value={activeTab}
          onChange={handleChange}
          aria-label="panel group tabs"
          sx={{ flex: 1, minHeight: TAB_HEIGHT }}
          variant="scrollable"
          scrollButtons="auto"
        >
          {tabs.map((tab, index) => (
            <Tab
              key={index}
              data-testid={`tab-${index}`}
              sx={{ minHeight: TAB_HEIGHT }}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <span data-testid={`tab-name-${index}`}>{tab.name}</span>
                  <Tooltip title="Edit tab">
                    <IconButton
                      component="span"
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTabIndex(index);
                      }}
                      data-testid={`tab-edit-${index}`}
                      aria-label={`Edit ${tab.name}`}
                    >
                      <PencilIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Move left">
                    <span>
                      <IconButton
                        component="span"
                        size="small"
                        disabled={index === 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTabReorder?.(index, index - 1);
                        }}
                        data-testid={`tab-move-left-${index}`}
                        aria-label={`Move ${tab.name} left`}
                      >
                        <ArrowLeftIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Move right">
                    <span>
                      <IconButton
                        component="span"
                        size="small"
                        disabled={index === tabs.length - 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onTabReorder?.(index, index + 1);
                        }}
                        data-testid={`tab-move-right-${index}`}
                        aria-label={`Move ${tab.name} right`}
                      >
                        <ArrowRightIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="Delete tab">
                    <span>
                      <IconButton
                        component="span"
                        size="small"
                        disabled={tabs.length <= 1}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTab?.(index);
                        }}
                        data-testid={`tab-delete-${index}`}
                        aria-label={`Delete ${tab.name}`}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              }
            />
          ))}
        </Tabs>
        <Tooltip title="Add tab">
          <IconButton onClick={handleAddTab} data-testid="tab-add" aria-label="Add tab" sx={{ ml: 1 }}>
            <PlusIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <TabEditorDialog
        open={editingTabIndex !== null}
        tabName={editingTab?.name ?? ''}
        isDefault={editingTabIndex === defaultTab}
        onSubmit={handleDialogSubmit}
        onClose={() => setEditingTabIndex(null)}
      />
    </Box>
  );
}
