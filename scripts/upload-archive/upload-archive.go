// Copyright 2024 The Perses Authors
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
	"encoding/json"
	"flag"
	"fmt"
	"os/exec"
	"path/filepath"

	"github.com/perses/shared/scripts/command"
	"github.com/perses/shared/scripts/npm"
	"github.com/perses/shared/scripts/tag"
	"github.com/sirupsen/logrus"
)

func uploadArchive(workspacePath string, version string, releaseTag string) error {
	pck, err := npm.GetPackage(workspacePath)
	if err != nil {
		return fmt.Errorf("unable to read package file for workspace %s: %w", workspacePath, err)
	}

	// Use package name for archive
	packageName := pck.Name
	expectedArchiveName := fmt.Sprintf("%s-%s.tar.gz", packageName, version)

	// Check that the archive release does not already exist
	cmd := exec.Command("gh", "release", "view", releaseTag, "--json", "assets")
	output, execErr := cmd.CombinedOutput()
	if execErr == nil {
		var releaseInfo struct {
			Assets []struct {
				Name string `json:"name"`
			} `json:"assets"`
		}
		if jsonErr := json.Unmarshal(output, &releaseInfo); jsonErr != nil {
			logrus.WithError(jsonErr).Warnf("failed to parse gh release view output for tag %s, proceeding with upload attempt", releaseTag)
		} else {
			for _, asset := range releaseInfo.Assets {
				if asset.Name == expectedArchiveName {
					logrus.Warnf("archive %s already exists in release %s, skipping upload", expectedArchiveName, releaseTag)
					return nil
				}
			}
			logrus.Infof("release %s found, but archive %s is missing. Proceeding with upload.", releaseTag, expectedArchiveName)
		}
	} else {
		logrus.Infof("release %s not found or gh command failed, proceeding with upload attempt. Error: %v", releaseTag, execErr)
	}

	// Upload the archive to GitHub
	archivePath := filepath.Join(workspacePath, expectedArchiveName)
	if execErr := command.Run("gh", "release", "upload", releaseTag, archivePath); execErr != nil {
		return fmt.Errorf("unable to upload archive %s: %w", expectedArchiveName, execErr)
	}

	logrus.Infof("✓ Successfully uploaded %s to release %s", expectedArchiveName, releaseTag)
	return nil
}

func main() {
	t := tag.Flag()
	flag.Parse()

	version := tag.Parse(t)
	releaseTag := *t

	// Get workspaces from root package.json
	workspaces, err := npm.GetWorkspaces()
	if err != nil {
		logrus.WithError(err).Fatal("unable to read workspaces from package.json")
	}

	if len(workspaces) == 0 {
		logrus.Fatal("no workspaces found in package.json")
	}

	logrus.Infof("Found %d workspace(s) to upload archives for", len(workspaces))

	// Upload archives for all workspaces
	for _, workspace := range workspaces {
		logrus.Infof("Uploading archive for workspace: %s", workspace)
		if err := uploadArchive(workspace, version, releaseTag); err != nil {
			logrus.WithError(err).Fatalf("failed to upload archive for workspace %s", workspace)
		}
	}

	logrus.Info("✓ All archives uploaded successfully!")
}
