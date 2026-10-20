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

import type { TooltipProps } from '@mui/material';
import { Box, styled, Tooltip, tooltipClasses } from '@mui/material';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import type { ReactElement, ReactNode } from 'react';
import { useMemo } from 'react';

// Isolated DOMPurify instance so the hook below does not affect other consumers of the default singleton.
const descriptionPurifier = typeof window !== 'undefined' ? DOMPurify(window) : DOMPurify;

descriptionPurifier.addHook('afterSanitizeAttributes', (node) => {
  if (!(node instanceof Element) || node.tagName !== 'A') {
    return;
  }
  // Links are always opened in a new tab, so that the dashboard being viewed is not left.
  node.setAttribute('target', '_blank');
  node.setAttribute('rel', 'noopener noreferrer');
});

/**
 * Converts a (GitHub Flavored) Markdown panel description into sanitized HTML.
 */
export function panelDescriptionToHTML(description: string): string {
  const html = marked.parse(description, { gfm: true, breaks: true, async: false });
  return descriptionPurifier.sanitize(html, { ADD_ATTR: ['target', 'rel'] });
}

export interface PanelDescriptionTooltipProps {
  id?: string;
  /**
   * Panel description, written in Markdown.
   */
  description: string;
  children: ReactNode;
  enterDelay?: number;
}

/**
 * Tooltip displaying a panel description rendered as Markdown.
 * The tooltip is interactive, so that links can be clicked and long descriptions can be scrolled.
 */
export function PanelDescriptionTooltip({
  id,
  description,
  children,
  enterDelay,
}: PanelDescriptionTooltipProps): ReactElement {
  const title = useMemo(() => <PanelDescriptionContent description={description} />, [description]);
  return (
    <StyledTooltip arrow id={id} placement="top" title={title} enterDelay={enterDelay ?? 500} enterNextDelay={500}>
      {/* Wrap in a span so that the tooltip always has a child that can hold a ref. */}
      <span>{children}</span>
    </StyledTooltip>
  );
}

// Tooltip content is only mounted when the tooltip is open, so the Markdown is only parsed on demand.
function PanelDescriptionContent({ description }: { description: string }): ReactElement {
  const innerHTML = useMemo(() => ({ __html: panelDescriptionToHTML(description) }), [description]);
  return <MarkdownContent data-testid="panel-description-content" dangerouslySetInnerHTML={innerHTML} />;
}

const MarkdownContent = styled(Box)(({ theme }) => ({
  ...theme.typography.caption,
  color: theme.palette.text.primary,
  maxHeight: '50vh',
  overflowY: 'auto',
  overflowWrap: 'anywhere',
  '& > :first-child': { marginTop: 0 },
  '& > :last-child': { marginBottom: 0 },
  '& p, & ul, & ol, & pre, & table, & blockquote': {
    margin: theme.spacing(0, 0, 1),
  },
  '& ul, & ol': { paddingLeft: theme.spacing(2.5) },
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    margin: theme.spacing(1, 0, 0.5),
    fontSize: theme.typography.body2.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
  },
  '& a': { color: theme.palette.primary.main },
  '& code': {
    fontFamily: 'monospace',
    fontSize: '0.95em',
    padding: '0.1em 0.3em',
    borderRadius: '3px',
    backgroundColor: theme.palette.action.hover,
  },
  '& pre': {
    padding: theme.spacing(1),
    overflowX: 'auto',
    borderRadius: '4px',
    backgroundColor: theme.palette.action.hover,
  },
  '& pre code': { padding: 0, backgroundColor: 'transparent' },
  '& blockquote': {
    paddingLeft: theme.spacing(1),
    borderLeft: `3px solid ${theme.palette.divider}`,
    color: theme.palette.text.secondary,
  },
  '& table, & th, & td': {
    padding: theme.spacing(0.5),
    border: `1px solid ${theme.palette.divider}`,
    borderCollapse: 'collapse',
  },
  '& img': { maxWidth: '100%' },
}));

function PopperClassTooltip({ className, ...props }: TooltipProps): ReactElement {
  const classes = useMemo(() => ({ popper: className }), [className]);
  return <Tooltip {...props} classes={classes} />;
}

const StyledTooltip = styled(PopperClassTooltip)(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.tooltip,
    color: theme.palette.text.primary,
    maxWidth: '500px',
    padding: theme.spacing(1),
    boxShadow: theme.shadows[1],
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: theme.palette.background.tooltip,
  },
}));
