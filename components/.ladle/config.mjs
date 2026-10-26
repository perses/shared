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

/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'src/next/**/*.stories.tsx',
  addons: {
    width: {
      // Each preset sits within the matching Perses media-query range.
      options: {
        xs: 414,
        sm: 640,
        md: 1024,
        lg: 1280,
        xl: 1536,
      },
    },
  },
};
