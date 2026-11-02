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
	"errors"
	"flag"
	"fmt"
	"os/exec"
	"regexp"
	"strings"

	"github.com/perses/perses/scripts/pkg/changelog"
	"github.com/perses/perses/scripts/pkg/command"
	"github.com/perses/perses/scripts/pkg/npm"
	"github.com/sirupsen/logrus"
)

var versionPattern = regexp.MustCompile(`^(\d+)\.(\d+)\.\d+(?:-[\w.]+)?$`)

// releaseSeries returns the release series (v<major>.<minor>) the given version belongs to.
func releaseSeries(version string) (string, error) {
	matches := versionPattern.FindStringSubmatch(version)
	if matches == nil {
		return "", fmt.Errorf("version %q doesn't follow the semver (expected format: X.Y.Z or X.Y.Z-prerelease)", version)
	}
	return fmt.Sprintf("v%s.%s", matches[1], matches[2]), nil
}

// releaseBranch returns the branch from which every version of the given release series must be released.
func releaseBranch(series string) string {
	return "release/" + series
}

func isPrerelease(version string) bool {
	return strings.Contains(version, "-")
}

func mustGitOutput(args ...string) string {
	data, err := exec.Command("git", args...).Output()
	if err != nil {
		logrus.WithError(err).Fatalf("unable to run git %s", strings.Join(args, " "))
	}
	return strings.TrimSpace(string(data))
}

// checkReleaseBranch verifies that the current branch is the release branch of the given series and that it is in
// sync with the remote, so the tag is created on the commit used to generate the changelog.
func checkReleaseBranch(series string, remote string) string {
	expectedBranch := releaseBranch(series)
	if currentBranch := mustGitOutput("branch", "--show-current"); currentBranch != expectedBranch {
		logrus.Fatalf("release series %s must be released from the branch %s, but the current branch is %q", series, expectedBranch, currentBranch)
	}

	headCommit := mustGitOutput("rev-parse", "HEAD")
	data, err := exec.Command("git", "rev-parse", "--verify", "--quiet", fmt.Sprintf("refs/remotes/%s/%s", remote, expectedBranch)).Output()
	if err != nil {
		logrus.Fatalf("unable to find the branch %s on the remote %s, make sure it has been pushed", expectedBranch, remote)
	}
	if remoteCommit := strings.TrimSpace(string(data)); headCommit != remoteCommit {
		logrus.Fatalf("the local branch %s (%s) is not in sync with %s/%s (%s), pull or push the changes first", expectedBranch, headCommit, remote, expectedBranch, remoteCommit)
	}
	return headCommit
}

func release(version string, series string, targetCommit string) {
	releaseName := fmt.Sprintf("v%s", version)

	// ensure the tag does not already exist
	if execErr := command.Run("git", "rev-parse", "--verify", releaseName); execErr == nil {
		logrus.Infof("release %s already exists", releaseName)
		return
	}

	logrus.Infof("Creating release %s from the commit %s", releaseName, targetCommit)

	// create the GitHub release (and the associated tag) on the HEAD of the release branch
	args := []string{"release", "create", releaseName, "--target", targetCommit, "-t", releaseName, "-n", generateChangelog(series)}
	if isPrerelease(version) {
		args = append(args, "--prerelease")
	}
	if execErr := command.Run("gh", args...); execErr != nil {
		logrus.WithError(execErr).Fatalf("unable to create the release %s", releaseName)
	}

	logrus.Infof("✓ Successfully created release %s", releaseName)
}

func getPreviousTag(pattern string) string {
	data, err := exec.Command("git", "describe", "--tags", "--abbrev=0", "--match", pattern).Output()
	if err != nil {
		var exitError *exec.ExitError
		if errors.As(err, &exitError) && exitError.ExitCode() == 128 {
			return ""
		}
		logrus.Fatal(err)
	}
	return strings.TrimSpace(string(data))
}

func generateChangelog(series string) string {
	// Look first for a previous tag of the same series: tags of other series can be reachable too (e.g. when the
	// main branch has been merged into the release branch) and would lead to an incorrect changelog.
	previousTag := getPreviousTag(series + ".*")
	if previousTag == "" {
		previousTag = getPreviousTag("v*")
	}
	if previousTag == "" {
		logrus.Infof("no previous tag found for libraries, skipping changelog generation")
		return "First release"
	}
	logrus.Infof("previous tag for libraries is %s", previousTag)
	entries := changelog.GetGitLogs(previousTag)

	return changelog.New(entries).GenerateChangelog()
}

// This script generates the GitHub release of the libraries.
//
// Prerequisites for running this script:
// - Install the GitHub CLI (gh): https://github.com/cli/cli#installation
// - Use it to log in to GitHub: `gh auth login`
// - Checkout the release branch (release/v<major>.<minor>) matching the version in the root package.json, and make
// sure it is in sync with the remote.
//
// Usage:
//
// This will create a single release for all libraries in the monorepo:
//
//	go run ./scripts/release
//
// NB: this script doesn't publish the libraries, a CI task is responsible for this once the GitHub release is published.
func main() {
	remote := flag.String("remote", "origin", "Name of the git remote pointing to the perses/shared repository")
	flag.Parse()

	// Verify all workspaces exist
	workspaces := npm.MustGetWorkspaces(".")
	if len(workspaces) == 0 {
		logrus.Fatal("no workspaces found in package.json")
	}
	logrus.Infof("Found %d workspace(s) in monorepo", len(workspaces))

	// Get version from root package.json (all packages share the same version)
	version := npm.MustGetVersion(".")
	series, err := releaseSeries(version)
	if err != nil {
		logrus.WithError(err).Fatal("invalid version in package.json")
	}

	// get all tags and the latest state of the release branch
	if err := exec.Command("git", "fetch", "--tags", *remote).Run(); err != nil {
		logrus.WithError(err).Fatalf("unable to fetch the remote %s", *remote)
	}

	targetCommit := checkReleaseBranch(series, *remote)

	// Create a single release for the monorepo
	release(version, series, targetCommit)
}
