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
const booleanMarkers = [
  { marker: undefined, present: false },
  { marker: '', present: true },
  { marker: 'true', present: true },
  { marker: 'false', present: true },
];

describe('Table CSS contracts', () => {
  const style = document.createElement('style');
  const container = document.createElement('div');

  beforeAll(() => {
    const layoutCss = readFileSync(resolve(__dirname, '../system/layout.css'), 'utf-8');
    // jsdom does not apply cascade layers; both stylesheets belong to the same component layer.
    style.textContent = [layoutCss, tableCss]
      .map((css) =>
        css
          .replace(/@import\s+[^;]+;/g, '')
          .replace(/@layer perses\.(components|utilities)\s*\{/, '')
          .replace(/}\s*$/, ''),
      )
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
    container.innerHTML = '<table class="ps-Table" data-table-layout="fixed" aria-label="Fixed table"></table>';
    const table = within(container).getByRole('table', { name: 'Fixed table' });
    expect(getComputedStyle(table).minWidth).toBe('0');
    expect(getComputedStyle(table).width).toBe('100%');
    expect(getComputedStyle(table).tableLayout).toBe('fixed');

    table.style.width = '80px';
    expect(getComputedStyle(table).width).toBe('80px');
  });

  it('uses a small nonwrapping width hint for fit-content cells without changing their padding', () => {
    container.innerHTML = `
      <table class="ps-Table" data-table-layout="auto">
        <thead class="ps-Table__head"><tr>
          <th class="ps-Table__cell" data-fit-content="">Controls header</th>
          <th class="ps-Table__cell">Name</th>
        </tr></thead>
        <tbody class="ps-Table__body"><tr>
          <td class="ps-Table__cell" data-fit-content="">Controls</td>
          <td class="ps-Table__cell">Data</td>
          <td class="ps-Table__cell" data-fit-content="false">False string</td>
                    <td class="ps-Table__cell" data-fit-content="true">Legacy true</td>
        </tr></tbody>
        <tfoot class="ps-Table__footer"><tr>
          <td class="ps-Table__cell" data-fit-content="">Footer control</td>
        </tr></tfoot>
      </table>
    `;

    const cells = within(container);
    const normalStyle = getComputedStyle(cells.getByRole('cell', { name: 'Data' }));
    for (const cell of [
      cells.getByRole('columnheader', { name: 'Controls header' }),
      cells.getByRole('cell', { name: 'Controls' }),
      cells.getByRole('cell', { name: 'Footer control' }),
      cells.getByRole('cell', { name: 'False string' }),
      cells.getByRole('cell', { name: 'Legacy true' }),
    ]) {
      const cellStyle = getComputedStyle(cell);
      expect(cellStyle.width).toBe('1px');
      expect(cellStyle.whiteSpace).toBe('nowrap');
      expect(cellStyle.padding).toBe(normalStyle.padding);
    }
    expect(normalStyle.width).not.toBe('1px');
  });

  it('lets an explicit cell width override the fit-content hint', () => {
    container.innerHTML = `
      <table class="ps-Table"><tbody><tr>
        <td class="ps-Table__cell" data-fit-content="" style="width: 80px">Explicit width</td>
      </tr></tbody></table>
    `;

    const cell = within(container).getByRole('cell', { name: 'Explicit width' });
    expect(getComputedStyle(cell).width).toBe('80px');
    expect(getComputedStyle(cell).whiteSpace).toBe('nowrap');
  });

  it('does not apply an automatic-layout width hint to fixed-layout cells or nested tables', () => {
    container.innerHTML = `
      <table class="ps-Table" data-table-layout="auto"><tbody><tr>
        <td class="ps-Table__cell" data-fit-content="">Outer control</td>
        <td class="ps-Table__cell">
          <table class="ps-Table" data-table-layout="fixed"><thead class="ps-Table__head"><tr>
            <th class="ps-Table__cell" data-fit-content="">Unspecified fixed width</th>
            <th class="ps-Table__cell" data-fit-content="" style="width: 48px">Explicit fixed width</th>
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
    { attributes: 'data-striped=""', striped: true },
    { attributes: 'data-striped="false"', striped: true },
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
      <table class="ps-Table" data-striped=""><tbody class="ps-Table__body">
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

  it.each(booleanMarkers)(
    'preserves selection precedence over striping and sticky backgrounds with data-selected=$marker',
    ({ marker, present }) => {
      const attributes = marker === undefined ? '' : `data-selected="${marker}"`;
      container.innerHTML = `
        <table class="ps-Table" data-striped=""><tbody class="ps-Table__body">
          <tr class="ps-Table__row"><td class="ps-Table__cell">First row</td></tr>
          <tr class="ps-Table__row" ${attributes} data-hover="" aria-label="Selected row">
            <td class="ps-Table__cell" data-sticky="left">Selected left cell</td>
            <td class="ps-Table__cell" data-sticky="right">Selected right cell</td>
          </tr>
          <tr class="ps-Table__row"><td class="ps-Table__cell">Third row</td></tr>
          <tr class="ps-Table__row"><td class="ps-Table__cell">Fourth row</td></tr>
        </tbody></table>
      `;

      const cells = within(container);
      expect(getComputedStyle(cells.getByRole('row', { name: 'Fourth row' })).backgroundColor).toBe(
        'var(--perses-bg-sunken)',
      );
      const background = present ? 'var(--perses-status-bg-primary)' : 'var(--perses-bg-sunken)';
      expect(getComputedStyle(cells.getByRole('row', { name: 'Selected row' })).backgroundColor).toBe(background);
      for (const name of ['Selected left cell', 'Selected right cell']) {
        expect(getComputedStyle(cells.getByRole('cell', { name })).backgroundColor).toBe(background);
      }
    },
  );

  it('keeps nested table striping independent from its parent table', () => {
    container.innerHTML = `
      <table class="ps-Table" data-striped=""><tbody class="ps-Table__body">
        <tr class="ps-Table__row"><td class="ps-Table__cell">First outer row</td></tr>
        <tr class="ps-Table__row" aria-label="Second outer row"><td class="ps-Table__cell">
          <table class="ps-Table"><tbody class="ps-Table__body">
            <tr class="ps-Table__row"><td class="ps-Table__cell">First nested row</td></tr>
            <tr class="ps-Table__row"><td class="ps-Table__cell" data-sticky="left">Second nested row</td></tr>
          </tbody></table>
          <table class="ps-Table" data-striped="" aria-label="Nested striped table"><tbody class="ps-Table__body">
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
          <th class="ps-Table__cell" data-sticky="${sticky}" data-resizable="">Resizable column</th>
        </tr></thead>
      </table>
    `;

    const cell = within(container).getByRole('columnheader', { name: 'Resizable column' });
    expect(getComputedStyle(cell).position).toBe('sticky');
    expect(getComputedStyle(cell).getPropertyValue(sticky)).toBe('0px');
  });

  it.each(booleanMarkers)(
    'positions only present nonsticky resizable markers relative to their handle (data-resizable=$marker)',
    ({ marker, present }) => {
      const attributes = marker === undefined ? '' : `data-resizable="${marker}"`;
      container.innerHTML = `
        <table class="ps-Table"><tbody><tr>
          <td class="ps-Table__cell" ${attributes}>Resizable cell</td>
        </tr></tbody></table>
      `;

      const cell = within(container).getByRole('cell', { name: 'Resizable cell' });
      if (present) expect(getComputedStyle(cell).position).toBe('relative');
      else expect(getComputedStyle(cell).position).not.toBe('relative');
    },
  );

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

  it.each(booleanMarkers)(
    'keeps sticky header, column and resize precedence with data-sticky-header=$marker',
    ({ marker, present }) => {
      const attributes = marker === undefined ? '' : `data-sticky-header="${marker}"`;
      container.innerHTML = `
        <table class="ps-Table" ${attributes}>
          <thead class="ps-Table__head"><tr class="ps-Table__row">
            <th class="ps-Table__cell" data-resizable="">Header</th>
            <th class="ps-Table__cell" data-resizable="" data-sticky="left">Left header</th>
            <th class="ps-Table__cell" data-resizable="" data-sticky="right">Right header</th>
          </tr></thead>
        </table>
      `;

      const header = within(container).getByRole('columnheader', { name: 'Header' });
      expect(getComputedStyle(header).position).toBe(present ? 'sticky' : 'relative');
      expect(getComputedStyle(header).zIndex).toBe(present ? '1' : '');
      for (const [name, side] of [
        ['Left header', 'left'],
        ['Right header', 'right'],
      ] as const) {
        const cell = within(container).getByRole('columnheader', { name });
        const cellStyle = getComputedStyle(cell);
        expect(cellStyle.position).toBe('sticky');
        expect(cellStyle.getPropertyValue(side)).toBe('0px');
        expect(cellStyle.top).toBe(present ? '0px' : '');
        expect(cellStyle.zIndex).toBe(present ? '2' : '1');
        expect(cellStyle.backgroundColor).toBe('var(--perses-bg-default)');
      }
    },
  );

  it.each(booleanMarkers)('styles sort and expand icons by marker presence (marker=$marker)', ({ marker, present }) => {
    const active = marker === undefined ? '' : `data-active="${marker}"`;
    const expanded = marker === undefined ? '' : `data-expanded="${marker}"`;
    container.innerHTML = `
        <button class="ps-TableSortLabel" ${active} data-direction="asc" aria-label="Sort">
          <span class="ps-TableSortLabel__icon" aria-label="Sort icon"></span>
        </button>
        <button class="ps-TableRowExpandButton" ${expanded} aria-label="Expand">
          <span class="ps-TableRowExpandButton__icon" aria-label="Expand icon"></span>
        </button>
      `;

    const sortIcon = within(container).getByLabelText('Sort icon');
    expect(getComputedStyle(sortIcon).opacity).toBe(present ? '1' : '0.35');
    expect(getComputedStyle(sortIcon).transform).toBe('rotate(180deg)');
    const expandIcon = within(container).getByLabelText('Expand icon');
    if (present) expect(getComputedStyle(expandIcon).transform).toBe('rotate(90deg)');
    else expect(getComputedStyle(expandIcon).transform).not.toBe('rotate(90deg)');
  });

  it('does not make a nested table header sticky unless that table opts in', () => {
    container.innerHTML = `
      <table class="ps-Table" data-sticky-header="">
        <thead class="ps-Table__head"><tr class="ps-Table__row">
          <th class="ps-Table__cell">Outer header</th>
        </tr></thead>
        <tbody><tr><td>
          <table class="ps-Table">
            <thead class="ps-Table__head"><tr class="ps-Table__row">
              <th class="ps-Table__cell">Nested header</th>
            </tr></thead>
          </table>
          <table class="ps-Table" data-sticky-header="">
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
