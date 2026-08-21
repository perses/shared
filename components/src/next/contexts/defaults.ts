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

import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from '../icons';
import { Alert } from '../primitives/Alert/Alert';
import { Button } from '../primitives/Button/Button';
import type { PersesComponents, PersesIcons } from './ComponentsContext';

export const DEFAULT_COMPONENTS: PersesComponents = {
  Button,
  Alert,
};

export const DEFAULT_ICONS: PersesIcons = {
  Error: ErrorIcon,
  Info: InfoIcon,
  Success: SuccessIcon,
  Warning: WarningIcon,
};
