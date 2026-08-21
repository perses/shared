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

import type { Story } from '@ladle/react';

import { PatternFlyV6Alert, Pf6AlertDemo } from '../stories/pf6/PatternFlyV6Alert';
import { PatternFlyButton, Pf6ButtonDemo } from '../stories/pf6/PatternFlyV6Button';
import { ComponentsProvider } from './ComponentsProvider';
import { DEFAULT_COMPONENTS, DEFAULT_ICONS } from './defaults';

const PF_BUTTON_COMPONENTS = { ...DEFAULT_COMPONENTS, Button: PatternFlyButton };
const PF_ALERT_COMPONENTS = { ...DEFAULT_COMPONENTS, Alert: PatternFlyV6Alert };

export const PatternFlyButtonInjection: Story = () => (
  <ComponentsProvider components={PF_BUTTON_COMPONENTS} icons={DEFAULT_ICONS}>
    <Pf6ButtonDemo />
  </ComponentsProvider>
);
PatternFlyButtonInjection.storyName = 'Patternfly v6 Button Injection';

export const PatternFlyAlertInjection: Story = () => (
  <ComponentsProvider components={PF_ALERT_COMPONENTS} icons={DEFAULT_ICONS}>
    <Pf6AlertDemo />
  </ComponentsProvider>
);
PatternFlyAlertInjection.storyName = 'Patternfly v6 Alert Injection';
