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

import { createContext, useContext } from 'react';

import type { Size, Status } from '../types';

export interface FormControlContextValue {
  /** `true` inside a `FormControl` or `FormControlLabel`; controls then defer label and helper to the wrapper. */
  inFormControl: boolean;
  size?: Size;
  disabled?: boolean;
  required?: boolean;
  status?: Status;
}

/** State a `FormControl` shares with the controls and `FormHelperText` inside it. */
export const FormControlContext = createContext<FormControlContextValue>({ inFormControl: false });

export function useFormControlContext(): FormControlContextValue {
  return useContext(FormControlContext);
}
