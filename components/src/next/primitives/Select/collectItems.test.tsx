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

import { Fragment, isValidElement } from 'react';

import { collectItems, getSearchLabel, optionsFromItems } from './collectItems';
import { SelectGroup } from './SelectGroup';
import { SelectItem } from './SelectItem';
import { optionKey } from './selectValue';

describe('collectItems', () => {
  it('uses SelectItem label, then plain-text children, then String(value) as the search label', () => {
    const options = collectItems([
      <SelectItem key="b" value="b" label="Bytes">
        <b>B</b>
      </SelectItem>,
      <SelectItem key="s" value="s">
        Seconds
      </SelectItem>,
      <SelectItem key="n" value={3}>
        {2} + {1}
      </SelectItem>,
      <SelectItem key="r" value="r">
        <em>Rich</em>
      </SelectItem>,
    ]);

    expect(options.map((option) => option.label)).toEqual(['Bytes', 'Seconds', '2 + 1', 'r']);
  });

  it('keeps rich children as content and reads disabled', () => {
    const options = collectItems([
      <SelectItem key="r" value="r">
        <em>Rich</em>
      </SelectItem>,
      <SelectItem key="d" value="d" disabled>
        Disabled
      </SelectItem>,
    ]);

    expect(isValidElement(options[0]?.content)).toBe(true);
    expect(options[0]?.disabled).toBe(false);
    expect(options[1]?.disabled).toBe(true);
  });

  it('walks groups and fragments in document order', () => {
    const options = collectItems([
      <SelectGroup key="g" label="Group">
        <SelectItem value={1}>One</SelectItem>
      </SelectGroup>,
      <Fragment key="f">
        <SelectItem value={2}>Two</SelectItem>
      </Fragment>,
      <SelectItem key="i" value={3}>
        Three
      </SelectItem>,
    ]);

    expect(options.map((option) => option.value)).toEqual([1, 2, 3]);
  });
});

describe('optionsFromItems', () => {
  it('maps data items with their label as content', () => {
    expect(optionsFromItems([{ value: 1, label: 'One', disabled: true }])).toEqual([
      { value: 1, label: 'One', content: 'One', disabled: true },
    ]);
    expect(optionsFromItems([{ value: 2, label: 'Two' }])[0]?.disabled).toBe(false);
  });
});

describe('getSearchLabel', () => {
  it('prefers label, then plain-text children, then String(value)', () => {
    expect(getSearchLabel('a', <b>A</b>, 'Alpha')).toBe('Alpha');
    expect(getSearchLabel('a', ['x', 1])).toBe('x1');
    expect(getSearchLabel(7, <b>A</b>)).toBe('7');
  });
});

describe('optionKey', () => {
  it('gives 1 and "1" distinct keys', () => {
    expect(optionKey(1)).not.toEqual(optionKey('1'));
  });
});
