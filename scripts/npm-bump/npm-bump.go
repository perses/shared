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
	"fmt"
	"os"
	"path/filepath"
	"regexp"

	"github.com/perses/perses/scripts/pkg/command"
	"github.com/perses/perses/scripts/pkg/npm"
	"github.com/sirupsen/logrus"
)

var versionPattern = regexp.MustCompile(`^\d+\.\d+\.\d+(?:-[\w\d.]+)?$`)

func updatePackageVersion(workspaces []string, workspacePath string, newVersion string) error {
	// Use npm version command with --no-git-tag-version to avoid creating git tags
	// and --allow-same-version to allow setting the same version
	if err := command.RunInDirectory(workspacePath, "npm", "version", newVersion, "--no-git-tag-version", "--allow-same-version"); err != nil {
		return err
	}
	pkgPath := filepath.Join(workspacePath, "package.json")
	data, err := os.ReadFile(pkgPath)
	if err != nil {
		logrus.WithError(err).Fatalf("unable to read the file %s", pkgPath)
	}
	for _, workspace := range workspaces {
		bumpNPMDeps := regexp.MustCompile(fmt.Sprintf(`"@perses-dev/%s":\s*"(\^)?[0-9]+\.[0-9]+\.[0-9]+(-(alpha|beta|rc)\.[0-9]+)?"`, workspace))
		data = bumpNPMDeps.ReplaceAll(data, []byte(fmt.Sprintf(`"@perses-dev/%s": "%s"`, workspace, newVersion)))
	}
	if writeErr := os.WriteFile(pkgPath, data, 0644); writeErr != nil {
		logrus.WithError(writeErr).Fatalf("unable to write the file %s", pkgPath)
	}
	return nil
}

func main() {
	flag.Parse()

	if len(flag.Args()) == 0 {
		logrus.Fatal("version argument is required. Usage: npm-bump <version>")
	}

	version := flag.Args()[0]

	if !versionPattern.MatchString(version) {
		logrus.Fatalf("Invalid semantic version format: %s. Expected format: X.Y.Z or X.Y.Z-prerelease", version)
	}

	workspaces := npm.MustGetWorkspaces(".")
	if len(workspaces) == 0 {
		logrus.Info("No workspaces found")
		return
	}

	if err := updatePackageVersion(workspaces, ".", version); err != nil {
		logrus.WithError(err).Fatal("failed to update root package.json")
	}

	logrus.Infof("Updating %d workspace(s) to version %s", len(workspaces), version)

	for _, workspace := range workspaces {
		if err := updatePackageVersion(workspaces, workspace, version); err != nil {
			logrus.WithError(err).Fatalf("failed to update workspace: %s", workspace)
		}
		logrus.Infof("✓ Updated %s to version %s", workspace, version)
	}

	logrus.Info("All workspace packages updated successfully")
}
