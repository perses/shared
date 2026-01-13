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
	"flag"
	"fmt"
	"os/exec"

	"github.com/perses/perses/scripts/pkg/changelog"
	"github.com/perses/perses/scripts/pkg/command"
	"github.com/perses/perses/scripts/pkg/npm"
	"github.com/sirupsen/logrus"
)

func release() {
	// Get version from root package.json and format it.
	releaseName := fmt.Sprintf("v%s", npm.MustGetVersion("."))

	// ensure the tag does not already exist
	if execErr := command.Run("git", "rev-parse", "--verify", releaseName); execErr == nil {
		logrus.Infof("release %s already exists", releaseName)
		return
	}

	logrus.Infof("Creating release %s", releaseName)

	// create the GitHub release
	if execErr := command.Run("gh", "release", "create", releaseName, "-t", releaseName, "-n", generateChangelog()); execErr != nil {
		logrus.WithError(execErr).Fatalf("unable to create the release %s", releaseName)
	}

	logrus.Infof("✓ Successfully created release %s", releaseName)
}

func getPreviousTag() string {
	data, err := exec.Command("git", "describe", "--tags", "--abbrev=0", "--match", "v*").Output()
	if err != nil {
		if exitError, ok := err.(*exec.ExitError); ok {
			if exitError.ExitCode() == 128 {
				return ""
			}
		}

		logrus.Fatal(err)
	}
	return string(bytes.ReplaceAll(data, []byte("\n"), []byte("")))
}

func generateChangelog() string {
	previousTag := getPreviousTag()
	if previousTag == "" {
		logrus.Infof("no previous tag found for libraries, skipping changelog generation")
		return "First release"
	}
	logrus.Infof("previous tag for libraries is %s", previousTag)
	entries := changelog.GetGitLogs(previousTag)

	return changelog.New(entries).GenerateChangelog()
}

// This script generates Github release(s).
//
// Prerequisites for running this script:
// - Install the GitHub CLI (gh): https://github.com/cli/cli#installation
// - Use it to log in to GitHub: `gh auth login`
//
// Usage:
//
// This will create a single release for all libraries in the monorepo:
//
//	go run ./scripts/release
//
// NB: this script doesn't handle the plugin archive creation, a CI task is responsible for this.
func main() {
	flag.Parse()
	// get all tags locally
	if err := exec.Command("git", "fetch", "--tags").Run(); err != nil {
		logrus.WithError(err).Fatal("unable to fetch the tags")
	}

	// Verify all workspaces exist and have the same version
	workspaces := npm.MustGetWorkspaces(".")
	if len(workspaces) == 0 {
		logrus.Fatal("no workspaces found in package.json")
	}

	logrus.Infof("Found %d workspace(s) in monorepo", len(workspaces))

	// Create a single release for the monorepo (all packages share the same version)
	release()
}
