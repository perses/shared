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

import { Box } from '@mui/material';
import { ChartsProvider, useChartsTheme } from '@perses-dev/components';
import type { ReactElement, ReactNode } from 'react';

import type { ExploreTab } from '../../components';
import { ExploreManager, ExplorerManagerProviderWithQueryParams } from '../../components';
import { useExploreTabs } from '../../components/ExploreManager/use-explore-tabs';

const ROOT_SX = { flexGrow: 1, overflowX: 'hidden', overflowY: 'auto', display: 'flex', flexDirection: 'column' };

export interface ViewAppProps {
  exploreTitleComponent?: ReactNode;
  /** Tabs of the explore page. See `ExploreManagerProps.tabs`. */
  tabs?: ExploreTab[];
}

export function ViewExploreApp(props: ViewAppProps): ReactElement {
  const { exploreTitleComponent, tabs } = props;

  const chartsTheme = useChartsTheme();
  const defaultExplorer = useExploreTabs(tabs)?.[0]?.key;

  return (
    <Box sx={ROOT_SX}>
      <ChartsProvider chartsTheme={chartsTheme} enablePinning={false}>
        <ExplorerManagerProviderWithQueryParams defaultExplorer={defaultExplorer}>
          <ExploreManager exploreTitleComponent={exploreTitleComponent} tabs={tabs} />
        </ExplorerManagerProviderWithQueryParams>
      </ChartsProvider>
    </Box>
  );
}
