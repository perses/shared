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

import { assembleTransform } from './utils';
import { CursorData, TOOLTIP_MAX_HEIGHT, TOOLTIP_MAX_WIDTH } from './tooltip-model';

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
    it('uses TOOLTIP_MAX_HEIGHT as fallback and clamps against the viewport bottom', () => {
      const mousePos = makeMousePos(800, 400);
      const result = parseTransform(assembleTransform(mousePos, null, 0, 0));
      expect(result).not.toBeNull();
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

    it('clamps y so the tooltip does not extend past the viewport bottom', () => {
      const mousePos = makeMousePos(400, 600);
      const result = parseTransform(assembleTransform(mousePos, null, 400, 300));
      expect(result).not.toBeNull();
      expect(result!.y).toBe(VIEWPORT_HEIGHT - 400 - 16);
      expect(result!.y + 400).toBeLessThanOrEqual(VIEWPORT_HEIGHT);
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
  });
});
