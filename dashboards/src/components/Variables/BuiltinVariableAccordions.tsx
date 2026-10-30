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

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  CircularProgress,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { InfoTooltip } from '@perses-dev/components';
import type { BuiltinVariableDefinition } from '@perses-dev/spec';
import ExpandMoreIcon from 'mdi-material-ui/ChevronUp';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

type BuiltinVariableAccordionsProps = {
  builtinVariableDefinitions: BuiltinVariableDefinition[];
  /**
   * Displays a loading indicator after the accordions, e.g. while the builtin variables of the datasource plugins load.
   */
  isLoading?: boolean;
};

export function BuiltinVariableAccordions({
  builtinVariableDefinitions,
  isLoading = false,
}: BuiltinVariableAccordionsProps): ReactElement {
  const builtinVariablesBySource = useMemo(() => {
    const result: Record<string, BuiltinVariableDefinition[]> = {};
    for (const definition of builtinVariableDefinitions) {
      const value = result[definition.spec.source];
      if (value) {
        value.push(definition);
        continue;
      }
      result[definition.spec.source] = [definition];
    }
    return result;
  }, [builtinVariableDefinitions]);

  const sources = useMemo(() => {
    const result: string[] = [];
    for (const source in builtinVariablesBySource) {
      if (!result.includes(source)) {
        result.push(source);
      }
    }
    return result;
  }, [builtinVariablesBySource]);

  return (
    <>
      {sources.map((source) => (
        <Accordion
          key={source}
          sx={(theme) => ({
            '.MuiAccordionSummary-root': {
              backgroundColor: theme.palette.background.lighter,
            },
            '.MuiAccordionDetails-root': {
              backgroundColor: theme.palette.background.lighter,
            },
          })}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} aria-controls="builtin" id="builtin">
            <Typography variant="h2">
              <InfoTooltip
                title={`${source} Built-in Variables`}
                description="Variables computed during dashboard rendering."
              >
                <span>{source} Built-in Variables</span>
              </InfoTooltip>
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer>
              <Table sx={{ minWidth: 650 }} aria-label="table of external variables">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Description</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(builtinVariablesBySource[source] ?? []).map((v) => (
                    <TableRow key={source + '-' + v.spec.name}>
                      <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                        {v.spec.name}
                      </TableCell>
                      <TableCell>{v.spec.display?.description ?? ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}
      {isLoading && (
        <Stack direction="row" alignItems="center" justifyContent="center" gap={1} py={1}>
          <CircularProgress size="1rem" aria-label="Loading built-in variables" />
          <Typography variant="body2" color="text.secondary">
            Loading built-in variables…
          </Typography>
        </Stack>
      )}
    </>
  );
}
