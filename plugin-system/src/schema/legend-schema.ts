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

import z from 'zod';
import { legendModes, legendPositions, legendSizes } from '@perses-dev/core';
import { legendValues } from '../model/legend';

const allValueOptions = [...legendValues, 'abs', 'relative'] as const;

export const LegendSchema = z.object({
  position: z.enum([...legendPositions]),
  mode: z.enum([...legendModes]).optional(),
  size: z.enum([...legendSizes]).optional(),
  values: z.array(z.enum(allValueOptions as unknown as [string, ...string[]])).optional(),
});
