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

import { createTheme } from '@mui/material';

import type { CursorCoordinates, CursorData } from './tooltip-model';
import { TOOLTIP_MAX_HEIGHT, TOOLTIP_MAX_WIDTH } from './tooltip-model';
import { assembleTransform, getTooltipStyles } from './utils';

const VIEWPORT_WIDTH = 1600;
const VIEWPORT_HEIGHT = 720;

function makeMousePos(pageX: number, pageY: number): CursorData['coords'] {
  return {
    page: { x: pageX, y: pageY },
    client: { x: pageX, y: pageY },
    plotCanvas: { x: pageX, y: pageY },
    target: null,
  };
}

function parseTransform(transform: string | undefined): { x: number; y: number } | null {
  if (!transform) return null;
  const match = transform.match(/translate3d\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px,\s*0(?:px)?\)/);
  if (!match || match[1] === undefined || match[2] === undefined) return null;
  return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
}

describe('assembleTransform', () => {
  const originalInnerWidth = window.innerWidth;
  const originalInnerHeight = window.innerHeight;
  const originalScrollY = window.scrollY;

  beforeAll(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: VIEWPORT_WIDTH });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: VIEWPORT_HEIGHT });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  afterAll(() => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
    Object.defineProperty(window, 'scrollY', { configurable: true, value: originalScrollY });
  });

  it('returns undefined when mousePos is null', () => {
    expect(assembleTransform(null, null, 200, 400)).toBeUndefined();
  });

  describe('when tooltip size is unknown (first render)', () => {
    it('uses TOOLTIP_MAX_HEIGHT as fallback and clamps against the viewport bottom when it fits neither below nor above', () => {
      const mousePos = makeMousePos(800, 400);
      const result = parseTransform(assembleTransform(mousePos, null, 0, 0));
      expect(result).not.toBeNull();
      // The tooltip (650 tall at the fallback max size) does not fit below the cursor nor
      // above it, so it falls back to the viewport bottom instead of hiding its top.
      expect(result!.y).toBe(VIEWPORT_HEIGHT - TOOLTIP_MAX_HEIGHT - 16);
      // Worst-case bottom (y + max height) must still fit inside the viewport.
      expect(result!.y + TOOLTIP_MAX_HEIGHT).toBeLessThanOrEqual(VIEWPORT_HEIGHT);
    });

    it('uses TOOLTIP_MAX_WIDTH as fallback and flips to the left of the cursor when needed', () => {
      const mousePos = makeMousePos(VIEWPORT_WIDTH - 100, 100);
      const result = parseTransform(assembleTransform(mousePos, null, 0, 0));
      expect(result).not.toBeNull();
      expect(result!.x).toBe(VIEWPORT_WIDTH - 100 - TOOLTIP_MAX_WIDTH - 32);
    });
  });

  describe('when tooltip size is known', () => {
    it('places the tooltip to the right and below the cursor when it fits', () => {
      const mousePos = makeMousePos(400, 100);
      const result = parseTransform(assembleTransform(mousePos, null, 200, 300));
      expect(result).toEqual({ x: 400 + 32, y: 100 + 16 });
    });

    it('flips the tooltip above the cursor when it would extend past the viewport bottom', () => {
      const mousePos = makeMousePos(400, 600);
      const result = parseTransform(assembleTransform(mousePos, null, 400, 300));
      expect(result).not.toBeNull();
      expect(result!.y).toBe(600 - 400 - 16);
      expect(result!.y + 400).toBeLessThanOrEqual(VIEWPORT_HEIGHT);
    });

    it('flips above without covering the hovered marker when the cursor is low in the viewport', () => {
      const mousePos = makeMousePos(400, 650);
      const result = parseTransform(assembleTransform(mousePos, null, 400, 300));
      expect(result).not.toBeNull();
      // The whole tooltip ends above the cursor, so it never covers the hovered marker.
      expect(result!.y + 400).toBeLessThanOrEqual(650);
      expect(result!.y).toBe(650 - 400 - 16);
    });

    it('falls back to the viewport bottom when flipping would hide the tooltip top in a scrolled page', () => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 1000 });
      try {
        // Cursor 300px into the visible viewport; a 450px tooltip fits neither below nor above it.
        const mousePos = makeMousePos(400, 1000 + 300);
        const result = parseTransform(assembleTransform(mousePos, null, 450, 300));
        expect(result).not.toBeNull();
        expect(result!.y).toBe(1000 + VIEWPORT_HEIGHT - 450 - 16);
        expect(result!.y).toBeGreaterThanOrEqual(1000);
      } finally {
        Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
      }
    });

    it('flips the tooltip to the left of the cursor when it would overflow the right edge', () => {
      const mousePos = makeMousePos(VIEWPORT_WIDTH - 100, 100);
      const result = parseTransform(assembleTransform(mousePos, null, 200, 400));
      expect(result).not.toBeNull();
      expect(result!.x).toBe(VIEWPORT_WIDTH - 100 - 400 - 32);
    });

    it('never places the tooltip past the left edge of the viewport', () => {
      const mousePos = makeMousePos(0, 100);
      const result = parseTransform(assembleTransform(mousePos, null, 200, 3000));
      expect(result).not.toBeNull();
      expect(result!.x).toBe(32);
    });

    it('never places the tooltip past the top of the viewport', () => {
      const mousePos = makeMousePos(400, -100);
      const result = parseTransform(assembleTransform(mousePos, null, 200, 400));
      expect(result).not.toBeNull();
      expect(result!.y).toBe(4);
    });
  });

  describe('when a pinnedPos is provided', () => {
    it('uses pinnedPos instead of the live mouse position', () => {
      const mousePos = makeMousePos(400, 100);
      const pinnedPos = {
        page: { x: 800, y: 200 },
        client: { x: 800, y: 200 },
        plotCanvas: { x: 800, y: 200 },
        target: null,
      };
      const result = parseTransform(assembleTransform(mousePos, pinnedPos, 200, 300));
      expect(result).toEqual({ x: 832, y: 216 });
    });
  });

  describe('when a container element is provided', () => {
    it('adjusts coordinates relative to the container', () => {
      const container = {
        getBoundingClientRect: () =>
          ({ top: 200, left: 100, width: 800, height: 400, right: 900, bottom: 600, x: 100, y: 200 }) as DOMRect,
        scrollLeft: 0,
        scrollTop: 0,
        scrollHeight: 400,
      } as unknown as Element;

      // Cursor at page (500, 250) → relative (400, 50); tooltip 100 tall fits inside container.
      const mousePos = makeMousePos(500, 250);
      const result = parseTransform(assembleTransform(mousePos, null, 100, 200, container));
      expect(result).not.toBeNull();
      expect(result).toEqual({ x: 432, y: 66 });
    });

    it('falls back to TOOLTIP_MAX_HEIGHT when tooltip size is unknown inside a container', () => {
      const container = {
        getBoundingClientRect: () =>
          ({ top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400, x: 0, y: 0 }) as DOMRect,
        scrollLeft: 0,
        scrollTop: 0,
        scrollHeight: 400,
      } as unknown as Element;

      const mousePos = makeMousePos(400, 300);
      const result = parseTransform(assembleTransform(mousePos, null, 0, 0, container));
      expect(result).not.toBeNull();
      expect(result!.y).toBe(4);
    });

    it('flips above the cursor inside a container when it does not fit below', () => {
      const container = {
        getBoundingClientRect: () =>
          ({ top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400, x: 0, y: 0 }) as DOMRect,
        scrollLeft: 0,
        scrollTop: 0,
        scrollHeight: 400,
      } as unknown as Element;

      const mousePos = makeMousePos(400, 300);
      const result = parseTransform(assembleTransform(mousePos, null, 100, 200, container));
      expect(result).not.toBeNull();
      expect(result!.y).toBe(300 - 100 - 16);
    });

    it('falls back to the container bottom when flipping would hide the tooltip top in a scrolled container', () => {
      const container = {
        getBoundingClientRect: () =>
          ({ top: 0, left: 0, width: 800, height: 400, right: 800, bottom: 400, x: 0, y: 0 }) as DOMRect,
        scrollLeft: 0,
        scrollTop: 200,
        scrollHeight: 500,
      } as unknown as Element;

      // Cursor at page y 100 → container y 300; a 300px tooltip fits neither below nor above it.
      const mousePos = makeMousePos(400, 100);
      const result = parseTransform(assembleTransform(mousePos, null, 300, 200, container));
      expect(result).not.toBeNull();
      expect(result!.y).toBe(500 - 300 - 16);
    });
  });
});

describe('getTooltipStyles', () => {
  const theme = createTheme();
  const pinnedPos: CursorCoordinates = {
    page: { x: 0, y: 0 },
    client: { x: 0, y: 0 },
    plotCanvas: { x: 0, y: 0 },
    target: null,
  };

  it('stacks a pinned tooltip above the table legend header and below the panel header', () => {
    const { zIndex } = getTooltipStyles(theme, pinnedPos);
    // react-virtuoso renders the table legend's sticky header at z-index 2.
    expect(zIndex).toBeGreaterThan(2);
    // PanelHeader in @perses-dev/dashboards sits at z-index 5.
    expect(zIndex).toBeLessThan(5);
  });

  it('stacks an unpinned tooltip at the theme tooltip layer', () => {
    expect(getTooltipStyles(theme, null).zIndex).toBe(theme.zIndex.tooltip);
  });
});
