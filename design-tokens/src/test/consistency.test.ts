import { readFileSync } from 'fs';
import { resolve } from 'path';
import { tokens } from '../tokens';

const cssDir = resolve(__dirname, '../css');
const readCss = (f: string): string => readFileSync(resolve(cssDir, f), 'utf-8');

function extractCssVarDefinitions(...files: string[]): Set<string> {
  const vars = new Set<string>();
  for (const file of files) {
    const css = readCss(file);
    for (const match of css.matchAll(/^\s*(--perses-[\w-]+)\s*:/gm)) {
      vars.add(match[1]!);
    }
  }
  return vars;
}

function extractTokenVarRefs(obj: Record<string, unknown>): Set<string> {
  const vars = new Set<string>();
  for (const value of Object.values(obj)) {
    if (typeof value === 'string') {
      const match = value.match(/^var\((--perses-[\w-]+)\)$/);
      if (match) vars.add(match[1]!);
    } else if (typeof value === 'object' && value !== null) {
      for (const v of extractTokenVarRefs(value as Record<string, unknown>)) {
        vars.add(v);
      }
    }
  }
  return vars;
}

describe('token ↔ CSS consistency', () => {
  const cssVars = extractCssVarDefinitions('tokens.css', 'semantic.css');
  const tokenVars = extractTokenVarRefs(tokens as unknown as Record<string, unknown>);

  it('every CSS variable has a corresponding tokens entry', () => {
    const missing = [...cssVars].filter((v) => !tokenVars.has(v)).sort();
    expect(missing).toEqual([]);
  });

  it('every tokens entry references a defined CSS variable', () => {
    const missing = [...tokenVars].filter((v) => !cssVars.has(v)).sort();
    expect(missing).toEqual([]);
  });
});
