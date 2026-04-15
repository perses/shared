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

import { ReactElement, ReactNode, useState } from 'react';
import { Box } from '@mui/material';
import { ChartsProvider, ErrorAlert, ErrorBoundary, useChartsTheme } from '@perses-dev/components';
import { useDatasourceStore } from '@perses-dev/plugin-system';
import { DashboardSpec } from '@perses-dev/spec';
import {
  PanelDrawer,
  Dashboard,
  DashboardShortcuts,
  PanelGroupDialog,
  DeletePanelGroupDialog,
  DashboardDiscardChangesConfirmationDialog,
  DashboardToolbar,
  DeletePanelDialog,
  EmptyDashboardProps,
  EditJsonDialog,
  SaveChangesConfirmationDialog,
  LeaveDialog,
} from '../../components';
import { OnSaveDashboard, useDashboard, useDiscardChangesConfirmationDialog, useEditMode } from '../../context';
import { PanelFocusProvider } from '../../keyboard-shortcuts';
import { DashboardResource } from '../../model';

export interface DashboardAppProps {
  dashboardResource: DashboardResource;
  emptyDashboardProps?: Partial<EmptyDashboardProps>;
  isReadonly: boolean;
  isVariableEnabled: boolean;
  isDatasourceEnabled: boolean;
  disableShortcuts?: boolean;
  isCreating?: boolean;
  isInitialVariableSticky?: boolean;
  // If true, browser confirmation dialog will be shown when navigating away with unsaved changes (closing tab, ...).
  isLeavingConfirmDialogEnabled?: boolean;
  dashboardTitleComponent?: ReactNode;
  onSave?: OnSaveDashboard;
  onDiscard?: (name: string, spec: DashboardSpec) => void;
}

export const DashboardApp = (props: DashboardAppProps): ReactElement => {
  const {
    dashboardResource,
    emptyDashboardProps,
    isReadonly,
    isVariableEnabled,
    isDatasourceEnabled,
    disableShortcuts,
    isCreating,
    isInitialVariableSticky,
    isLeavingConfirmDialogEnabled,
    dashboardTitleComponent,
    onSave,
    onDiscard,
  } = props;

  const chartsTheme = useChartsTheme();

  const { isEditMode, setEditMode } = useEditMode();

  const { dashboard, setDashboard } = useDashboard();
  const [originalDashboard, setOriginalDashboard] = useState<DashboardResource | undefined>(undefined);

  const { setSavedDatasources } = useDatasourceStore();

  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();

  const handleDiscardChanges = (): void => {
    // Reset to the original spec and exit edit mode
    if (originalDashboard) {
      setDashboard(originalDashboard);
    }
    setEditMode(false);
    closeDiscardChangesConfirmationDialog();
    if (onDiscard) {
      onDiscard(dashboard.metadata.name, dashboard.spec);
    }
  };

  const onEditButtonClick = (): void => {
    setEditMode(true);
    setOriginalDashboard(dashboard);
    setSavedDatasources(dashboard.spec.datasources ?? {});
  };

  const onCancelButtonClick = (): void => {
    // check if dashboard has been modified
    if (JSON.stringify(dashboard) === JSON.stringify(originalDashboard)) {
      setEditMode(false);
    } else {
      openDiscardChangesConfirmationDialog({
        onDiscardChanges: () => {
          handleDiscardChanges();
        },
        onCancel: () => {
          closeDiscardChangesConfirmationDialog();
        },
      });
    }
  };

  return (
    <PanelFocusProvider>
      <Box
        sx={{
          flexGrow: 1,
          overflowX: 'hidden',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <DashboardToolbar
        dashboardName={dashboardResource.metadata.name}
        dashboardTitleComponent={dashboardTitleComponent}
        initialVariableIsSticky={isInitialVariableSticky}
        onSave={onSave}
        isReadonly={isReadonly}
        isVariableEnabled={isVariableEnabled}
        isDatasourceEnabled={isDatasourceEnabled}
        onEditButtonClick={onEditButtonClick}
        onCancelButtonClick={onCancelButtonClick}
      />
      {!disableShortcuts && (
        <DashboardShortcuts
          onSave={onSave}
          isReadonly={isReadonly}
          onEditButtonClick={onEditButtonClick}
          onCancelButtonClick={onCancelButtonClick}
        />
      )}
      <Box sx={{ paddingTop: 2, paddingX: 2, height: '100%' }}>
        <ErrorBoundary FallbackComponent={ErrorAlert}>
          <Dashboard
            emptyDashboardProps={{
              onEditButtonClick,
              ...emptyDashboardProps,
            }}
          />
        </ErrorBoundary>
        <ChartsProvider chartsTheme={chartsTheme} enablePinning={false} enableSyncGrouping={false}>
          <PanelDrawer />
        </ChartsProvider>
        <PanelGroupDialog />
        <DeletePanelGroupDialog />
        <DeletePanelDialog />
        <DashboardDiscardChangesConfirmationDialog />
        <EditJsonDialog isReadonly={!isEditMode} disableMetadataEdition={!isCreating} />
        <SaveChangesConfirmationDialog />
        {isLeavingConfirmDialogEnabled && isEditMode && (
          <LeaveDialog original={originalDashboard} current={dashboard} />
        )}
      </Box>
      </Box>
    </PanelFocusProvider>
  );
};
