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

// These moved to plugin-system so the dashboards package can build an explorer link
// without importing explore, which depends on dashboards. Re-exported here to keep
// the existing entry point working.
export { explorerQueryConfig, useExplorerQueryParams, type ExplorerQueryData } from '@perses-dev/plugin-system';
