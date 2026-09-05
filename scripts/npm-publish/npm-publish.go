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
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/perses/perses/scripts/pkg/npm"
	"github.com/perses/shared/scripts/tag"
	"github.com/sirupsen/logrus"
)

func publishPackage(workspacePath string, dryRun bool) error {
	return publishPackageWithOutput(workspacePath, dryRun, os.Stdout, os.Stderr)
}

func publishPackageWithOutput(workspacePath string, dryRun bool, stdout io.Writer, stderr io.Writer) error {
	// Read package.json from workspace
	pck, err := npm.GetPackage(workspacePath)
	if err != nil {
		return err
	}

	// Resolve the workspace directory. pnpm requires package.json in the publish working directory.
	libraryPath, err := filepath.Abs(workspacePath)
	if err != nil {
		return fmt.Errorf("unable to resolve workspace directory for package %s@%s: %w", pck.Name, pck.Version, err)
	}

	// Prepare the pnpm publish command
	args := []string{"publish", "--access", "public", "--tag", npmDistTag(pck.Version)}
	if dryRun {
		args = append(args, "--dry-run")
	}

	args = append(args, "--no-git-checks")
	cmd := exec.Command("pnpm", args...)
	cmd.Dir = libraryPath
	cmd.Stdout = stdout
	cmd.Stderr = stderr
	if execErr := cmd.Run(); execErr != nil {
		return fmt.Errorf("pnpm %s failed for package %s@%s in %s: %w", strings.Join(args, " "), pck.Name, pck.Version, libraryPath, execErr)
	}

	logrus.Infof("Package %s@%s published to npm", pck.Name, pck.Version)
	return nil
}

func npmDistTag(version string) string {
	_, _, found := strings.Cut(version, "-")
	if !found {
		return "latest"
	}
	return "prerelease"
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
