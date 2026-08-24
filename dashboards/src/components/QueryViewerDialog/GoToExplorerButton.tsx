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

import { Button } from '@mui/material';
import { useExplorerKeyForQueries, useExplorerQueryParams, useRouterContext } from '@perses-dev/plugin-system';
import { QueryDefinition } from '@perses-dev/spec';
import Compass from 'mdi-material-ui/Compass';
import { ReactElement, useMemo } from 'react';

const EXPLORE_ROUTE = '/explore';
const COMPASS_ICON = <Compass />;

export interface GoToExplorerButtonProps {
  queryDefinitions: QueryDefinition[];
}

/**
 * Opens the queries being viewed in the explorer that owns them. The queries travel in
 * the link rather than being saved anywhere, so the explorer starts from them and the
 * dashboard is left untouched.
 */
export function GoToExplorerButton({ queryDefinitions }: GoToExplorerButtonProps): ReactElement | null {
  const { RouterComponent } = useRouterContext();
  const explorer = useExplorerKeyForQueries(queryDefinitions);
  const data = useMemo(() => ({ queries: queryDefinitions }), [queryDefinitions]);
  const queryParams = useExplorerQueryParams({ explorer, data });

  // No explorer ships for this query's plugin module, or the consumer never supplied a
  // router, so there is nowhere to send the user.
  if (explorer === undefined || RouterComponent === undefined) return null;

  return (
    <Button
      variant="outlined"
      color="primary"
      startIcon={COMPASS_ICON}
      component={RouterComponent}
      to={`${EXPLORE_ROUTE}?${queryParams}`}
    >
      Go to Explorer
    </Button>
  );
}
