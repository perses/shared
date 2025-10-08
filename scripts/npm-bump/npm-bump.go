// Copyright 2025 The Perses Authors
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
	"flag"
	"regexp"

	"github.com/perses/shared/scripts/command"
	"github.com/perses/shared/scripts/npm"
	"github.com/sirupsen/logrus"
)

var versionPattern = regexp.MustCompile(`^\d+\.\d+\.\d+(?:-[\w\d.]+)?$`)

func main() {
	flag.Parse()

	if len(flag.Args()) == 0 {
		logrus.Fatal("version argument is required. Usage: npm-bump <version>")
	}

	version := flag.Args()[0]

	if !versionPattern.MatchString(version) {
		logrus.Fatalf("Invalid semantic version format: %s. Expected format: X.Y.Z or X.Y.Z-prerelease", version)
	}

	workspaces, err := npm.GetWorkspaces()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get workspaces from root package.json")
	}

	if len(workspaces) == 0 {
		logrus.Info("No workspaces found")
		return
	}

	if err := updatePackageVersion(".", version); err != nil {
		logrus.WithError(err).Fatal("failed to update root package.json")
	}

	logrus.Infof("Updating %d workspace(s) to version %s", len(workspaces), version)

	for _, workspace := range workspaces {
		if err := updatePackageVersion(workspace, version); err != nil {
			logrus.WithError(err).Fatalf("failed to update workspace: %s", workspace)
		}
		logrus.Infof("✓ Updated %s to version %s", workspace, version)
	}

	logrus.Info("All workspace packages updated successfully")
}

func updatePackageVersion(workspacePath string, newVersion string) error {
	// Use npm version command with --no-git-tag-version to avoid creating git tags
	// and --allow-same-version to allow setting the same version
	if err := command.RunInDirectory(workspacePath, "npm", "version", newVersion, "--no-git-tag-version", "--allow-same-version"); err != nil {
		return err
	}
	return nil
}
