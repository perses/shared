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

import { resolve } from 'node:path';

import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig, mergeConfig } from 'vitest/config';

type VitestPackageOptions = {
  packageDir: string;
  setupFiles?: string[];
  passWithNoTests?: boolean;
};

const repoRoot = resolve(__dirname);

const sharedConfig = defineConfig({
  plugins: [tsconfigPaths({ projects: [resolve(repoRoot, 'tsconfig.vitest.json')] })],
  resolve: {
    alias: {
      'use-resize-observer': 'use-resize-observer/polyfilled',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.test.{ts,tsx,js,jsx}', 'src/**/*.spec.{ts,tsx,js,jsx}'],
  },
});

export function definePackageVitestConfig({
  packageDir,
  setupFiles = [],
  passWithNoTests = false,
}: VitestPackageOptions) {
  return mergeConfig(
    sharedConfig,
    defineConfig({
      test: {
        root: packageDir,
        passWithNoTests,
        setupFiles: setupFiles.map((file) => resolve(packageDir, file)),
      },
    }),
  );
}
