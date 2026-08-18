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

package common

// A variable reference is a "$" followed by a variable name. The accepted
// character set must stay in sync with the variable name rule (#metadataName,
// "^[a-zA-Z0-9_.-]+$"), otherwise a validly-named variable such as
// "my-datasource" cannot be referenced as "$my-datasource".
// See perses/perses#4327.
#variableSyntaxRegex: "^\\$[a-zA-Z0-9_.-]+$"
