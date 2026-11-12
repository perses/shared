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

#url: =~"^https?:\/\/[^\\s\/$.?#].[^\\s]*$"

// #linkURL is the URL of a link that a user can follow from a panel (data link, link to a trace, ...).
// It must be relative or use a scheme that can't execute a script in the Perses origin: javascript:, data:, vbscript:
// and any other scheme are rejected, even when hidden behind leading control characters or spaces, mixed case, tabs or
// newlines. A scheme provided by a variable (e.g. "$link") can only be verified by the UI once the variables are
// interpolated, which is why the UI still sanitizes the final URL.
// Keep the list of schemes aligned with internal/api/validate/link.go in perses/perses and with
// components/src/utils/url.ts.
#linkURL: string & (=~#"^[\x00-\x20]*(?i:https?|mailto|tel|sms|slack|msteams|vscode|vscode-insiders|zoommtg):"# | !~#"^[\x00-\x20]*[a-zA-Z][a-zA-Z0-9+.\-\t\n\r]*:"#)
