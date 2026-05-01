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

import { parseVariables, replaceVariable, replaceVariables, VariableStateMap } from './variable-interpolation';

describe('parseVariables()', () => {
  const tests = [
    {
      text: 'hello $var1 world $var2',
      variables: ['var1', 'var2'],
    },
  ];

  tests.forEach(({ text, variables }) => {
    it(`parses ${text}`, () => {
      expect(parseVariables(text)).toEqual(variables);
    });
  });
});

describe('replaceVariable()', () => {
  const tests = [
    {
      text: 'hello $var1',
      varName: 'var1',
      value: 'world',
      expected: 'hello world',
    },
    {
      text: 'hello $var1 $var1',
      varName: 'var1',
      value: 'world',
      expected: 'hello world world',
    },
    {
      text: 'hello $var1',
      varName: 'var1',
      value: ['world', 'w'],
      expected: 'hello (world|w)',
    },
    {
      text: 'hello $var1 $var1',
      varName: 'var1',
      value: ['world', 'w'],
      expected: 'hello (world|w) (world|w)',
    },
  ];

  tests.forEach(({ text, value, varName, expected }) => {
    it(`replaces ${text} ${value}`, () => {
      expect(replaceVariable(text, varName, value)).toEqual(expected);
    });
  });
});

describe('replaceVariables()', () => {
  const tests = [
    {
      text: 'hello $var1 $var2',
      state: {
        var1: { value: 'world', loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello world world',
    },
    {
      text: 'hello $var1 $var2',
      state: {
        var1: { value: 'world', loading: false },
        var2: { value: ['a', 'b'], loading: false },
      },
      expected: 'hello world (a|b)',
    },
    {
      text: 'hello $var1 $var2 $var3',
      state: {
        var1: { value: 'world', loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello world world $var3',
    },
  ];

  tests.forEach(({ text, state, expected }) => {
    it(`replaces ${text} ${JSON.stringify(state)}`, () => {
      expect(replaceVariables(text, state)).toEqual(expected);
    });
  });
});

describe('replaceVariables() with custom formats', () => {
  const tests = [
    // csv
    {
      text: 'hello ${var1:csv} ${var2:csv}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,prometheus world',
    },
    // distributed
    {
      text: 'hello ${var1:distributed} ${var2:distributed}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,var1=prometheus world',
    },
    {
      text: 'hello ${var1:distributed} ${var2:distributed}',
      state: {
        var1: { value: ['perses', 'prometheus', 'timeseries'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,var1=prometheus,var1=timeseries world',
    },
    // doublequote
    {
      text: 'hello ${var1:doublequote} ${var2:doublequote}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello "perses","prometheus" "world"',
    },
    // glob
    {
      text: 'hello ${var1:glob} ${var2:glob}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello {perses,prometheus} {world}',
    },
    // json
    {
      text: 'hello ${var1:json} ${var2:json}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello ["perses","prometheus"] ["world"]',
    },
    // json stringified object
    {
      text: 'hello ${var1:json} ${var2:json}',
      state: {
        var1: { value: ['{"one":"perses","two":"prometheus"}', '{"second":"value"}'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello [{"one":"perses","two":"prometheus"},{"second":"value"}] ["world"]',
    },
    // lucene
    {
      text: 'hello ${var1:lucene} ${var2:lucene}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello ("perses" OR "prometheus") ("world")',
    },
    // percentencode
    {
      text: 'hello ${var1:percentencode} ${var2:percentencode}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses%2Cprometheus world',
    },
    // pipe
    {
      text: 'hello ${var1:pipe} ${var2:pipe}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses|prometheus world',
    },
    // raw
    {
      text: 'hello ${var1:raw} ${var2:raw}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses,prometheus world',
    },
    // regex
    {
      text: 'hello ${var1:regex} ${var2:regex}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello (perses|prometheus) (world)',
    },
    {
      text: 'hello ${var1:regex} ${var2:regex}',
      state: {
        var1: { value: ['perses.', 'prometheus$'], loading: false },
        var2: { value: 'world.', loading: false },
      },
      expected: 'hello (perses\\.|prometheus\\$) (world\\.)',
    },
    // singlequote
    {
      text: 'hello ${var1:singlequote} ${var2:singlequote}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: "hello 'perses','prometheus' 'world'",
    },
    // sqlstring
    {
      text: 'hello ${var1:sqlstring} ${var2:sqlstring}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: "hello 'perses','prometheus' 'world'",
    },
    {
      text: 'hello ${var1:sqlstring} ${var2:sqlstring}',
      state: {
        var1: { value: ["perses'", 'prometheus'], loading: false },
        var2: { value: "world'", loading: false },
      },
      expected: "hello 'perses''','prometheus' 'world'''",
    },
    // text
    {
      text: 'hello ${var1:text} ${var2:text}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello perses + prometheus world',
    },
    // queryparam
    {
      text: 'hello ${var1:queryparam} ${var2:queryparam}',
      state: {
        var1: { value: ['perses', 'prometheus'], loading: false },
        var2: { value: 'world', loading: false },
      },
      expected: 'hello var1=perses&var1=prometheus var2=world',
    },
  ];

  tests.forEach(({ text, state, expected }) => {
    it(`replaces ${text} ${JSON.stringify(state)}`, () => {
      expect(replaceVariables(text, state)).toEqual(expected);
    });
  });
});

// LOGZ.IO CHANGE START:: Tests for fixed-point variable interpolation [APPZ-2474]
describe('replaceVariables() with recursive interpolation', () => {
  // Annotate as VariableStateMap[] so TS doesn't widen heterogeneous shapes into a union with
  // optional fields (which conflicts with VariableStateMap's required-VariableState index sig).
  const tests: Array<{ name: string; text: string; state: VariableStateMap; expected: string }> = [
    {
      name: 'two-step recursion: $a -> "world-$b" -> "world-foo"',
      text: '$a',
      state: {
        a: { value: 'world-$b', loading: false },
        b: { value: 'foo', loading: false },
      },
      expected: 'world-foo',
    },
    {
      name: 'three-step chain: $a -> $b -> $c -> "final"',
      text: '$a',
      state: {
        a: { value: '$b', loading: false },
        b: { value: '$c', loading: false },
        c: { value: 'final', loading: false },
      },
      expected: 'final',
    },
    {
      name: 'bug repro: customAllValue with nested $type resolves through $name',
      text: 'rate(node_cpu_seconds_total{instance=~"$name"}[5m])',
      state: {
        name: { value: '.+-$type-.+', loading: false },
        type: { value: 'worker', loading: false },
      },
      expected: 'rate(node_cpu_seconds_total{instance=~".+-worker-.+"}[5m])',
    },
    {
      name: 'original behavior preserved: both vars in original text',
      text: '$a $b',
      state: {
        a: { value: '$b', loading: false },
        b: { value: 'X', loading: false },
      },
      expected: 'X X',
    },
    {
      name: 'format spec inside an interpolated value',
      text: '$a',
      state: {
        a: { value: '${b:csv}', loading: false },
        b: { value: ['x', 'y'], loading: false },
      },
      expected: 'x,y',
    },
    {
      name: 'inner var unresolved stays literal (no infinite loop)',
      text: '$a',
      state: {
        a: { value: '$missing', loading: false },
      },
      expected: '$missing',
    },
  ];

  tests.forEach(({ name, text, state, expected }) => {
    it(name, () => {
      expect(replaceVariables(text, state)).toEqual(expected);
    });
  });

  it('breaks two-variable cycles without throwing and warns once', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = replaceVariables('$a', {
        a: { value: '$b', loading: false },
        b: { value: '$a', loading: false },
      });
      // The exact text on overflow is implementation-defined ($a or $b);
      // the contract is "doesn't throw, warns once, returns a string".
      expect(typeof result).toBe('string');
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.mock.calls[0]?.[0]).toMatch(/max interpolation depth/i);
    } finally {
      warn.mockRestore();
    }
  });

  it('handles self-cycles without infinite loop', () => {
    // $a -> "$a" replaces to itself; fixed-point detection exits on the first pass.
    // Depth cap is never hit, so no warning is emitted — the loop is just a no-op.
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const result = replaceVariables('$a', {
        a: { value: '$a', loading: false },
      });
      expect(result).toBe('$a');
      expect(warn).not.toHaveBeenCalled();
    } finally {
      warn.mockRestore();
    }
  });

  it('warns when a non-cyclic chain exceeds max depth', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      // 12-link chain: v0 -> $v1 -> $v2 -> ... -> $v11 -> "end"
      // At depth 10 we'd still have $v10 unresolved → warning fires.
      const state: Record<string, { value: string; loading: boolean }> = {};
      for (let i = 0; i < 11; i++) {
        state[`v${i}`] = { value: `$v${i + 1}`, loading: false };
      }
      state['v11'] = { value: 'end', loading: false };
      const result = replaceVariables('$v0', state);
      expect(typeof result).toBe('string');
      expect(warn).toHaveBeenCalledTimes(1);
    } finally {
      warn.mockRestore();
    }
  });
});
// LOGZ.IO CHANGE END:: Tests for fixed-point variable interpolation [APPZ-2474]
