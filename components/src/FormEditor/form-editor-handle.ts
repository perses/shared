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

/**
 * Imperative handle exposed by editor forms, allowing their parent to request closing them, e.g. when the user clicks
 * outside of the Drawer containing the form. The form is responsible for closing itself, after asking for confirmation
 * if there are unsaved changes.
 */
export interface FormEditorHandle {
  requestClose: () => void;
}
