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
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"
)

func TestReleaseSeries(t *testing.T) {
	tests := []struct {
		name           string
		version        string
		expectedSeries string
		expectedBranch string
		expectErr      bool
	}{
		{name: "beta", version: "0.56.0-beta.0", expectedSeries: "v0.56", expectedBranch: "release/v0.56"},
		{name: "release candidate", version: "0.56.0-rc.1", expectedSeries: "v0.56", expectedBranch: "release/v0.56"},
		{name: "final release", version: "0.56.0", expectedSeries: "v0.56", expectedBranch: "release/v0.56"},
		{name: "patch release", version: "0.56.12", expectedSeries: "v0.56", expectedBranch: "release/v0.56"},
		{name: "major release", version: "1.0.0", expectedSeries: "v1.0", expectedBranch: "release/v1.0"},
		{name: "v prefix", version: "v0.56.0", expectErr: true},
		{name: "missing patch", version: "0.56", expectErr: true},
		{name: "empty", version: "", expectErr: true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			series, err := releaseSeries(tt.version)
			if tt.expectErr {
				if err == nil {
					t.Fatalf("releaseSeries(%q) error = nil, expected an error", tt.version)
				}
				return
			}
			if err != nil {
				t.Fatalf("releaseSeries(%q) error = %v", tt.version, err)
			}
			if series != tt.expectedSeries {
				t.Errorf("releaseSeries(%q) = %q, expected %q", tt.version, series, tt.expectedSeries)
			}
			if branch := releaseBranch(series); branch != tt.expectedBranch {
				t.Errorf("releaseBranch(%q) = %q, expected %q", series, branch, tt.expectedBranch)
			}
		})
	}
}

func TestGitOutput(t *testing.T) {
	initRepository(t)

	if got, err := gitOutput("branch", "--show-current"); err != nil || got != "main" {
		t.Errorf("gitOutput(branch --show-current) = (%q, %v), expected (\"main\", nil)", got, err)
	}

	_, err := gitOutput("rev-parse", "--verify", "unknown")
	if err == nil {
		t.Fatal("gitOutput(rev-parse --verify unknown) error = nil, expected an error")
	}
	if expected := "fatal: Needed a single revision"; !strings.Contains(err.Error(), expected) {
		t.Errorf("gitOutput() error = %q, expected it to contain the git error %q", err, expected)
	}
}

func TestReleaseCommit(t *testing.T) {
	tests := []struct {
		name        string
		setup       func(t *testing.T)
		expectedErr string
	}{
		{
			name:        "not on the release branch",
			setup:       func(*testing.T) {},
			expectedErr: `must be released from the branch release/v0.56, but the current branch is "main"`,
		},
		{
			name: "release branch not pushed",
			setup: func(t *testing.T) {
				runGit(t, "checkout", "--quiet", "-b", "release/v0.56")
			},
			expectedErr: "unable to fetch the branch release/v0.56 from the remote origin",
		},
		{
			name: "local commit not pushed",
			setup: func(t *testing.T) {
				runGit(t, "checkout", "--quiet", "-b", "release/v0.56")
				runGit(t, "push", "--quiet", "origin", "release/v0.56")
				commit(t, "[BUGFIX] local fix")
			},
			expectedErr: "is not in sync with origin/release/v0.56",
		},
		{
			name: "release branch in sync",
			setup: func(t *testing.T) {
				runGit(t, "checkout", "--quiet", "-b", "release/v0.56")
				runGit(t, "push", "--quiet", "origin", "release/v0.56")
			},
		},
		{
			name: "release branch in sync in a single-branch clone",
			setup: func(t *testing.T) {
				// the configured refspec doesn't create the remote-tracking branch of the release branch
				runGit(t, "config", "remote.origin.fetch", "+refs/heads/main:refs/remotes/origin/main")
				runGit(t, "checkout", "--quiet", "-b", "release/v0.56")
				runGit(t, "push", "--quiet", "origin", "release/v0.56")
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initRepository(t)
			tt.setup(t)

			got, err := releaseCommit("v0.56", "origin")
			if tt.expectedErr != "" {
				if err == nil || !strings.Contains(err.Error(), tt.expectedErr) {
					t.Fatalf("releaseCommit() error = %v, expected an error containing %q", err, tt.expectedErr)
				}
				return
			}
			if err != nil {
				t.Fatalf("releaseCommit() error = %v", err)
			}
			if expected := runGit(t, "rev-parse", "HEAD"); got != expected {
				t.Errorf("releaseCommit() = %q, expected %q", got, expected)
			}
		})
	}
}

func TestPreviousTag(t *testing.T) {
	tests := []struct {
		name     string
		setup    func(t *testing.T)
		expected string
	}{
		{
			name:     "no tag",
			setup:    func(*testing.T) {},
			expected: "",
		},
		{
			name: "closest tag when the series has no tag yet",
			setup: func(t *testing.T) {
				runGit(t, "tag", "v0.55.0")
				commit(t, "[FEATURE] new feature")
			},
			expected: "v0.55.0",
		},
		{
			name: "tag of the series when a tag of another series is closer",
			setup: func(t *testing.T) {
				runGit(t, "tag", "v0.56.0-beta.0")
				commit(t, "[BUGFIX] fix released in v0.55.1")
				runGit(t, "tag", "v0.55.1")
				commit(t, "[FEATURE] new feature")
			},
			expected: "v0.56.0-beta.0",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			initRepository(t)
			tt.setup(t)

			got, err := previousTag("v0.56")
			if err != nil {
				t.Fatalf("previousTag() error = %v", err)
			}
			if got != tt.expected {
				t.Errorf("previousTag() = %q, expected %q", got, tt.expected)
			}
		})
	}
}

func TestGHReleaseArgs(t *testing.T) {
	tests := []struct {
		name     string
		version  string
		expected []string
	}{
		{
			name:    "final release",
			version: "0.56.0",
			expected: []string{
				"release", "create", "v0.56.0", "--repo", "perses/shared", "--target", "abc", "--title", "v0.56.0",
				"--notes", "notes",
			},
		},
		{
			name:    "patch release",
			version: "0.56.3",
			expected: []string{
				"release", "create", "v0.56.3", "--repo", "perses/shared", "--target", "abc", "--title", "v0.56.3",
				"--notes", "notes",
			},
		},
		{
			name:    "beta",
			version: "0.56.0-beta.0",
			expected: []string{
				"release", "create", "v0.56.0-beta.0", "--repo", "perses/shared", "--target", "abc", "--title",
				"v0.56.0-beta.0", "--prerelease", "--notes", "notes",
			},
		},
		{
			name:    "release candidate",
			version: "0.56.0-rc.1",
			expected: []string{
				"release", "create", "v0.56.0-rc.1", "--repo", "perses/shared", "--target", "abc", "--title",
				"v0.56.0-rc.1", "--prerelease", "--notes", "notes",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := ghReleaseArgs(tt.version, "abc", "notes"); !slices.Equal(got, tt.expected) {
				t.Errorf("ghReleaseArgs(%q) = %q, expected %q", tt.version, got, tt.expected)
			}
		})
	}
}

// initRepository creates a git repository with a single commit on the branch main and a bare remote named origin,
// then moves into it. The user and system git configurations are ignored to keep the tests reproducible.
func initRepository(t *testing.T) {
	t.Helper()
	t.Setenv("GIT_CONFIG_GLOBAL", os.DevNull)
	t.Setenv("GIT_CONFIG_NOSYSTEM", "1")
	t.Setenv("GIT_AUTHOR_NAME", "test")
	t.Setenv("GIT_AUTHOR_EMAIL", "test@example.com")
	t.Setenv("GIT_COMMITTER_NAME", "test")
	t.Setenv("GIT_COMMITTER_EMAIL", "test@example.com")

	dir := t.TempDir()
	remote := filepath.Join(dir, "remote.git")
	repository := filepath.Join(dir, "repository")
	runGit(t, "init", "--quiet", "--bare", remote)
	runGit(t, "init", "--quiet", "--initial-branch=main", repository)
	t.Chdir(repository)
	runGit(t, "remote", "add", "origin", remote)
	commit(t, "initial commit")
}

func commit(t *testing.T, message string) {
	t.Helper()
	runGit(t, "commit", "--quiet", "--allow-empty", "-m", message)
}

func runGit(t *testing.T, args ...string) string {
	t.Helper()
	output, err := exec.Command("git", args...).CombinedOutput()
	if err != nil {
		t.Fatalf("git %s: %v\n%s", strings.Join(args, " "), err, output)
	}
	return strings.TrimSpace(string(output))
}
