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

package main

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestUpdatePackageVersion(t *testing.T) {
	workspacePath := t.TempDir()
	packageJSON := `{
  "name": "@perses-dev/test",
  "version": "0.55.0-beta.6",
  "dependencies": {
    "@perses-dev/client": "workspace:0.55.0-beta.6",
    "@perses-dev/components": "^0.55.0-beta.6"
  }
}
`
	packagePath := filepath.Join(workspacePath, "package.json")
	if err := os.WriteFile(packagePath, []byte(packageJSON), 0644); err != nil {
		t.Fatal(err)
	}

	if err := updatePackageVersion([]string{"client", "components"}, workspacePath, "1.2.3"); err != nil {
		t.Fatal(err)
	}

	updated, err := os.ReadFile(packagePath)
	if err != nil {
		t.Fatal(err)
	}
	for _, expected := range []string{
		`"version": "1.2.3"`,
		`"@perses-dev/client": "workspace:1.2.3"`,
		`"@perses-dev/components": "1.2.3"`,
	} {
		if !strings.Contains(string(updated), expected) {
			t.Errorf("updated package.json does not contain %q:\n%s", expected, updated)
		}
	}
}
