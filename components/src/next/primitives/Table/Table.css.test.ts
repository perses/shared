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

import { readFileSync } from 'fs';
import { resolve } from 'path';

import { within } from '@testing-library/react';

const tableCss = readFileSync(resolve(__dirname, './table.css'), 'utf-8');

function ruleFor(css: string, selector: string): string {
  const start = css.indexOf(selector);
  if (start < 0) throw new Error(`missing rule ${selector}`);
  const open = css.indexOf('{', start);
  if (open < 0) throw new Error(`missing rule body for ${selector}`);
  let depth = 0;
  for (let index = open; index < css.length; index++) {
    if (css[index] === '{') depth++;
    else if (css[index] === '}' && --depth === 0) return css.slice(open + 1, index);
  }
  throw new Error(`unterminated rule for ${selector}`);
}

describe('Table CSS contracts', () => {
  const style = document.createElement('style');
  const container = document.createElement('div');

  beforeAll(() => {
    const layoutCss = readFileSync(resolve(__dirname, '../system/layout.css'), 'utf-8');
    // jsdom does not apply cascade layers; both stylesheets belong to the same component layer.
    style.textContent = [layoutCss, tableCss]
      .map((css) => css.replace('@layer perses.components {', '').replace(/}\s*$/, ''))
      .join('\n');
    document.head.append(style);
  });

  beforeEach(() => {
    document.body.append(container);
  });

  afterEach(() => {
    container.replaceChildren();
    container.remove();
  });

  afterAll(() => {
    style.remove();
  });

  it('gives fixed-layout tables an explicit, overridable width', () => {
    const rule = ruleFor(tableCss, ".ps-Table[data-table-layout='fixed']");
    expect(rule).toContain('min-width: 0;');
    expect(rule).toContain('width: 100%;');
    expect(rule).toContain('table-layout: fixed;');
  });

  it('uses a small nonwrapping width hint for fit-content cells without changing their padding', () => {
    container.innerHTML = `
      <table class="ps-Table" data-table-layout="auto">
        <thead class="ps-Table__head"><tr>
          <th class="ps-Table__cell" data-fit-content="true">Controls header</th>
          <th class="ps-Table__cell">Name</th>
        </tr></thead>
        <tbody class="ps-Table__body"><tr>
          <td class="ps-Table__cell" data-fit-content="true">Controls</td>
          <td class="ps-Table__cell">Data</td>
          <td class="ps-Table__cell" data-fit-content="false">Opt out</td>
        </tr></tbody>
        <tfoot class="ps-Table__footer"><tr>
          <td class="ps-Table__cell" data-fit-content="true">Footer control</td>
        </tr></tfoot>
      </table>
    `;

    const cells = within(container);
    const normalStyle = getComputedStyle(cells.getByRole('cell', { name: 'Data' }));
    for (const cell of [
      cells.getByRole('columnheader', { name: 'Controls header' }),
      cells.getByRole('cell', { name: 'Controls' }),
      cells.getByRole('cell', { name: 'Footer control' }),
    ]) {
      const cellStyle = getComputedStyle(cell);
      expect(cellStyle.width).toBe('1px');
      expect(cellStyle.whiteSpace).toBe('nowrap');
      expect(cellStyle.padding).toBe(normalStyle.padding);
    }
    expect(normalStyle.width).not.toBe('1px');
    expect(getComputedStyle(cells.getByRole('cell', { name: 'Opt out' })).width).not.toBe('1px');
  });

  it('lets an explicit cell width override the fit-content hint', () => {
    container.innerHTML = `
      <table class="ps-Table"><tbody><tr>
        <td class="ps-Table__cell" data-fit-content="true" style="width: 80px">Explicit width</td>
      </tr></tbody></table>
    `;

    const cell = within(container).getByRole('cell', { name: 'Explicit width' });
    expect(getComputedStyle(cell).width).toBe('80px');
    expect(getComputedStyle(cell).whiteSpace).toBe('nowrap');
  });

  it('does not apply an automatic-layout width hint to fixed-layout cells or nested tables', () => {
    container.innerHTML = `
      <table class="ps-Table" data-table-layout="auto"><tbody><tr>
        <td class="ps-Table__cell" data-fit-content="true">Outer control</td>
        <td class="ps-Table__cell">
          <table class="ps-Table" data-table-layout="fixed"><thead class="ps-Table__head"><tr>
            <th class="ps-Table__cell" data-fit-content="true">Unspecified fixed width</th>
            <th class="ps-Table__cell" data-fit-content="true" style="width: 48px">Explicit fixed width</th>
          </tr></thead></table>
        </td>
      </tr></tbody></table>
    `;

    const cells = within(container);
    expect(getComputedStyle(cells.getByRole('cell', { name: 'Outer control' })).width).toBe('1px');
    expect(getComputedStyle(cells.getByRole('columnheader', { name: 'Unspecified fixed width' })).width).not.toBe(
      '1px',
    );
    expect(getComputedStyle(cells.getByRole('columnheader', { name: 'Explicit fixed width' })).width).toBe('48px');
  });

  it.each([
    { attributes: '', striped: false },
    { attributes: 'data-striped="false"', striped: false },
    { attributes: 'data-striped="true"', striped: true },
  ])('alternates only body row backgrounds when striped=$striped ($attributes)', ({ attributes, striped }) => {
    container.innerHTML = `
      <table class="ps-Table" ${attributes}>
        <thead class="ps-Table__head">
          <tr class="ps-Table__row"><th class="ps-Table__cell">First header</th></tr>
          <tr class="ps-Table__row"><th class="ps-Table__cell">Second header</th></tr>
        </thead>
        <tbody class="ps-Table__body">
          <tr class="ps-Table__row"><td class="ps-Table__cell">First row</td></tr>
          <tr class="ps-Table__row"><td class="ps-Table__cell">Second row</td></tr>
          <tr class="ps-Table__row"><td class="ps-Table__cell">Third row</td></tr>
          <tr class="ps-Table__row"><td class="ps-Table__cell">Fourth row</td></tr>
        </tbody>
        <tfoot class="ps-Table__footer">
          <tr class="ps-Table__row"><td class="ps-Table__cell">First footer</td></tr>
          <tr class="ps-Table__row"><td class="ps-Table__cell">Second footer</td></tr>
        </tfoot>
      </table>
    `;

    const cells = within(container);
    for (const name of ['First row', 'Third row', 'First header', 'Second header', 'First footer', 'Second footer']) {
      expect(getComputedStyle(cells.getByRole('row', { name })).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    }
    for (const name of ['Second row', 'Fourth row']) {
      expect(getComputedStyle(cells.getByRole('row', { name })).backgroundColor).toBe(
        striped ? 'var(--perses-bg-sunken)' : 'rgba(0, 0, 0, 0)',
      );
    }
  });

  it.each(['left', 'right'])('matches sticky %s cell backgrounds to their striped rows', (sticky) => {
    container.innerHTML = `
      <table class="ps-Table" data-striped="true"><tbody class="ps-Table__body">
        <tr class="ps-Table__row"><td class="ps-Table__cell" data-sticky="${sticky}">First row</td></tr>
        <tr class="ps-Table__row"><td class="ps-Table__cell" data-sticky="${sticky}">Second row</td></tr>
      </tbody></table>
    `;

    const cells = within(container);
    expect(getComputedStyle(cells.getByRole('cell', { name: 'First row' })).backgroundColor).toBe(
      'var(--perses-bg-default)',
    );
    expect(getComputedStyle(cells.getByRole('cell', { name: 'Second row' })).backgroundColor).toBe(
      'var(--perses-bg-sunken)',
    );
  });

  it('preserves selection backgrounds on striped rows and their sticky cells', () => {
    container.innerHTML = `
      <table class="ps-Table" data-striped="true"><tbody class="ps-Table__body">
        <tr class="ps-Table__row"><td class="ps-Table__cell">First row</td></tr>
        <tr class="ps-Table__row" data-selected="true" data-hover="true">
          <td class="ps-Table__cell" data-sticky="left">Selected row</td>
        </tr>
        <tr class="ps-Table__row"><td class="ps-Table__cell">Third row</td></tr>
        <tr class="ps-Table__row"><td class="ps-Table__cell">Fourth row</td></tr>
      </tbody></table>
    `;

    const cells = within(container);
    expect(getComputedStyle(cells.getByRole('row', { name: 'Fourth row' })).backgroundColor).toBe(
      'var(--perses-bg-sunken)',
    );
    expect(getComputedStyle(cells.getByRole('row', { name: 'Selected row' })).backgroundColor).toBe(
      'var(--perses-status-bg-primary)',
    );
    expect(getComputedStyle(cells.getByRole('cell', { name: 'Selected row' })).backgroundColor).toBe(
      'var(--perses-status-bg-primary)',
    );
  });

  it('keeps nested table striping independent from its parent table', () => {
    container.innerHTML = `
      <table class="ps-Table" data-striped="true"><tbody class="ps-Table__body">
        <tr class="ps-Table__row"><td class="ps-Table__cell">First outer row</td></tr>
        <tr class="ps-Table__row" aria-label="Second outer row"><td class="ps-Table__cell">
          <table class="ps-Table"><tbody class="ps-Table__body">
            <tr class="ps-Table__row"><td class="ps-Table__cell">First nested row</td></tr>
            <tr class="ps-Table__row"><td class="ps-Table__cell" data-sticky="left">Second nested row</td></tr>
          </tbody></table>
          <table class="ps-Table" data-striped="true" aria-label="Nested striped table"><tbody class="ps-Table__body">
            <tr class="ps-Table__row"><td class="ps-Table__cell" data-sticky="left">First nested striped row</td></tr>
            <tr class="ps-Table__row"><td class="ps-Table__cell" data-sticky="right">Second nested striped row</td></tr>
          </tbody></table>
        </td></tr>
      </tbody></table>
    `;

    const cells = within(container);
    expect(getComputedStyle(cells.getByRole('row', { name: 'Second outer row' })).backgroundColor).toBe(
      'var(--perses-bg-sunken)',
    );
    const nestedTable = cells.getByRole('table', { name: 'Nested striped table' });
    // The table needs its own opaque baseline; transparent odd rows otherwise show the parent's stripe.
    expect(getComputedStyle(nestedTable).backgroundColor).toBe('var(--perses-bg-default)');
    expect(getComputedStyle(cells.getByRole('cell', { name: 'First nested striped row' })).backgroundColor).toBe(
      'var(--perses-bg-default)',
    );
    for (const name of ['First nested row', 'Second nested row', 'First nested striped row']) {
      expect(getComputedStyle(cells.getByRole('row', { name })).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    }
    expect(getComputedStyle(cells.getByRole('cell', { name: 'Second nested row' })).backgroundColor).toBe(
      'var(--perses-bg-default)',
    );
    expect(getComputedStyle(cells.getByRole('row', { name: 'Second nested striped row' })).backgroundColor).toBe(
      'var(--perses-bg-sunken)',
    );
    expect(getComputedStyle(cells.getByRole('cell', { name: 'Second nested striped row' })).backgroundColor).toBe(
      'var(--perses-bg-sunken)',
    );
  });

  it.each(['left', 'right'])('keeps a resizable %s column sticky without a sticky header', (sticky) => {
    container.innerHTML = `
      <table class="ps-Table">
        <thead class="ps-Table__head"><tr class="ps-Table__row">
          <th class="ps-Table__cell" data-sticky="${sticky}" data-resizable="true">Resizable column</th>
        </tr></thead>
      </table>
    `;

    const cell = within(container).getByRole('columnheader', { name: 'Resizable column' });
    expect(getComputedStyle(cell).position).toBe('sticky');
    expect(getComputedStyle(cell).getPropertyValue(sticky)).toBe('0px');
  });

  it('positions a nonsticky resizable cell relative to its resize handle', () => {
    container.innerHTML = `
      <table class="ps-Table"><tbody><tr>
        <td class="ps-Table__cell" data-resizable="true">Resizable cell</td>
      </tr></tbody></table>
    `;

    const cell = within(container).getByRole('cell', { name: 'Resizable cell' });
    expect(getComputedStyle(cell).position).toBe('relative');
  });

  it('honors explicit overflow style props in a fixed-layout table', () => {
    container.innerHTML = `
      <table class="ps-Table" data-table-layout="fixed"><tbody><tr>
        <td class="ps-Table__cell ps-overflow" style="--ps-overflow: visible">Explicit overflow</td>
        <td class="ps-Table__cell ps-overflow" style="--ps-overflow: auto; --ps-overflow-md: visible">Responsive overflow</td>
        <td class="ps-Table__cell">Default overflow</td>
      </tr></tbody></table>
      <div class="ps-overflow" style="--ps-overflow: visible" role="note">Overflow reference</div>
    `;

    // jsdom preserves unresolved CSS variables, so compare with the shared style utility outside the table.
    const overflow = getComputedStyle(within(container).getByRole('note')).overflow;
    expect(overflow).not.toBe('');
    for (const name of ['Explicit overflow', 'Responsive overflow']) {
      const cell = within(container).getByRole('cell', { name });
      expect(getComputedStyle(cell).overflow).toBe(overflow);
    }
    const defaultCell = within(container).getByRole('cell', { name: 'Default overflow' });
    expect(getComputedStyle(defaultCell).overflow).toBe('hidden');
    expect(getComputedStyle(defaultCell).textOverflow).toBe('ellipsis');
  });

  it('does not make a nested table header sticky unless that table opts in', () => {
    container.innerHTML = `
      <table class="ps-Table" data-sticky-header="true">
        <thead class="ps-Table__head"><tr class="ps-Table__row">
          <th class="ps-Table__cell">Outer header</th>
        </tr></thead>
        <tbody><tr><td>
          <table class="ps-Table">
            <thead class="ps-Table__head"><tr class="ps-Table__row">
              <th class="ps-Table__cell">Nested header</th>
            </tr></thead>
          </table>
          <table class="ps-Table" data-sticky-header="true">
            <thead class="ps-Table__head"><tr class="ps-Table__row">
              <th class="ps-Table__cell">Nested sticky header</th>
            </tr></thead>
          </table>
        </td></tr></tbody>
      </table>
    `;

    const cells = within(container);
    expect(getComputedStyle(cells.getByRole('columnheader', { name: 'Outer header' })).position).toBe('sticky');
    expect(getComputedStyle(cells.getByRole('columnheader', { name: 'Nested header' })).position).not.toBe('sticky');
    expect(getComputedStyle(cells.getByRole('columnheader', { name: 'Nested sticky header' })).position).toBe('sticky');
  });

  it('resets inherited truncation whitespace at a nested table boundary', () => {
    container.innerHTML = `
      <table class="ps-Table" data-table-layout="fixed"><tbody><tr><td class="ps-Table__cell">
        <table class="ps-Table" aria-label="Nested table"><tbody><tr>
          <td class="ps-Table__cell">Nested content</td>
        </tr></tbody></table>
      </td></tr></tbody></table>
    `;

    const table = within(container).getByRole('table', { name: 'Nested table' });
    expect(getComputedStyle(table).whiteSpace).toBe('normal');
  });

  it('does not truncate nested auto-layout cells inside a fixed-layout table', () => {
    container.innerHTML = `
      <table class="ps-Table" data-table-layout="fixed"><tbody><tr>
        <td class="ps-Table__cell">Outer cell</td>
        <td class="ps-Table__cell">
          <table class="ps-Table" data-table-layout="auto"><tbody><tr>
            <td class="ps-Table__cell">Nested auto cell</td>
          </tr></tbody></table>
          <table class="ps-Table" data-table-layout="fixed"><tbody><tr>
            <td class="ps-Table__cell">Nested fixed cell</td>
          </tr></tbody></table>
        </td>
      </tr></tbody></table>
    `;

    const cells = within(container);
    for (const name of ['Outer cell', 'Nested fixed cell']) {
      const cell = cells.getByRole('cell', { name });
      expect(getComputedStyle(cell).overflow).toBe('hidden');
      expect(getComputedStyle(cell).whiteSpace).toBe('nowrap');
    }
    const nestedCell = cells.getByRole('cell', { name: 'Nested auto cell' });
    expect(getComputedStyle(nestedCell).overflow).not.toBe('hidden');
    expect(getComputedStyle(nestedCell).whiteSpace).not.toBe('nowrap');
  });
});
