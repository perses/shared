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

import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import type { ReactElement, RefObject } from 'react';

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

function isRtl(list: HTMLElement): boolean {
  return getComputedStyle(list).direction === 'rtl';
}

/** Distance scrolled from the start edge; RTL lists report `scrollLeft` as 0 at the start and negative after. */
function scrollPosition(list: HTMLElement, vertical: boolean): number {
  return Math.abs(vertical ? list.scrollTop : list.scrollLeft);
}

function measure(list: HTMLElement): ScrollState {
  const vertical = isVertical(list);
  const position = scrollPosition(list, vertical);
  const size = vertical ? list.clientHeight : list.clientWidth;
  const total = vertical ? list.scrollHeight : list.scrollWidth;
  return { back: position > 0, forward: Math.ceil(position + size) < total, vertical };
}

function sameState(a: ScrollState, b: ScrollState): boolean {
  return a.back === b.back && a.forward === b.forward && a.vertical === b.vertical;
}

/**
 * Tracks the list orientation and whether it can scroll backward or forward along that axis, re-measuring on
 * scroll, on size changes of the list and its tabs, when tabs are added or removed, and when the orientation changes.
 */
function useScrollState(listRef: RefObject<HTMLElement | null>): ScrollState {
  const [state, setState] = useState(NO_SCROLL);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const update = (): void => {
      const next = measure(list);
      setState((prev) => (sameState(prev, next) ? prev : next));
    };
    update();
    list.addEventListener('scroll', update, { passive: true });
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    resizeObserver?.observe(list);
    for (const child of list.children) resizeObserver?.observe(child);
    const mutationObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) if (node instanceof Element) resizeObserver?.observe(node);
      }
      update();
    });
    mutationObserver.observe(list, { childList: true, attributes: true, attributeFilter: ['data-orientation'] });
    return (): void => {
      list.removeEventListener('scroll', update);
      resizeObserver?.disconnect();
      mutationObserver.disconnect();
    };
  }, [listRef]);

  return state;
}

interface TabListScrollButtonsProps {
  listRef: RefObject<HTMLDivElement | null>;
  slotProps?: SlotStyleProps;
  backIcon?: ReactElement;
  forwardIcon?: ReactElement;
}

/**
 * Mouse-only scroll affordance for `scrollButtons`: two provider-resolved `IconButton`s pinned to the list
 * edges, rendered only while the list overflows. They are hidden from assistive technology because keyboard users
 * reach off-screen tabs with the arrow keys, which scroll the focused tab into view.
 */
export function TabListScrollButtons({
  listRef,
  slotProps,
  backIcon,
  forwardIcon,
}: TabListScrollButtonsProps): ReactElement | null {
  const {
    components: { IconButton },
  } = useComponents();
  const edges = useScrollState(listRef);

  const scrollBy = useCallback(
    (direction: -1 | 1) => {
      const list = listRef.current;
      if (!list) return;
      const vertical = isVertical(list);
      const sign = !vertical && isRtl(list) ? -1 : 1;
      const distance = sign * direction * SCROLL_FRACTION * (vertical ? list.clientHeight : list.clientWidth);
      list.scrollBy(vertical ? { top: distance } : { left: distance });
    },
    [listRef],
  );
  const scrollBack = useCallback(() => scrollBy(-1), [scrollBy]);
  const scrollForward = useCallback(() => scrollBy(1), [scrollBy]);

  if (!edges.back && !edges.forward) return null;

  const className = clsx('ps-TabList__scrollButton', slotProps?.className);
  return (
    <>
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
        <Icon>{backIcon ?? (edges.vertical ? <ChevronUpIcon /> : <ChevronLeftIcon />)}</Icon>
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
        <Icon>{forwardIcon ?? (edges.vertical ? <ChevronDownIcon /> : <ChevronRightIcon />)}</Icon>
      </IconButton>
    </>
  );
}
