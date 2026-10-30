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
import { ChevronLeftIcon, ChevronRightIcon, Icon } from '../Icon';

interface ScrollEdges {
  back: boolean;
  forward: boolean;
}

const NO_SCROLL: ScrollEdges = { back: false, forward: false };
const SCROLL_FRACTION = 0.8;

function isVertical(list: HTMLElement): boolean {
  return list.dataset.orientation === 'vertical';
}

function measure(list: HTMLElement): ScrollEdges {
  const vertical = isVertical(list);
  const position = vertical ? list.scrollTop : list.scrollLeft;
  const size = vertical ? list.clientHeight : list.clientWidth;
  const total = vertical ? list.scrollHeight : list.scrollWidth;
  return { back: position > 0, forward: Math.ceil(position + size) < total };
}

/**
 * Tracks whether the tab list can scroll backward or forward along its orientation axis, re-measuring on scroll and
 * on size changes of the list and its tabs.
 */
function useScrollEdges(listRef: RefObject<HTMLElement | null>): ScrollEdges {
  const [edges, setEdges] = useState(NO_SCROLL);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return undefined;
    const update = (): void => {
      const next = measure(list);
      setEdges((prev) => (prev.back === next.back && prev.forward === next.forward ? prev : next));
    };
    update();
    list.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    observer?.observe(list);
    for (const child of list.children) observer?.observe(child);
    return (): void => {
      list.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, [listRef]);

  return edges;
}

const defaultBackIcon = <ChevronLeftIcon />;
const defaultForwardIcon = <ChevronRightIcon />;

interface TabListScrollButtonsProps {
  listRef: RefObject<HTMLDivElement | null>;
  slotProps?: SlotStyleProps;
  backIcon?: ReactElement;
  forwardIcon?: ReactElement;
}

/**
 * Mouse-only scroll affordance for `variant="scrollable"`: two provider-resolved `IconButton`s pinned to the list
 * edges, rendered only while the list overflows. They are hidden from assistive technology because keyboard users
 * reach off-screen tabs with the arrow keys, which scroll the focused tab into view.
 */
export function TabListScrollButtons({
  listRef,
  slotProps,
  backIcon = defaultBackIcon,
  forwardIcon = defaultForwardIcon,
}: TabListScrollButtonsProps): ReactElement | null {
  const {
    components: { IconButton },
  } = useComponents();
  const edges = useScrollEdges(listRef);

  const scrollBy = useCallback(
    (direction: -1 | 1) => {
      const list = listRef.current;
      if (!list) return;
      const vertical = isVertical(list);
      const distance = direction * SCROLL_FRACTION * (vertical ? list.clientHeight : list.clientWidth);
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
        <Icon>{backIcon}</Icon>
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
        <Icon>{forwardIcon}</Icon>
      </IconButton>
    </>
  );
}
