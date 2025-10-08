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
	"os/exec"
	"path/filepath"
	"runtime"

	"github.com/perses/shared/scripts/command"
	"github.com/perses/shared/scripts/npm"
	"github.com/sirupsen/logrus"
)

func buildLibraries() error {
	logrus.Info("Building all libraries...")
	if err := command.Run("npm", "run", "build"); err != nil {
		return fmt.Errorf("failed to build libraries: %w", err)
	}
	logrus.Info("✓ Build completed successfully")
	return nil
}

func createArchive(workspacePath string) error {
	pck, err := npm.GetPackage(workspacePath)
	if err != nil {
		return fmt.Errorf("unable to read package.json for %s: %w", workspacePath, err)
	}

	distPath := filepath.Join(workspacePath, "dist")
	if _, err := os.Stat(distPath); os.IsNotExist(err) {
		logrus.Warnf("Skipping %s: dist directory not found", workspacePath)
		return nil
	}

	// Use format: perses-<workspace>-v<version>
	archiveName := fmt.Sprintf("perses-%s-v%s.tar.gz", workspacePath, pck.Version)
	archivePath := filepath.Join(workspacePath, archiveName)

	logrus.Infof("Creating archive: %s", archiveName)

	// Build tar command arguments to include contents of dist/ without the dist folder itself
	// We use -C to change to the dist directory and then archive "." (current directory contents)
	args := []string{"-czf", archivePath, "-C", distPath, "."}

	// On macOS, disable copyfile to avoid including extended attributes
	if runtime.GOOS == "darwin" {
		args = append([]string{"--disable-copyfile"}, args...)
	}

	// Create the tar.gz archive
	if execErr := exec.Command("tar", args...).Run(); execErr != nil {
		return fmt.Errorf("failed to create archive: %w", execErr)
	}

	logrus.Infof("✓ Created %s", archiveName)
	return nil
}

func main() {
	skipBuild := flag.Bool("skip-build", false, "Skip the build step and only create archives")
	flag.Parse()

	// Build libraries if not skipped
	if !*skipBuild {
		if err := buildLibraries(); err != nil {
			logrus.WithError(err).Fatal("Build failed")
		}
	}

	// Get workspaces from root package.json
	workspaces, err := npm.GetWorkspaces()
	if err != nil {
		logrus.WithError(err).Fatal("unable to read workspaces from package.json")
	}

	if len(workspaces) == 0 {
		logrus.Fatal("no workspaces found in package.json")
	}

	logrus.Infof("Creating archives for %d workspace(s)...", len(workspaces))

	// Create archive for each workspace
	for _, workspace := range workspaces {
		if err := createArchive(workspace); err != nil {
			logrus.WithError(err).Fatalf("failed to create archive for workspace %s", workspace)
		}
	}

	logrus.Info("✓ All archives created successfully!")
}
