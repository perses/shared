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

import type { PersesComponents, PersesIcons } from '../contexts/ComponentsContext';
import { Alert } from './Alert';
import { Button } from './Button';
import { ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from './Icon';
import { Spinner } from './Spinner';

export const defaultComponents: PersesComponents = { Button, Alert, Spinner };

export const defaultIcons: PersesIcons = {
  Error: ErrorIcon,
  Info: InfoIcon,
  Success: SuccessIcon,
  Warning: WarningIcon,
};
