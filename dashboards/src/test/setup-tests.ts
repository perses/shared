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

import matchers from '@testing-library/jest-dom/matchers';
import { defaultFallbackInView } from 'react-intersection-observer';

// Add testing library assertions
expect.extend(matchers);

// Always mock e-charts during tests since we don't have a proper canvas in jsdom
vi.mock('echarts/core');

// Tell react-intersection-observer that everything should be considered in-view for tests (see package documentation
// for other options)
defaultFallbackInView(true);
