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
	"flag"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/perses/perses/scripts/pkg/npm"
	"github.com/perses/shared/scripts/tag"
	"github.com/sirupsen/logrus"
)

func publishPackage(workspacePath string, dryRun bool) error {
	// Read package.json from workspace
	pck, err := npm.GetPackage(workspacePath)
	if err != nil {
		return err
	}

	// Get the dist directory path
	libraryPath := filepath.Join(workspacePath, "dist")

	// Get absolute path to return to later
	originalDir, err := os.Getwd()
	if err != nil {
		return err
	}

	// Change to the dist directory
	if err := os.Chdir(libraryPath); err != nil {
		return err
	}

	// Prepare the npm publish command
	args := []string{"publish", "--access", "public"}
	if dryRun {
		args = append(args, "--dry-run")
	}

	cmd := exec.Command("npm", args...)
	output, execErr := cmd.CombinedOutput()

	// Change back to original directory
	if chdirErr := os.Chdir(originalDir); chdirErr != nil {
		logrus.WithError(chdirErr).Warnf("unable to change back to original directory")
	}

	if execErr != nil {
		return execErr
	}

	logrus.Infof("Package %s@%s published to npm. Output:\n%s", pck.Name, pck.Version, string(output))
	return nil
}

func verifyVersions(workspaces []string, expectedVersion string) error {
	var mismatches []string

	for _, workspace := range workspaces {
		pck, err := npm.GetPackage(workspace)
		if err != nil {
			return fmt.Errorf("unable to read package.json for workspace %s: %w", workspace, err)
		}

		if pck.Version != expectedVersion {
			mismatches = append(mismatches, fmt.Sprintf("%s (expected: %s, found: %s)", workspace, expectedVersion, pck.Version))
		} else {
			logrus.Infof("✓ Workspace %s version matches: %s", workspace, pck.Version)
		}
	}

	if len(mismatches) > 0 {
		return fmt.Errorf("version mismatch in workspace(s):\n  %s", strings.Join(mismatches, "\n  "))
	}

	return nil
}

func main() {
	dryRun := flag.Bool("dry-run", false, "Perform a dry run without actually publishing")
	tagFlag := tag.Flag()
	flag.Parse()

	// Parse tag and get version (without 'v' prefix)
	expectedVersion := tag.Parse(tagFlag)
	logrus.Infof("Expected version from tag: %s", expectedVersion)

	// Get workspaces from root package.json
	workspaces := npm.MustGetWorkspaces(".")
	if len(workspaces) == 0 {
		logrus.Fatal("no workspaces found in package.json")
	}

	logrus.Infof("Found %d workspace(s) to publish", len(workspaces))

	// Verify versions match the tag
	logrus.Infof("Verifying workspace versions match tag version %s...", expectedVersion)
	if err := verifyVersions(workspaces, expectedVersion); err != nil {
		logrus.WithError(err).Fatal("version verification failed")
	}
	logrus.Info("✓ All workspace versions verified successfully!")

	// Publish each workspace
	var failures []string
	for _, workspace := range workspaces {
		logrus.Infof("Publishing workspace: %s", workspace)
		if err := publishPackage(workspace, *dryRun); err != nil {
			logrus.WithError(err).Errorf("failed to publish workspace: %s", workspace)
			failures = append(failures, workspace)
		}
	}

	if len(failures) > 0 {
		logrus.Fatalf("failed to publish %d workspace(s): %v", len(failures), failures)
	}

	logrus.Info("All packages published successfully!")
}
