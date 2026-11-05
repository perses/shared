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

import { useDirection } from '@base-ui/react/direction-provider';
import type { TextDirection } from '@base-ui/react/direction-provider';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement } from 'react';

import { useComponents } from '../../contexts/ComponentsProvider';
import type { SlotStyleProps } from '../../types';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, Icon } from '../Icon';

interface ScrollState {
  back: boolean;
  forward: boolean;
  vertical: boolean;
}

const NO_SCROLL: ScrollState = { back: false, forward: false, vertical: false };
const SCROLL_FRACTION = 0.8;

function isVertical(list: HTMLElement): boolean {
  return list.dataset.orientation === 'vertical';
}

/** Normalize RTL's negative `scrollLeft` to distance from the start. */
function scrollPosition(list: HTMLElement, vertical: boolean, direction: TextDirection): number {
  const position = vertical ? list.scrollTop : list.scrollLeft;
  return Math.max(0, !vertical && direction === 'rtl' ? -position : position);
}

function measure(list: HTMLElement, direction: TextDirection): ScrollState {
  const vertical = isVertical(list);
  const position = scrollPosition(list, vertical, direction);
  const size = vertical ? list.clientHeight : list.clientWidth;
  const total = vertical ? list.scrollHeight : list.scrollWidth;
  return { back: position > 0, forward: Math.ceil(position + size) < total, vertical };
}

function sameState(a: ScrollState, b: ScrollState): boolean {
  return a.back === b.back && a.forward === b.forward && a.vertical === b.vertical;
}

function useScrollState(list: HTMLElement | null, direction: TextDirection): ScrollState {
  const [state, setState] = useState(NO_SCROLL);

  useEffect(() => {
    if (!list) return undefined;
    const update = (): void => {
      const next = measure(list, direction);
      setState((prev) => (sameState(prev, next) ? prev : next));
    };
    update();
    list.addEventListener('scroll', update, { passive: true });
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    resizeObserver?.observe(list);
    for (const child of list.querySelectorAll('.ps-TabList__tabs, [role="tab"]')) resizeObserver?.observe(child);
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) {
            resizeObserver?.observe(node);
            for (const tab of node.querySelectorAll('[role="tab"]')) resizeObserver?.observe(tab);
          }
        }
      }
      update();
    });
    // Tab sizes are covered by the ResizeObserver; only collection and axis changes need mutations.
    mutationObserver.observe(list, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-orientation'],
    });
    return (): void => {
      list.removeEventListener('scroll', update);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [list, direction]);

  return state;
}

interface TabListScrollButtonsProps {
  list: HTMLDivElement | null;
  slotProps?: SlotStyleProps;
  backIcon?: ReactElement;
  forwardIcon?: ReactElement;
}

/**
 * Overflow-only, mouse-accessible controls. Hidden from assistive technology because arrow-key
 * navigation already scrolls focused tabs into view.
 */
export function TabListScrollButtons({
  list,
  slotProps,
  backIcon,
  forwardIcon,
}: TabListScrollButtonsProps): ReactElement | null {
  const {
    components: { IconButton },
  } = useComponents();
  const direction = useDirection();
  const edges = useScrollState(list, direction);

  const scrollBy = useCallback(
    (step: -1 | 1) => {
      if (!list) return;
      const vertical = isVertical(list);
      const sign = !vertical && direction === 'rtl' ? -1 : 1;
      const distance = sign * step * SCROLL_FRACTION * (vertical ? list.clientHeight : list.clientWidth);
      list.scrollBy(vertical ? { top: distance } : { left: distance });
    },
    [list, direction],
  );
  const scrollBack = useCallback(() => scrollBy(-1), [scrollBy]);
  const scrollForward = useCallback(() => scrollBy(1), [scrollBy]);

  if (!edges.back && !edges.forward) return null;

  const className = clsx('ps-TabList__scrollButton', slotProps?.className);
  const HorizontalBackIcon = direction === 'rtl' ? ChevronRightIcon : ChevronLeftIcon;
  const HorizontalForwardIcon = direction === 'rtl' ? ChevronLeftIcon : ChevronRightIcon;
  return (
    <div className="ps-TabList__scrollButtons">
      <IconButton
        className={className}
        style={slotProps?.style}
        data-direction="back"
        variant="ghost"
        size="sm"
        aria-label="Scroll tabs backward"
        aria-hidden
        tabIndex={-1}
        disabled={!edges.back}
        onClick={scrollBack}
      >
        <Icon>{backIcon ?? (edges.vertical ? <ChevronUpIcon /> : <HorizontalBackIcon />)}</Icon>
      </IconButton>
      <IconButton
        className={className}
        style={slotProps?.style}
        data-direction="forward"
        variant="ghost"
        size="sm"
        aria-label="Scroll tabs forward"
        aria-hidden
        tabIndex={-1}
        disabled={!edges.forward}
        onClick={scrollForward}
      >
        <Icon>{forwardIcon ?? (edges.vertical ? <ChevronDownIcon /> : <HorizontalForwardIcon />)}</Icon>
      </IconButton>
    </div>
  );
}
