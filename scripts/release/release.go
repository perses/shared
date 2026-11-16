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
	"errors"
	"flag"
	"fmt"
	"os/exec"
	"regexp"
	"strings"

	"github.com/perses/perses/scripts/pkg/changelog"
	"github.com/perses/perses/scripts/pkg/command"
	"github.com/perses/perses/scripts/pkg/git"
	"github.com/perses/perses/scripts/pkg/npm"
	"github.com/sirupsen/logrus"
)

// repository is the GitHub repository in which the release is created, whatever the default repository of gh is.
const repository = "perses/shared"

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

// gitOutput runs git with the given arguments and returns its trimmed standard output.
// On failure, the returned error contains the standard error of git.
func gitOutput(args ...string) (string, error) {
	data, err := exec.Command("git", args...).Output()
	if err == nil {
		return strings.TrimSpace(string(data)), nil
	}
	cmdLine := "git " + strings.Join(args, " ")
	if exitErr, ok := errors.AsType[*exec.ExitError](err); ok && len(bytes.TrimSpace(exitErr.Stderr)) > 0 {
		return "", fmt.Errorf("%s: %w: %s", cmdLine, err, bytes.TrimSpace(exitErr.Stderr))
	}
	return "", fmt.Errorf("%s: %w", cmdLine, err)
}

func tagExists(tag string) bool {
	_, err := gitOutput("rev-parse", "--verify", "--quiet", "refs/tags/"+tag)
	return err == nil
}

// releaseCommit returns the commit to tag: the HEAD of the release branch of the given series.
// The local branch must be in sync with the remote, as the changelog is generated from the local history.
func releaseCommit(series string, remote string) (string, error) {
	branch := releaseBranch(series)
	if current := git.CurrentBranch(); current != branch {
		return "", fmt.Errorf("release series %s must be released from the branch %s, but the current branch is %q",
			series, branch, current)
	}

	// Fetch the branch with an explicit refspec: the configured one may not cover it (e.g. single-branch clone).
	remoteRef := fmt.Sprintf("refs/remotes/%s/%s", remote, branch)
	refspec := fmt.Sprintf("+refs/heads/%s:%s", branch, remoteRef)
	if err := command.Run("git", "fetch", "--quiet", remote, refspec); err != nil {
		return "", fmt.Errorf("unable to fetch the branch %s from the remote %s (not pushed?): %w", branch, remote, err)
	}

	localCommit, err := gitOutput("rev-parse", "HEAD")
	if err != nil {
		return "", err
	}
	remoteCommit, err := gitOutput("rev-parse", "--verify", remoteRef)
	if err != nil {
		return "", err
	}
	if localCommit != remoteCommit {
		return "", fmt.Errorf("the local branch %s (%s) is not in sync with %s/%s (%s)",
			branch, localCommit, remote, branch, remoteCommit)
	}
	return localCommit, nil
}

// previousTag returns the closest tag reachable from HEAD, looking first at the tags of the given release series:
// a tag of another series can be closer (e.g. when main has been merged into the release branch).
// It returns an empty string when no tag is found.
func previousTag(series string) (string, error) {
	for _, pattern := range []string{series + ".*", "v*"} {
		tag, err := gitOutput("describe", "--tags", "--abbrev=0", "--match", pattern)
		if err == nil {
			return tag, nil
		}
		// git describe exits with the code 128 when no tag matches the pattern
		if exitErr, ok := errors.AsType[*exec.ExitError](err); !ok || exitErr.ExitCode() != 128 {
			return "", err
		}
	}
	return "", nil
}

func generateChangelog(series string) (string, error) {
	tag, err := previousTag(series)
	if err != nil {
		return "", fmt.Errorf("looking for the previous tag: %w", err)
	}
	if tag == "" {
		logrus.Info("no previous tag found for libraries, skipping changelog generation")
		return "First release", nil
	}
	logrus.Infof("previous tag for libraries is %s", tag)
	return changelog.New(changelog.GetGitLogs(tag)).GenerateChangelog(), nil
}

// ghReleaseArgs returns the arguments of the gh command creating the GitHub release and its tag on the given commit.
func ghReleaseArgs(version string, commit string, notes string) []string {
	tag := "v" + version
	args := []string{"release", "create", tag, "--repo", repository, "--target", commit, "--title", tag}
	// Same rule as for the npm dist-tag: a version with a prerelease suffix (beta, rc...) is a prerelease.
	if strings.Contains(version, "-") {
		args = append(args, "--prerelease")
	}
	return append(args, "--notes", notes)
}

func run(remote string, dryRun bool) error {
	workspaces, err := npm.GetWorkspaces(".")
	if err != nil {
		return fmt.Errorf("reading the workspaces: %w", err)
	}
	if len(workspaces) == 0 {
		return errors.New("no workspaces found in package.json")
	}
	logrus.Infof("Found %d workspace(s) in monorepo", len(workspaces))

	// All packages share the version of the root package.json.
	version, err := npm.GetVersion(".")
	if err != nil {
		return fmt.Errorf("reading the version: %w", err)
	}
	series, err := releaseSeries(version)
	if err != nil {
		return err
	}

	// get all tags
	if err := command.Run("git", "fetch", "--tags", remote); err != nil {
		return fmt.Errorf("fetching the remote %s: %w", remote, err)
	}

	tag := "v" + version
	if tagExists(tag) {
		logrus.Infof("release %s already exists", tag)
		return nil
	}

	commit, err := releaseCommit(series, remote)
	if err != nil {
		return err
	}
	notes, err := generateChangelog(series)
	if err != nil {
		return err
	}
	args := ghReleaseArgs(version, commit, notes)

	if dryRun {
		logrus.Infof("[dry-run] creating the release: `gh %s`", strings.Join(args, " "))
		return nil
	}
	logrus.Infof("Creating release %s on the commit %s", tag, commit)
	if err := command.Run("gh", args...); err != nil {
		return fmt.Errorf("creating the release %s: %w", tag, err)
	}
	logrus.Infof("✓ Successfully created release %s", tag)
	return nil
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
// This will only print the release that would be created:
//
//	go run ./scripts/release --dry-run
//
// NB: this script doesn't publish the libraries, a CI task does it once the GitHub release is published.
func main() {
	remote := flag.String("remote", "origin", "name of the git remote pointing to the perses/shared repository")
	dryRun := flag.Bool("dry-run", false, "do not perform any changes, only print what would be done")
	flag.Parse()

	if err := run(*remote, *dryRun); err != nil {
		logrus.WithError(err).Fatal("unable to create the release")
	}
}
