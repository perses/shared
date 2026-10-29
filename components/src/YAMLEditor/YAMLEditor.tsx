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

import { yaml } from '@codemirror/lang-yaml';
import { linter, lintGutter } from '@codemirror/lint';
import type { ReactElement } from 'react';

import type { CodeEditorProps } from '../CodeEditor/CodeEditor';
import { CodeEditor } from '../CodeEditor/CodeEditor';
import { toYAMLText, yamlDiagnostics } from './yaml-utils';

const YAML_EXTENSIONS = [yaml(), linter((view) => yamlDiagnostics(view.state.doc.toString())), lintGutter()];

type YAMLEditorProps<T> = Omit<CodeEditorProps<T>, 'value'> & {
  /**
   * Initial content of the editor. Unlike JSONEditor, a string is used as is (raw YAML or JSON text),
   * while any other value is serialized as YAML (1.1 schema). `undefined` gives an empty editor.
   */
  value: T;
};

export function YAMLEditor<T>(props: YAMLEditorProps<T>): ReactElement {
  return <CodeEditor {...props} extensions={YAML_EXTENSIONS} serialize={toYAMLText} />;
}
