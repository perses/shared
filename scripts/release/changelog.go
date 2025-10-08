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
	"bytes"
	"os/exec"

	"github.com/perses/shared/scripts/changelog"
	"github.com/sirupsen/logrus"
)

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
