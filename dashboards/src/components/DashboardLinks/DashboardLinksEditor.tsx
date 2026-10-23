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
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';
import { InfoTooltip, LinkEditorForm } from '@perses-dev/components';
import type { Link } from '@perses-dev/spec';
import ArrowDown from 'mdi-material-ui/ArrowDown';
import ArrowUp from 'mdi-material-ui/ArrowUp';
import ChevronUp from 'mdi-material-ui/ChevronUp';
import PencilIcon from 'mdi-material-ui/Pencil';
import AddIcon from 'mdi-material-ui/Plus';
import TrashIcon from 'mdi-material-ui/TrashCan';
import type { ReactElement } from 'react';
import { useState } from 'react';
import { useImmer } from 'use-immer';

import { useDiscardChangesConfirmationDialog } from '../../context';
import type { DashboardLink } from '../LinksDisplay/dashboard-link';
import { isDashboardLinkValid, isTagLink, normalizeDashboardLink } from '../LinksDisplay/dashboard-link';

export interface DashboardLinksEditorProps {
  links: DashboardLink[];
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

export function DashboardLinksEditor({
  links: initialLinks,
  onChange,
  onCancel,
}: DashboardLinksEditorProps): ReactElement {
  const [links, setLinks] = useImmer<DashboardLink[]>(initialLinks);
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

  const handleUpdateLink = (index: number, link: DashboardLink): void => {
    setLinks((draft) => {
      draft[index] = link;
    });
  };

  const isValid = links.every((link) => isDashboardLinkValid(link));

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
          <Button
            disabled={!isValid}
            variant="contained"
            onClick={() => onChange(links.map((link) => normalizeDashboardLink(link)) as Link[])}
          >
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
            <Table size="small" sx={{ tableLayout: 'fixed', width: '100%' }} aria-label="table of dashboard links">
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Target</TableCell>
                  <TableCell width={80}>New Tab</TableCell>
                  <TableCell align="right" width={180}>
                    Actions
                  </TableCell>
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
  link: DashboardLink;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (link: DashboardLink) => void;
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
  const [kind, setKind] = useState<'url' | 'tags'>(isTagLink(link) ? 'tags' : 'url');
  const tagMode = kind === 'tags';
  const hasError = !isDashboardLinkValid(link);
  const targetLabel = tagMode ? (link.tags ?? []).join(', ') : link.url || '(no URL)';

  return (
    <>
      <TableRow>
        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {displayName}
        </TableCell>
        <TableCell
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            color: hasError ? 'error.main' : undefined,
          }}
        >
          <InfoTooltip description={targetLabel} enterDelay={100}>
            {targetLabel}
          </InfoTooltip>
        </TableCell>
        <TableCell>{tagMode ? '—' : link.targetBlank ? 'Yes' : 'No'}</TableCell>
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
              <FormControl fullWidth sx={{ marginBottom: 2 }}>
                <InputLabel id={`link-kind-${index}`}>Kind</InputLabel>
                <Select
                  labelId={`link-kind-${index}`}
                  label="Kind"
                  value={kind}
                  onChange={(event) => {
                    const next = event.target.value === 'tags' ? 'tags' : 'url';
                    setKind(next);
                    if (next === 'tags') {
                      onUpdate({
                        name: link.name,
                        tooltip: link.tooltip,
                        tags: link.tags ?? [],
                        keepTime: link.keepTime ?? true,
                        includeVariables: link.includeVariables ?? true,
                      });
                      return;
                    }
                    onUpdate({
                      name: link.name,
                      tooltip: link.tooltip,
                      url: '',
                      renderVariables: true,
                      targetBlank: true,
                    });
                  }}
                >
                  <MenuItem value="url">URL</MenuItem>
                  <MenuItem value="tags">Dashboards by tag</MenuItem>
                </Select>
              </FormControl>
              {tagMode ? (
                <TagLinkFields link={link} onUpdate={onUpdate} />
              ) : (
                <LinkEditorForm
                  mode="modalEmbedded"
                  url={{
                    value: link.url ?? '',
                    label: 'URL',
                    error: { hasError: hasError, helperText: hasError ? 'URL is required' : undefined },
                    placeholder: 'https://example.com/dashboard?var=$variable',
                    onChange: (url) => onUpdate({ ...link, url, tags: undefined }),
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
              )}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

function TagLinkFields({
  link,
  onUpdate,
}: {
  link: DashboardLink;
  onUpdate: (link: DashboardLink) => void;
}): ReactElement {
  const [tagsText, setTagsText] = useState((link.tags ?? []).join(', '));
  const nameMissing = (link.name?.trim() ?? '') === '';
  const tagsMissing = (link.tags ?? []).length === 0;

  return (
    <Stack gap={2}>
      <TextField
        label="Display Name"
        required
        fullWidth
        value={link.name ?? ''}
        error={nameMissing}
        helperText={nameMissing ? 'Name is required' : undefined}
        onChange={(event) => onUpdate({ ...link, name: event.target.value })}
      />
      <TextField
        label="Tags"
        required
        fullWidth
        value={tagsText}
        error={tagsMissing}
        helperText={tagsMissing ? 'At least one tag is required' : 'Comma-separated. A dashboard must have every tag.'}
        onChange={(event) => {
          const text = event.target.value;
          setTagsText(text);
          onUpdate({
            ...link,
            tags: text
              .split(',')
              .map((tag) => tag.trim())
              .filter((tag) => tag.length > 0),
          });
        }}
      />
      <TextField
        label="Tooltip"
        fullWidth
        value={link.tooltip ?? ''}
        onChange={(event) => onUpdate({ ...link, tooltip: event.target.value })}
      />
      <Stack direction="row" gap={1}>
        <FormControlLabel
          label="Keep current time range"
          control={
            <Checkbox
              checked={link.keepTime === true}
              onChange={(event) => onUpdate({ ...link, keepTime: event.target.checked })}
            />
          }
        />
        <FormControlLabel
          label="Include matching variables"
          control={
            <Checkbox
              checked={link.includeVariables === true}
              onChange={(event) => onUpdate({ ...link, includeVariables: event.target.checked })}
            />
          }
        />
      </Stack>
    </Stack>
  );
}
