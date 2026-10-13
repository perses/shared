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

import type { BoxProps } from '@mui/material';
import { Box } from '@mui/material';
import { ErrorBoundary, ErrorAlert } from '@perses-dev/components';
import { SnapGridGroup } from '@snapgridjs/react';
import type { ReactElement } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import { usePanelGroupIds, useViewPanelGroup } from '../../context';
import type { EmptyDashboardProps } from '../EmptyDashboard';
import { EmptyDashboard } from '../EmptyDashboard';
import { GridLayout } from '../GridLayout';
import type { PanelOptions } from '../Panel';

export type DashboardProps = BoxProps & {
  /**
   * Props for `EmptyDashboard` component that will be rendered when the dashboard
   * is empty (i.e. has no panel groups). If not specified, the defaults will
   * be used.
   */
  emptyDashboardProps?: EmptyDashboardProps;
  panelOptions?: PanelOptions;
};
const HEADER_HEIGHT = 165; // Approximate height of the header in dashboard view (including the navbar and variables toolbar)

/**
 * Renders a Dashboard for the provided Dashboard spec.
 */
export function Dashboard({ emptyDashboardProps, panelOptions, ...boxProps }: DashboardProps): ReactElement {
  const panelGroupIds = usePanelGroupIds();
  const viewPanelItemId = useViewPanelGroup();
  const boxRef = useRef<HTMLDivElement>(null);
  const isEmpty = !panelGroupIds.length;
  const [panelFullHeight, setPanelFullHeight] = useState<number>();

  useLayoutEffect(() => {
    if (!viewPanelItemId) return;
    const measure = (): void => {
      const top = boxRef.current?.getBoundingClientRect().top ?? HEADER_HEIGHT;
      setPanelFullHeight(window.innerHeight - top - window.scrollY);
    };
    measure();
    window.addEventListener('resize', measure);
    return (): void => window.removeEventListener('resize', measure);
  }, [viewPanelItemId]);

  return (
    <Box {...boxProps} sx={{ height: '100%' }} ref={boxRef}>
      <ErrorBoundary FallbackComponent={ErrorAlert}>
        {isEmpty && (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center' }}>
            <EmptyDashboard {...emptyDashboardProps} />
          </Box>
        )}
        <SnapGridGroup>
          {!isEmpty &&
            panelGroupIds.map((panelGroupId) => (
              <GridLayout
                key={panelGroupId}
                panelGroupId={panelGroupId}
                panelOptions={panelOptions}
                panelFullHeight={viewPanelItemId ? panelFullHeight : undefined}
              />
            ))}
        </SnapGridGroup>
      </ErrorBoundary>
    </Box>
  );
}
