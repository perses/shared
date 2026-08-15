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

import React, { ReactElement, useMemo } from 'react';
import { Dialog } from '@perses-dev/components';
import { Button, Divider } from '@mui/material';
import { PluginSpecEditor } from '@perses-dev/plugin-system';
import { PanelDefinition, QueryDefinition } from '@perses-dev/spec';
import { QueryPlayground } from './QueryPlayground';

export interface QueryViewerDialogProps {
  open: boolean;
  queryDefinitions: QueryDefinition[];
  /**
   * When provided, the dialog becomes a query playground: queries are editable and can be run
   * on the fly against a live preview of the panel. Edits are local to the dialog and dropped
   * when it closes. When omitted, queries are rendered read-only.
   */
  panelDefinition?: PanelDefinition;
  onClose: () => void;
}

export function QueryViewerDialog({
  open,
  queryDefinitions,
  panelDefinition,
  onClose,
}: QueryViewerDialogProps): ReactElement {
  const queryRows = useMemo(() => {
    if (!queryDefinitions?.length) return null;

    const queryItems: ReactElement[] = [];
    queryDefinitions.forEach((query, index) => {
      if (query?.spec?.plugin?.kind && query?.kind) {
        queryItems.push(
          <React.Fragment key={`query-${index}`}>
            <PluginSpecEditor
              value={query.spec.plugin.spec}
              pluginSelection={{ kind: query.spec.plugin.kind, type: query.kind }}
              onChange={(): void => {}}
              isReadonly
            />
            {index < queryDefinitions.length - 1 && <Divider sx={{ my: 2 }} />}
          </React.Fragment>
        );
      }
    });

    return queryItems;
  }, [queryDefinitions]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth={true}>
      <Dialog.Header>Query Viewer</Dialog.Header>
      {/* Gating on `open` guarantees playground edits are dropped whenever the dialog closes. */}
      <Dialog.Content>
        {open && panelDefinition ? <QueryPlayground panelDefinition={panelDefinition} /> : queryRows}
      </Dialog.Content>
      <Dialog.Actions>
        <Button variant="outlined" color="secondary" onClick={onClose}>
          Close
        </Button>
      </Dialog.Actions>
    </Dialog>
  );
}
