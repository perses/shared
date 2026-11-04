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

import { json, jsonParseLinter } from '@codemirror/lang-json';
import { linter, lintGutter } from '@codemirror/lint';
import type { ReactElement } from 'react';

import type { CodeEditorProps } from './CodeEditor/CodeEditor';
import { CodeEditor } from './CodeEditor/CodeEditor';

const JSON_EXTENSIONS = [json(), linter(jsonParseLinter()), lintGutter()];

function toJSONText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

type JSONEditorProps<T> = CodeEditorProps<T>;

export function JSONEditor<T>(props: JSONEditorProps<T>): ReactElement {
  return <CodeEditor {...props} extensions={JSON_EXTENSIONS} serialize={toJSONText} />;
}
