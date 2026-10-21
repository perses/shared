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

import type { Diagnostic } from '@codemirror/lint';
import type { YAMLError, YAMLWarning } from 'yaml';
import { parseAllDocuments, stringify } from 'yaml';

function toDiagnostic(text: string, problem: YAMLError | YAMLWarning, severity: Diagnostic['severity']): Diagnostic {
  const from = Math.min(problem.pos[0], text.length);
  const to = Math.min(Math.max(problem.pos[1], from), text.length);
  return { from, to, severity, message: problem.message };
}

/**
 * Parse the given text as YAML and return a CodeMirror diagnostic for each syntax error and warning.
 */
export function yamlDiagnostics(text: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  // Pretty errors embed a code frame in the message, which is redundant with the lint underline.
  for (const doc of parseAllDocuments(text, { prettyErrors: false })) {
    diagnostics.push(...doc.errors.map((error) => toDiagnostic(text, error, 'error')));
    diagnostics.push(...doc.warnings.map((warning) => toDiagnostic(text, warning, 'warning')));
  }
  return diagnostics;
}

/**
 * Convert the initial value given to the editor into YAML text. Strings are kept as is, so that
 * already serialized content (YAML or JSON) is displayed untouched.
 */
export function toYAMLText(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  return stringify(value, { schema: 'yaml-1.1' });
}
