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

import { useState, ReactElement } from 'react';
import {
  Button,
  Stack,
  Box,
  Typography,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Collapse,
} from '@mui/material';
import AddIcon from 'mdi-material-ui/Plus';
import TrashIcon from 'mdi-material-ui/TrashCan';
import ArrowUp from 'mdi-material-ui/ArrowUp';
import ArrowDown from 'mdi-material-ui/ArrowDown';
import PencilIcon from 'mdi-material-ui/Pencil';
import ChevronUp from 'mdi-material-ui/ChevronUp';
import { Link } from '@perses-dev/core';
import { useImmer } from 'use-immer';
import { LinkEditorForm } from '@perses-dev/components';
import { useDiscardChangesConfirmationDialog } from '../../context';

export interface DashboardLinksEditorProps {
  links: Link[];
  onChange: (links: Link[]) => void;
  onCancel: () => void;
}

const DEFAULT_LINK: Link = {
  url: '',
  name: '',
  tooltip: '',
  renderVariables: true,
  targetBlank: true,
};

/**
 * Editor component for managing dashboard links.
 * Allows adding, removing, reordering, and editing link properties.
 */
export function DashboardLinksEditor({
  links: initialLinks,
  onChange,
  onCancel,
}: DashboardLinksEditorProps): ReactElement {
  const [links, setLinks] = useImmer(initialLinks);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const { openDiscardChangesConfirmationDialog, closeDiscardChangesConfirmationDialog } =
    useDiscardChangesConfirmationDialog();

  const handleCancel = (): void => {
    if (JSON.stringify(initialLinks) !== JSON.stringify(links)) {
      openDiscardChangesConfirmationDialog({
        onDiscardChanges: () => {
          closeDiscardChangesConfirmationDialog();
          onCancel();
        },
        onCancel: closeDiscardChangesConfirmationDialog,
      });
    } else {
      onCancel();
    }
  };

  const handleAdd = (): void => {
    setLinks((draft) => {
      draft.push({ ...DEFAULT_LINK });
    });
    setExpandedIndex(links.length);
  };

  const handleRemove = (index: number): void => {
    setLinks((draft) => {
      draft.splice(index, 1);
    });
    if (expandedIndex === index) {
      setExpandedIndex(null);
    } else if (expandedIndex !== null && expandedIndex > index) {
      setExpandedIndex(expandedIndex - 1);
    }
  };

  const handleMoveUp = (index: number): void => {
    if (index === 0) return;
    setLinks((draft) => {
      const temp = draft[index - 1];
      if (temp && draft[index]) {
        draft[index - 1] = draft[index]!;
        draft[index] = temp;
      }
    });
    if (expandedIndex === index) {
      setExpandedIndex(index - 1);
    } else if (expandedIndex === index - 1) {
      setExpandedIndex(index);
    }
  };

  const handleMoveDown = (index: number): void => {
    if (index >= links.length - 1) return;
    setLinks((draft) => {
      const temp = draft[index + 1];
      if (temp && draft[index]) {
        draft[index + 1] = draft[index]!;
        draft[index] = temp;
      }
    });
    if (expandedIndex === index) {
      setExpandedIndex(index + 1);
    } else if (expandedIndex === index + 1) {
      setExpandedIndex(index);
    }
  };

  const handleUpdateLink = (index: number, link: Link): void => {
    setLinks((draft) => {
      draft[index] = link;
    });
  };

  const isValid = links.every((link) => link.url.trim().length > 0);

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: (theme) => theme.spacing(1, 2),
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h2">Edit Dashboard Links</Typography>
        <Stack direction="row" spacing={1} marginLeft="auto">
          <Button disabled={!isValid} variant="contained" onClick={() => onChange(links)}>
            Apply
          </Button>
          <Button color="secondary" variant="outlined" onClick={handleCancel}>
            Cancel
          </Button>
        </Stack>
      </Box>
      <Box padding={2} sx={{ overflowY: 'scroll' }}>
        <Stack spacing={2}>
          <TableContainer>
            <Table sx={{ minWidth: 650 }} aria-label="table of dashboard links">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>URL</TableCell>
                  <TableCell>New Tab</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {links.map((link, index) => (
                  <LinkTableRow
                    key={index}
                    link={link}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === links.length - 1}
                    isExpanded={expandedIndex === index}
                    onToggleExpand={() => setExpandedIndex(expandedIndex === index ? null : index)}
                    onUpdate={(updatedLink) => handleUpdateLink(index, updatedLink)}
                    onRemove={() => handleRemove(index)}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {links.length === 0 && (
            <Typography variant="body1" color="text.secondary" fontStyle="italic" textAlign="center" py={4}>
              No links defined. Click &apos;Add Link&apos; to create one.
            </Typography>
          )}
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} sx={{ alignSelf: 'flex-start' }}>
            Add Link
          </Button>
        </Stack>
      </Box>
    </>
  );
}

interface LinkTableRowProps {
  link: Link;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (link: Link) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function LinkTableRow({
  link,
  index,
  isFirst,
  isLast,
  isExpanded,
  onToggleExpand,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: LinkTableRowProps): ReactElement {
  const displayName = link.name?.trim() || `Link ${index + 1}`;
  const hasError = link.url.trim().length === 0;

  return (
    <>
      <TableRow sx={{ backgroundColor: hasError ? 'error.light' : undefined }}>
        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
          {displayName}
        </TableCell>
        <TableCell
          sx={{
            maxWidth: 200,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: hasError ? 'error.main' : undefined,
          }}
        >
          {link.url || '(no URL)'}
        </TableCell>
        <TableCell>{link.targetBlank ? 'Yes' : 'No'}</TableCell>
        <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
          <IconButton onClick={onMoveUp} disabled={isFirst} aria-label="Move link up">
            <ArrowUp />
          </IconButton>
          <IconButton onClick={onMoveDown} disabled={isLast} aria-label="Move link down">
            <ArrowDown />
          </IconButton>
          <IconButton onClick={onToggleExpand} aria-label={isExpanded ? 'Collapse link editor' : 'Edit link'}>
            {isExpanded ? <ChevronUp /> : <PencilIcon />}
          </IconButton>
          <IconButton onClick={onRemove} aria-label="Remove link">
            <TrashIcon />
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ paddingBottom: 0, paddingTop: 0, border: isExpanded ? undefined : 'none' }}>
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2 }}>
              <LinkEditorForm
                mode="modalEmbedded"
                url={{
                  value: link.url,
                  label: 'URL',
                  error: { hasError: hasError, helperText: hasError ? 'URL is required' : undefined },
                  placeholder: 'https://example.com/dashboard?var=$variable',
                  onChange: (url) => onUpdate({ ...link, url }),
                }}
                name={{
                  value: link.name ?? '',
                  label: 'Display Name',
                  onChange: (name) => onUpdate({ ...link, name }),
                }}
                tooltip={{
                  value: link.tooltip ?? '',
                  label: 'Tooltip',
                  onChange: (tooltip) => onUpdate({ ...link, tooltip }),
                }}
                renderVariables={{
                  value: link.renderVariables ?? true,
                  label: 'Replace variables in URL',
                  onChange: (renderVariables) => onUpdate({ ...link, renderVariables }),
                }}
                newTabOpen={{
                  value: link.targetBlank ?? true,
                  label: 'Open in new tab',
                  onChange: (targetBlank) => onUpdate({ ...link, targetBlank }),
                }}
              />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}
