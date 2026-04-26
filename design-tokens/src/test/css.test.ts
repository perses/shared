import { readFileSync } from 'fs';
import { resolve } from 'path';
import { blue, green, gray, orange, purple, red, white, black, type PersesColor } from '../colors';

const cssDir = resolve(__dirname, '../css');

const readCss = (filename: string): string => readFileSync(resolve(cssDir, filename), 'utf-8');

describe('CSS layer declarations', () => {
  it('index.css declares layer order', () => {
    const css = readCss('index.css');
    expect(css).toContain('@layer perses.reset, perses.tokens, perses.semantic');
  });

  it('reset.css uses @layer perses.reset', () => {
    const css = readCss('reset.css');
    expect(css).toContain('@layer perses.reset');
  });

  it('tokens.css uses @layer perses.tokens', () => {
    const css = readCss('tokens.css');
    expect(css).toContain('@layer perses.tokens');
  });

  it('semantic.css uses @layer perses.semantic', () => {
    const css = readCss('semantic.css');
    expect(css).toContain('@layer perses.semantic');
  });
});

describe('CSS primitive color variables', () => {
  const tokensCss = readCss('tokens.css');
  const tokensCssUpper = tokensCss.toUpperCase();

  const hues: Array<[string, PersesColor]> = [
    ['blue', blue],
    ['green', green],
    ['gray', gray],
    ['orange', orange],
    ['purple', purple],
    ['red', red],
  ];

  const stops = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950] as const;

  it.each(hues)('tokens.css defines all %s color variables', (hue, colorObj) => {
    for (const stop of stops) {
      expect(tokensCss).toContain(`--perses-color-${hue}-${stop}`);
      expect(tokensCssUpper).toContain(colorObj[stop].toUpperCase());
    }
  });

  it('tokens.css defines white and black', () => {
    expect(tokensCss).toContain('--perses-color-white');
    expect(tokensCss).toContain('--perses-color-black');
    expect(tokensCssUpper).toContain(white.toUpperCase());
    expect(tokensCssUpper).toContain(black.toUpperCase());
  });
});

describe('CSS semantic variables', () => {
  const semanticCss = readCss('semantic.css');

  it('defines light mode defaults on :root', () => {
    expect(semanticCss).toContain(':root {');
    expect(semanticCss).toContain('--perses-bg-default');
    expect(semanticCss).toContain('--perses-text-primary');
  });

  it('defines dark mode via data attribute', () => {
    expect(semanticCss).toContain(`[data-perses-mode='dark']`);
  });

  it('has all background semantic tokens', () => {
    const bgTokens = ['default', 'surface', 'sunken', 'overlay', 'backdrop', 'navigation'];
    for (const name of bgTokens) {
      expect(semanticCss).toContain(`--perses-bg-${name}`);
    }
  });

  it('has border semantic token', () => {
    expect(semanticCss).toContain('--perses-border-default');
  });

  it('has all text semantic tokens', () => {
    const textTokens = ['primary', 'secondary', 'disabled', 'link', 'link-hover', 'navigation', 'accent'];
    for (const name of textTokens) {
      expect(semanticCss).toContain(`--perses-text-${name}`);
    }
  });

  it('has all status tokens with property-scoped naming', () => {
    const roles = ['primary', 'secondary', 'error', 'warning', 'success', 'info'];
    const properties = ['bg', 'text', 'border', 'icon'];
    for (const role of roles) {
      for (const prop of properties) {
        expect(semanticCss).toContain(`--perses-status-${prop}-${role}`);
      }
      expect(semanticCss).toContain(`--perses-status-bg-${role}-hover`);
    }
  });
});
