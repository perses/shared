import { tokens } from '../tokens';
import { blue, green, gray, orange, purple, red, white, black } from '../colors';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

describe('color constants', () => {
  const colorEntries = [
    ['blue', blue],
    ['green', green],
    ['gray', gray],
    ['orange', orange],
    ['purple', purple],
    ['red', red],
  ] as const;

  it.each(colorEntries)('%s has valid hex values for all stops', (_name, color) => {
    const stops = [50, 100, 150, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950] as const;
    for (const stop of stops) {
      expect(color[stop]).toMatch(HEX_PATTERN);
    }
  });

  it('white and black are valid hex', () => {
    expect(white).toMatch(HEX_PATTERN);
    expect(black).toMatch(HEX_PATTERN);
  });
});

describe('tokens object', () => {
  it('produces correct var() strings for primitive colors', () => {
    expect(tokens.color.blue[500]).toBe('var(--perses-color-blue-500)');
    expect(tokens.color.gray[100]).toBe('var(--perses-color-gray-100)');
    expect(tokens.color.red[50]).toBe('var(--perses-color-red-50)');
    expect(tokens.color.white).toBe('var(--perses-color-white)');
    expect(tokens.color.black).toBe('var(--perses-color-black)');
  });

  it('produces correct var() strings for semantic background tokens', () => {
    expect(tokens.bg.default).toBe('var(--perses-bg-default)');
    expect(tokens.bg.surface).toBe('var(--perses-bg-surface)');
    expect(tokens.bg.sunken).toBe('var(--perses-bg-sunken)');
    expect(tokens.bg.overlay).toBe('var(--perses-bg-overlay)');
    expect(tokens.bg.backdrop).toBe('var(--perses-bg-backdrop)');
    expect(tokens.bg.navigation).toBe('var(--perses-bg-navigation)');
  });

  it('produces correct var() strings for semantic border tokens', () => {
    expect(tokens.border.default).toBe('var(--perses-border-default)');
  });

  it('produces correct var() strings for semantic text tokens', () => {
    expect(tokens.text.primary).toBe('var(--perses-text-primary)');
    expect(tokens.text.link).toBe('var(--perses-text-link)');
    expect(tokens.text.disabled).toBe('var(--perses-text-disabled)');
  });

  it('produces correct var() strings for status tokens', () => {
    expect(tokens.status.success.bg).toBe('var(--perses-status-bg-success)');
    expect(tokens.status.success.bgHover).toBe('var(--perses-status-bg-success-hover)');
    expect(tokens.status.success.text).toBe('var(--perses-status-text-success)');
    expect(tokens.status.success.border).toBe('var(--perses-status-border-success)');
    expect(tokens.status.success.icon).toBe('var(--perses-status-icon-success)');

    expect(tokens.status.error.bg).toBe('var(--perses-status-bg-error)');
    expect(tokens.status.error.text).toBe('var(--perses-status-text-error)');
    expect(tokens.status.warning.border).toBe('var(--perses-status-border-warning)');
    expect(tokens.status.info.icon).toBe('var(--perses-status-icon-info)');
    expect(tokens.status.primary.bg).toBe('var(--perses-status-bg-primary)');
    expect(tokens.status.secondary.bgHover).toBe('var(--perses-status-bg-secondary-hover)');
  });

  it('has all 6 status roles with 5 properties each', () => {
    const roles = ['primary', 'secondary', 'error', 'warning', 'success', 'info'] as const;
    const properties = ['bg', 'bgHover', 'text', 'border', 'icon'] as const;
    for (const role of roles) {
      for (const prop of properties) {
        expect(tokens.status[role][prop]).toBeDefined();
        expect(tokens.status[role][prop]).toMatch(/^var\(--perses-status-/);
      }
    }
  });

  it('produces correct var() strings for spacing tokens', () => {
    expect(tokens.spacing[0]).toBe('var(--perses-spacing-0)');
    expect(tokens.spacing[1]).toBe('var(--perses-spacing-1)');
    expect(tokens.spacing[4]).toBe('var(--perses-spacing-4)');
    expect(tokens.spacing[12]).toBe('var(--perses-spacing-12)');
  });

  it('produces correct var() strings for radius tokens', () => {
    expect(tokens.radius.none).toBe('var(--perses-radius-none)');
    expect(tokens.radius.md).toBe('var(--perses-radius-md)');
    expect(tokens.radius.full).toBe('var(--perses-radius-full)');
  });

  it('produces correct var() strings for typography tokens', () => {
    expect(tokens.font.family).toBe('var(--perses-font-family)');
    expect(tokens.font.weight.bold).toBe('var(--perses-font-weight-bold)');
    expect(tokens.font.size.h1).toBe('var(--perses-font-size-h1)');
    expect(tokens.font.lineHeight.body1).toBe('var(--perses-line-height-body1)');
  });

  it('has all expected top-level categories', () => {
    expect(Object.keys(tokens)).toEqual(
      expect.arrayContaining(['color', 'bg', 'border', 'text', 'status', 'spacing', 'radius', 'font'])
    );
  });
});
