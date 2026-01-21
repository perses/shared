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

import {
  replaceDataFields,
  replaceDataFieldsBatch,
  hasBatchPatterns,
  hasIndexedPatterns,
  hasDataFieldPatterns,
  extractFieldNames,
} from './data-field-interpolation';

describe('replaceDataFields()', () => {
  describe('basic field replacement', () => {
    it('replaces single field with URL encoding', () => {
      const result = replaceDataFields('https://example.com?name=${__data.fields["name"]}', { name: 'hello world' });
      expect(result.text).toBe('https://example.com?name=hello%20world');
      expect(result.errors).toBeUndefined();
    });

    it('replaces multiple fields', () => {
      const result = replaceDataFields('https://example.com?name=${__data.fields["name"]}&id=${__data.fields["id"]}', {
        name: 'test',
        id: '123',
      });
      expect(result.text).toBe('https://example.com?name=test&id=123');
      expect(result.errors).toBeUndefined();
    });

    it('handles special characters with URL encoding', () => {
      const result = replaceDataFields('${__data.fields["value"]}', { value: 'hello&world=test' });
      expect(result.text).toBe('hello%26world%3Dtest');
    });

    it('can disable URL encoding', () => {
      const result = replaceDataFields('${__data.fields["value"]}', { value: 'hello&world' }, { urlEncode: false });
      expect(result.text).toBe('hello&world');
    });
  });

  describe('value conversion', () => {
    it('converts numbers to strings', () => {
      const result = replaceDataFields('${__data.fields["count"]}', { count: 42 });
      expect(result.text).toBe('42');
    });

    it('converts booleans to strings', () => {
      const result = replaceDataFields('${__data.fields["active"]}', { active: true });
      expect(result.text).toBe('true');
    });

    it('converts objects to JSON strings', () => {
      const result = replaceDataFields('${__data.fields["data"]}', { data: { key: 'value' } });
      expect(result.text).toBe('%7B%22key%22%3A%22value%22%7D');
    });

    it('handles null values as empty string', () => {
      const result = replaceDataFields('${__data.fields["value"]}', { value: null });
      expect(result.text).toBe('');
    });

    it('handles undefined values as empty string', () => {
      const result = replaceDataFields('${__data.fields["value"]}', {});
      expect(result.text).toBe('');
      expect(result.errors).toEqual(['Field "value" not found in data']);
    });
  });

  describe('format specifiers', () => {
    it('applies csv format', () => {
      const result = replaceDataFields('${__data.fields["value"]:csv}', { value: 'test' });
      expect(result.text).toBe('test');
    });

    it('applies pipe format', () => {
      const result = replaceDataFields('${__data.fields["value"]:pipe}', { value: 'test' });
      expect(result.text).toBe('test');
    });

    it('applies regex format with escaping', () => {
      const result = replaceDataFields('${__data.fields["value"]:regex}', { value: 'test.value' });
      expect(result.text).toBe('(test\\.value)');
    });

    describe('special urlEncode and format handling', () => {
      it('should not encode when urlEncode is true and format is RAW', () => {
        const item = { foo: 'a b/c?d' };
        const template = '${__data.fields["foo"]:raw}';
        const result = replaceDataFields(template, item, { urlEncode: true });
        expect(result.text).toBe('a b/c?d');
      });

      it('should avoid double encoding when urlEncode is true and format is queryparam', () => {
        const item = { foo: 'a b/c?d' };
        const template = "${__data.fields['foo']:queryparam}";
        const result = replaceDataFields(template, item, { urlEncode: true });
        // Should only encode once, not double encode
        expect(result.text).toBe('foo=a%20b%2Fc%3Fd');
      });

      it('should avoid double encoding when urlEncode is true and format is percentencode', () => {
        const item = { foo: 'a b/c?d' };
        const template = '${__data.fields["foo"]:percentencode}';
        const result = replaceDataFields(template, item, { urlEncode: true });
        // Should only encode once, not double encode
        expect(result.text).toBe('a%20b%2Fc%3Fd');
      });

      it('should encode when urlEncode is true and no format is specified', () => {
        const item = { foo: 'a b/c?d' };
        const template = '${__data.fields["foo"]}';
        const result = replaceDataFields(template, item, { urlEncode: true });
        expect(result.text).toBe('a%20b%2Fc%3Fd');
      });

      it('should not encode when urlEncode is false and no format is specified', () => {
        const item = { foo: 'a b/c?d' };
        const template = '${__data.fields["foo"]}';
        const result = replaceDataFields(template, item, { urlEncode: false });
        expect(result.text).toBe('a b/c?d');
      });
    });
    it('applies json format', () => {
      const result = replaceDataFields('${__data.fields["value"]:json}', { value: 'test' });
      expect(result.text).toBe('["test"]');
    });
  });

  describe('error handling', () => {
    it('reports missing field error', () => {
      const result = replaceDataFields('${__data.fields["missing"]}', { other: 'value' });
      expect(result.errors).toEqual(['Field "missing" not found in data']);
    });

    it('reports multiple missing field errors', () => {
      const result = replaceDataFields('${__data.fields["missing1"]} ${__data.fields["missing2"]}', { other: 'value' });
      expect(result.errors).toEqual(['Field "missing1" not found in data', 'Field "missing2" not found in data']);
    });
  });

  describe('index, count and complete data options', () => {
    it('replaces __data', () => {
      const result = replaceDataFields('Item ${__data}', { name: 'test', lastname: 'foo' }, { index: 2 });
      expect(result.text).toBe('Item "test","foo"');
    });

    it('replaces __data:json', () => {
      const result = replaceDataFields('Item ${__data:json}', { name: 'test', lastname: 'foo' }, { index: 2 });
      expect(result.text).toBe('Item {"name":"test","lastname":"foo"}');
    });

    it('replaces __data.index when index option provided', () => {
      const result = replaceDataFields(
        'Item ${__data.index}: ${__data.fields["name"]}',
        { name: 'test' },
        { index: 2 }
      );
      expect(result.text).toBe('Item 2: test');
    });

    it('replaces __data.count when count option provided', () => {
      const result = replaceDataFields('Total: ${__data.count}', {}, { count: 5 });
      expect(result.text).toBe('Total: 5');
    });

    it('replaces both index and count together', () => {
      const result = replaceDataFields(
        '${__data.index} of ${__data.count}: ${__data.fields["name"]}',
        { name: 'Alice' },
        { index: 0, count: 3 }
      );
      expect(result.text).toBe('0 of 3: Alice');
    });

    it('leaves __data.index unchanged when index option not provided', () => {
      const result = replaceDataFields('Index: ${__data.index}', {});
      expect(result.text).toBe('Index: ${__data.index}');
    });

    it('leaves __data.count unchanged when count option not provided', () => {
      const result = replaceDataFields('Count: ${__data.count}', {});
      expect(result.text).toBe('Count: ${__data.count}');
    });
  });
});

describe('replaceDataFieldsBatch()', () => {
  const items = [
    { name: 'Alice', id: '1' },
    { name: 'Bob', id: '2' },
    { name: 'Charlie', id: '3' },
  ];

  describe('indexed access', () => {
    it('replaces indexed field access', () => {
      const result = replaceDataFieldsBatch('First: ${__data[0].fields["name"]}', items);
      expect(result.text).toBe('First: Alice');
    });

    it('replaces multiple indexed accesses', () => {
      const result = replaceDataFieldsBatch('${__data[0].fields["name"]} and ${__data[1].fields["name"]}', items);
      expect(result.text).toBe('Alice and Bob');
    });

    it('reports out of bounds error', () => {
      const result = replaceDataFieldsBatch('${__data[10].fields["name"]}', items);
      expect(result.text).toBe('${__data[10].fields["name"]}');
      expect(result.errors).toEqual(['Index 10 out of bounds (0-2)']);
    });
  });

  describe('aggregated access', () => {
    it('aggregates field values with default CSV format', () => {
      const result = replaceDataFieldsBatch('Names: ${__data.fields["name"]}', items);
      expect(result.text).toBe('Names: Alice,Bob,Charlie');
    });

    it('aggregates field values with pipe format', () => {
      const result = replaceDataFieldsBatch('${__data.fields["name"]:pipe}', items);
      expect(result.text).toBe('Alice|Bob|Charlie');
    });

    it('aggregates field values with json format', () => {
      const result = replaceDataFieldsBatch('${__data.fields["name"]:json}', items);
      expect(result.text).toBe('["Alice","Bob","Charlie"]');
    });

    it('aggregates field values with regex format', () => {
      const result = replaceDataFieldsBatch('${__data.fields["name"]:regex}', items);
      expect(result.text).toBe('(Alice|Bob|Charlie)');
    });

    it('replace all values comma separated', () => {
      const result = replaceDataFieldsBatch('${__data}', items);
      expect(result.text).toBe('{"name":"Alice","id":"1"},{"name":"Bob","id":"2"},{"name":"Charlie","id":"3"}');
    });

    it('replace all values as JSON', () => {
      const result = replaceDataFieldsBatch('${__data:json}', items);
      expect(result.text).toBe('[{"name":"Alice","id":"1"},{"name":"Bob","id":"2"},{"name":"Charlie","id":"3"}]');
    });

    it('replace all values as JSON removing surrounding quotes to generate a valid JSON', () => {
      const result = replaceDataFieldsBatch('{"data":"${__data:json}"}', items);
      expect(result.text).toBe(
        '{"data":[{"name":"Alice","id":"1"},{"name":"Bob","id":"2"},{"name":"Charlie","id":"3"}]}'
      );
    });

    it('replace all values as JSON keeping surrounding quotes if they are not surrounding the full_data pattern', () => {
      const result = replaceDataFieldsBatch('{"data":"${__data} something"}', items);
      expect(result.text).toBe(
        '{"data":"{"name":"Alice","id":"1"},{"name":"Bob","id":"2"},{"name":"Charlie","id":"3"} something"}'
      );
    });
  });

  describe('combined patterns', () => {
    it('handles both indexed and aggregated patterns', () => {
      const result = replaceDataFieldsBatch(
        'First: ${__data[0].fields["name"]}, All: ${__data.fields["id"]:pipe}',
        items
      );
      expect(result.text).toBe('First: Alice, All: 1|2|3');
    });
  });

  describe('__data.count in batch mode', () => {
    it('replaces __data.count with items length', () => {
      const result = replaceDataFieldsBatch('Total: ${__data.count} items', items);
      expect(result.text).toBe('Total: 3 items');
    });

    it('combines __data.count with field patterns', () => {
      const result = replaceDataFieldsBatch('${__data.count} items: ${__data.fields["name"]:pipe}', items);
      expect(result.text).toBe('3 items: Alice|Bob|Charlie');
    });
  });
});

describe('pattern detection helpers', () => {
  describe('hasBatchPatterns()', () => {
    it('returns true for indexed patterns', () => {
      expect(hasBatchPatterns('${__data[0].fields["name"]}')).toBe(true);
    });

    it('returns true for format specifiers', () => {
      expect(hasBatchPatterns('${__data.fields["name"]:csv}')).toBe(true);
    });

    it('returns false for simple patterns', () => {
      expect(hasBatchPatterns('${__data.fields["name"]}')).toBe(false);
    });
  });

  describe('hasIndexedPatterns()', () => {
    it('returns true for indexed patterns', () => {
      expect(hasIndexedPatterns('${__data[0].fields["name"]}')).toBe(true);
    });

    it('returns false for non-indexed patterns', () => {
      expect(hasIndexedPatterns('${__data.fields["name"]:csv}')).toBe(false);
    });
  });

  describe('hasDataFieldPatterns()', () => {
    it('returns true for single field patterns', () => {
      expect(hasDataFieldPatterns('${__data.fields["name"]}')).toBe(true);
    });

    it('returns true for indexed patterns', () => {
      expect(hasDataFieldPatterns('${__data[0].fields["name"]}')).toBe(true);
    });

    it('returns false for plain text', () => {
      expect(hasDataFieldPatterns('hello world')).toBe(false);
    });

    it('returns false for variable patterns', () => {
      expect(hasDataFieldPatterns('${var1}')).toBe(false);
    });
  });

  describe('extractFieldNames()', () => {
    it('extracts field names from single patterns', () => {
      expect(extractFieldNames('${__data.fields["name"]} ${__data.fields["id"]}')).toEqual(['name', 'id']);
    });

    it('extracts field names from indexed patterns', () => {
      expect(extractFieldNames('${__data[0].fields["name"]} ${__data[1].fields["value"]}')).toEqual(['name', 'value']);
    });

    it('extracts unique field names', () => {
      expect(extractFieldNames('${__data.fields["name"]} ${__data[0].fields["name"]}')).toEqual(['name']);
    });

    it('extracts field names with format specifiers', () => {
      expect(extractFieldNames('${__data.fields["name"]:csv}')).toEqual(['name']);
    });

    it('extracts field names from dot notation', () => {
      expect(extractFieldNames('${__data.fields.name} ${__data.fields.value}')).toEqual(['name', 'value']);
    });

    it('extracts unique field names from mixed notations', () => {
      expect(extractFieldNames('${__data.fields.name} ${__data.fields["name"]}')).toEqual(['name']);
    });
  });
});

describe('dot notation support', () => {
  describe('replaceDataFields() with dot notation', () => {
    it('replaces field using dot notation', () => {
      const result = replaceDataFields('https://example.com?name=${__data.fields.name}', { name: 'hello world' });
      expect(result.text).toBe('https://example.com?name=hello%20world');
      expect(result.errors).toBeUndefined();
    });

    it('replaces multiple fields using dot notation', () => {
      const result = replaceDataFields('https://example.com?name=${__data.fields.name}&id=${__data.fields.id}', {
        name: 'test',
        id: '123',
      });
      expect(result.text).toBe('https://example.com?name=test&id=123');
      expect(result.errors).toBeUndefined();
    });

    it('handles mixed bracket and dot notation', () => {
      const result = replaceDataFields('${__data.fields.name} - ${__data.fields["id"]}', {
        name: 'test',
        id: '123',
      });
      expect(result.text).toBe('test - 123');
      expect(result.errors).toBeUndefined();
    });

    it('applies format specifier with dot notation', () => {
      const result = replaceDataFields('${__data.fields.value:regex}', { value: 'test.value' });
      expect(result.text).toBe('(test\\.value)');
    });

    it('reports missing field error with dot notation', () => {
      const result = replaceDataFields('${__data.fields.missing}', { other: 'value' });
      expect(result.errors).toEqual(['Field "missing" not found in data']);
    });

    it('can disable URL encoding with dot notation', () => {
      const result = replaceDataFields('${__data.fields.value}', { value: 'hello&world' }, { urlEncode: false });
      expect(result.text).toBe('hello&world');
    });

    it('supports underscore in field names with dot notation', () => {
      const result = replaceDataFields('${__data.fields.my_field}', { my_field: 'value' });
      expect(result.text).toBe('value');
    });

    it('supports alphanumeric field names with dot notation', () => {
      const result = replaceDataFields('${__data.fields.field123}', { field123: 'value' });
      expect(result.text).toBe('value');
    });
  });

  describe('replaceDataFieldsBatch() with dot notation', () => {
    const items = [
      { name: 'Alice', id: '1' },
      { name: 'Bob', id: '2' },
      { name: 'Charlie', id: '3' },
    ];

    it('aggregates field values with dot notation and default CSV format', () => {
      const result = replaceDataFieldsBatch('Names: ${__data.fields.name}', items);
      expect(result.text).toBe('Names: Alice,Bob,Charlie');
    });

    it('aggregates field values with dot notation and pipe format', () => {
      const result = replaceDataFieldsBatch('${__data.fields.name:pipe}', items);
      expect(result.text).toBe('Alice|Bob|Charlie');
    });

    it('handles mixed bracket and dot notation in batch mode', () => {
      const result = replaceDataFieldsBatch('${__data.fields.name:csv} / ${__data.fields["id"]:pipe}', items);
      expect(result.text).toBe('Alice,Bob,Charlie / 1|2|3');
    });
  });

  describe('pattern detection with dot notation', () => {
    it('hasBatchPatterns returns true for dot notation with format', () => {
      expect(hasBatchPatterns('${__data.fields.name:csv}')).toBe(true);
    });

    it('hasBatchPatterns returns false for dot notation without format', () => {
      expect(hasBatchPatterns('${__data.fields.name}')).toBe(false);
    });

    it('hasDataFieldPatterns returns true for dot notation', () => {
      expect(hasDataFieldPatterns('${__data.fields.name}')).toBe(true);
    });

    it('hasDataFieldPatterns returns true for dot notation with format', () => {
      expect(hasDataFieldPatterns('${__data.fields.name:csv}')).toBe(true);
    });
  });

  describe('bracket notation', () => {
    it('still supports double quotes', () => {
      const result = replaceDataFields('${__data.fields["name"]}', { name: 'test' });
      expect(result.text).toBe('test');
    });

    it('still supports single quotes', () => {
      const result = replaceDataFields("${__data.fields['name']}", { name: 'test' });
      expect(result.text).toBe('test');
    });

    it('bracket notation allows special characters in field names', () => {
      const result = replaceDataFields('${__data.fields["field-name"]}', { 'field-name': 'value' });
      expect(result.text).toBe('value');
    });

    it('bracket notation allows dots in field names', () => {
      const result = replaceDataFields('${__data.fields["field.name"]}', { 'field.name': 'value' });
      expect(result.text).toBe('value');
    });

    it('bracket notation allows spaces in field names', () => {
      const result = replaceDataFields('${__data.fields["field name"]}', { 'field name': 'value' });
      expect(result.text).toBe('value');
    });
  });

  describe('nested field access', () => {
    describe('replaceDataFields() with nested fields', () => {
      it('accesses nested object properties using dot path', () => {
        const result = replaceDataFields('${__data.fields["foo.bar"]}', { foo: { bar: 'nested value' } });
        expect(result.text).toBe('nested%20value');
        expect(result.errors).toBeUndefined();
      });

      it('accesses deeply nested object properties', () => {
        const result = replaceDataFields('${__data.fields["a.b.c.d"]}', {
          a: { b: { c: { d: 'deep value' } } },
        });
        expect(result.text).toBe('deep%20value');
      });

      it('returns empty string for missing nested path', () => {
        const result = replaceDataFields('${__data.fields["foo.missing"]}', { foo: { bar: 'value' } });
        expect(result.text).toBe('');
        expect(result.errors).toEqual(['Field "foo.missing" not found in data']);
      });

      it('returns empty string when intermediate path is not an object', () => {
        const result = replaceDataFields('${__data.fields["foo.bar.baz"]}', { foo: { bar: 'string value' } });
        expect(result.text).toBe('');
      });

      it('returns empty string when intermediate path is null', () => {
        const result = replaceDataFields('${__data.fields["foo.bar"]}', { foo: null });
        expect(result.text).toBe('');
      });

      it('prefers literal key over nested access', () => {
        const result = replaceDataFields('${__data.fields["foo.bar"]}', {
          'foo.bar': 'literal key',
          foo: { bar: 'nested value' },
        });
        expect(result.text).toBe('literal%20key');
      });

      it('serializes nested object values to JSON', () => {
        const result = replaceDataFields(
          '${__data.fields["foo.bar"]}',
          { foo: { bar: { nested: 'object' } } },
          { urlEncode: false }
        );
        expect(result.text).toBe('{"nested":"object"}');
      });

      it('handles nested access with dot notation syntax', () => {
        const result = replaceDataFields('${__data.fields.user}', {
          user: { name: 'Alice', age: 30 },
        });
        // Dot notation returns the whole object since "user" is the field name
        expect(result.text).toBe('%7B%22name%22%3A%22Alice%22%2C%22age%22%3A30%7D');
      });

      it('applies format specifier to nested field values', () => {
        const result = replaceDataFields('${__data.fields["foo.bar"]:regex}', { foo: { bar: 'test.value' } });
        expect(result.text).toBe('(test\\.value)');
      });
    });

    describe('replaceDataFieldsBatch() with nested fields', () => {
      const items = [{ user: { name: 'Alice' } }, { user: { name: 'Bob' } }, { user: { name: 'Charlie' } }];

      it('aggregates nested field values with default CSV format', () => {
        const result = replaceDataFieldsBatch('Names: ${__data.fields["user.name"]}', items);
        expect(result.text).toBe('Names: Alice,Bob,Charlie');
      });

      it('aggregates nested field values with pipe format', () => {
        const result = replaceDataFieldsBatch('${__data.fields["user.name"]:pipe}', items);
        expect(result.text).toBe('Alice|Bob|Charlie');
      });

      it('handles indexed access with nested fields', () => {
        // Note: indexed access doesn't support nested paths currently (uses bracket notation for index)
        const result = replaceDataFieldsBatch('${__data[0].fields["name"]}', [{ name: 'Alice' }, { name: 'Bob' }]);
        expect(result.text).toBe('Alice');
      });
    });
  });
});
