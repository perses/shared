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
	"bytes"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"strings"
	"testing"
)

func TestPublishPackageWithOutput(t *testing.T) {
	tests := []struct {
		name        string
		version     string
		dryRun      bool
		exitCode    int
		wantDistTag string
	}{
		{name: "stable success", version: "1.2.3", wantDistTag: "latest"},
		{name: "beta failure", version: "0.55.0-beta.4", dryRun: true, exitCode: 23, wantDistTag: "prerelease"},
		{name: "release candidate", version: "1.0.0-rc.1", wantDistTag: "prerelease"},
		{name: "named prerelease", version: "2.0.0-next.12", wantDistTag: "prerelease"},
		{name: "numeric prerelease", version: "2.0.0-1", wantDistTag: "prerelease"},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			workspacePath := createWorkspace(t, test.version)
			installFakePNPM(t, test.exitCode)

			wantArgs := "publish --access public --tag " + test.wantDistTag
			if test.dryRun {
				wantArgs += " --dry-run"
			}
			wantArgs += " --no-git-checks"

			var stdout bytes.Buffer
			var stderr bytes.Buffer
			err := publishPackageWithOutput(workspacePath, test.dryRun, &stdout, &stderr)

			if got, want := normalizeOutput(stdout.String()), "pnpm stdout: "+wantArgs+"\n"; got != want {
				t.Errorf("stdout = %q, want %q", got, want)
			}
			if got, want := normalizeOutput(stderr.String()), "pnpm stderr from: "+workspacePath+"\n"; got != want {
				t.Errorf("stderr = %q, want %q", got, want)
			}

			if test.exitCode == 0 {
				if err != nil {
					t.Fatalf("publishPackageWithOutput() error = %v", err)
				}
				return
			}

			if err == nil {
				t.Fatal("publishPackageWithOutput() error = nil, want a pnpm failure")
			}
			for _, detail := range []string{
				"pnpm " + wantArgs + " failed",
				"@perses-dev/test@" + test.version,
				workspacePath,
				fmt.Sprintf("exit status %d", test.exitCode),
			} {
				if !strings.Contains(err.Error(), detail) {
					t.Errorf("error %q does not contain %q", err, detail)
				}
			}
		})
	}
}

func createWorkspace(t *testing.T, version string) string {
	t.Helper()
	workspacePath := t.TempDir()
	packageJSON := fmt.Sprintf(`{"name":"@perses-dev/test","version":%q}`, version)
	if err := os.WriteFile(filepath.Join(workspacePath, "package.json"), []byte(packageJSON), 0600); err != nil {
		t.Fatal(err)
	}
	if err := os.Mkdir(filepath.Join(workspacePath, "dist"), 0755); err != nil {
		t.Fatal(err)
	}
	return workspacePath
}

func installFakePNPM(t *testing.T, exitCode int) {
	t.Helper()
	binDir := t.TempDir()
	name := "pnpm"
	script := fmt.Sprintf(`#!/bin/sh
printf 'pnpm stdout: %%s\n' "$*"
printf 'pnpm stderr from: %%s\n' "$PWD" >&2
exit %d
`, exitCode)
	if runtime.GOOS == "windows" {
		name = "pnpm.cmd"
		script = fmt.Sprintf("@echo off\r\necho pnpm stdout: %%*\r\n>&2 echo pnpm stderr from: %%CD%%\r\nexit /b %d\r\n", exitCode)
	}
	if err := os.WriteFile(filepath.Join(binDir, name), []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", binDir+string(os.PathListSeparator)+os.Getenv("PATH"))
}

func normalizeOutput(output string) string {
	return strings.ReplaceAll(output, "\r\n", "\n")
}
