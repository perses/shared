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

import { RequestHeaders } from '@perses-dev/core';
import { replaceVariables, VariableStateMap } from './variable-interpolation';

export type QueryParamValues = Record<string, string | string[]>;

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
      result[key] = replaceVariables(value, variableState);
    }
  }
  return result;
}
