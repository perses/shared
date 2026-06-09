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

import { RequestHeaders } from '@perses-dev/client';
import {
  replaceVariables,
  VariableStateMap,
  parseVariablesAndFormat,
  InterpolationFormat,
} from './variable-interpolation';

export type QueryParamValues = Record<string, string | string[]>;

function expandQueryParamValue(value: string | string[], variableState: VariableStateMap): string | string[] {
  // If value is an array, process each element
  if (Array.isArray(value)) {
    return value.map((v) => expandQueryParamValue(v, variableState) as string);
  }

  // Now we know value is a string, so we can safely use string methods
  const valueString = value as string;
  const variablesMap = parseVariablesAndFormat(valueString);

  // Find the first multi-value variable that should expand to repeated keys
  for (const [varName, format] of variablesMap) {
    const varState = variableState[varName];
    if (!varState || !Array.isArray(varState.value)) continue;

    // If format is queryparam or not specified (default for query params), expand to array
    if (!format || format === InterpolationFormat.QUERYPARAM) {
      // Build syntax patterns for this variable reference
      const simpleSyntax = '$' + varName;
      const bracketSyntax = format ? '${' + varName + ':' + format + '}' : '${' + varName + '}';

      return varState.value.map((singleValue) => {
        let text = valueString;
        // Replace the variable reference with the raw value directly.
        // We cannot use replaceVariables here because it would apply QUERYPARAM format
        // to the single value, producing "varName=val" instead of just "val".
        text = text.replaceAll(bracketSyntax, singleValue);
        text = text.replaceAll(simpleSyntax, singleValue);
        // Replace any remaining variables (other than the expanded one) using standard interpolation
        return replaceVariables(text, variableState);
      });
    }
  }

  // No multi-value expansion needed — use standard interpolation
  return replaceVariables(valueString, variableState);
}

export function interpolateHeaders(headers: Record<string, string>, variableState: VariableStateMap): RequestHeaders {
  const result: RequestHeaders = {};
  for (const [key, value] of Object.entries(headers)) {
    result[key] = replaceVariables(value, variableState);
  }
  return result;
}

export function interpolateQueryParams(
  queryParams: QueryParamValues,
  variableState: VariableStateMap
): QueryParamValues {
  const result: QueryParamValues = {};
  for (const [key, value] of Object.entries(queryParams)) {
    if (Array.isArray(value)) {
      result[key] = value.map((v) => replaceVariables(v, variableState));
    } else {
      result[key] = expandQueryParamValue(value, variableState);
    }
  }
  return result;
}
