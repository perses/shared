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
	"fmt"
	"os"
	"os/exec"
	"path/filepath"

	"github.com/sirupsen/logrus"
)

// This script validates CUE schema packages against their corresponding test packages.
// It merges all .cue files within each package directory to properly handle imports and
// package-level definitions.

const (
	schemasDir = "cue"
	testDir    = "cue-test"
)

// dirsInScope specifies which subdirectories under cue/ to validate
var dirsInScope = []string{"common"}

// NB: this function assume 1 dirInScope = 1 package. CUE allows multiple packages per dirInScope, but this is not used here.
func findPackages(basePath string, dirInScope string) ([]string, error) {
	var packages []string
	dirPath := filepath.Join(basePath, dirInScope)

	// Include the root directory itself
	packages = append(packages, dirInScope)

	err := filepath.Walk(dirPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if info.IsDir() && path != dirPath {
			relPath, err := filepath.Rel(basePath, path)
			if err != nil {
				return err
			}
			packages = append(packages, relPath)
		}

		return nil
	})

	return packages, err
}

// vetPackage validates CUE files in schemaDir against test files in testDir.
// It collects all .cue files from both directories and runs `cue vet` on them together,
// allowing CUE to merge files in the same package and resolve imports properly.
// The command runs from schemasDir to ensure cue.mod/module.cue is accessible for imports.
func vetPackage(schemaDir, testDir string) error {
	logrus.Debugf("Validating package %s against %s", schemaDir, testDir)

	// Get list of all .cue files in both directories
	schemaFiles, err := filepath.Glob(filepath.Join(schemaDir, "*.cue"))
	if err != nil {
		return fmt.Errorf("failed to glob schema files: %w", err)
	}
	testFiles, err := filepath.Glob(filepath.Join(testDir, "*.cue"))
	if err != nil {
		return fmt.Errorf("failed to glob test files: %w", err)
	}

	// Build command args with paths relative to schemasDir (cue/)
	args := []string{"vet"}
	for _, f := range schemaFiles {
		rel, err := filepath.Rel(schemasDir, f)
		if err != nil {
			return fmt.Errorf("failed to get relative path for %s: %w", f, err)
		}
		args = append(args, rel)
	}
	for _, f := range testFiles {
		// testFiles are in ../cue-test relative to schemasDir
		rel, err := filepath.Rel(schemasDir, f)
		if err != nil {
			return fmt.Errorf("failed to get relative path for %s: %w", f, err)
		}
		args = append(args, rel)
	}

	cmd := exec.Command("cue", args...)
	cmd.Dir = schemasDir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("failed to validate %s: %w", schemaDir, err)
	}

	return nil
}

func validateCueSchemas() error {
	logrus.Debugf("Starting CUE files validation")

	// Check if cue command is available
	if _, err := exec.LookPath("cue"); err != nil {
		return fmt.Errorf("cue command not found in PATH: %w", err)
	}

	validatedCount := 0
	skippedCount := 0
	errCount := 0

	for _, dirInScope := range dirsInScope {
		logrus.Debugf("Processing directory: %s", dirInScope)
		packageDirs, err := findPackages(schemasDir, dirInScope)
		if err != nil {
			return fmt.Errorf("failed to find directories in %s/%s: %w", schemasDir, dirInScope, err)
		}

		for _, packageDir := range packageDirs {
			schemaDir := filepath.Join(schemasDir, packageDir)
			testDir := filepath.Join(testDir, packageDir)

			// Check if corresponding test directory exists
			if _, err := os.Stat(testDir); os.IsNotExist(err) {
				logrus.Debugf("Skipping %s: test directory %s not found", schemaDir, testDir)
				skippedCount++
				continue
			}

			logrus.Infof("Validating package %s with test package %s", schemaDir, testDir)
			if err := vetPackage(schemaDir, testDir); err != nil {
				logrus.Errorf("Validation failed for %s: %v", schemaDir, err)
				errCount++
			}

			validatedCount++
		}
	}
	if errCount > 0 {
		return fmt.Errorf("validation failed for %d file(s)", errCount)
	}

	logrus.Infof("CUE files validation completed: %d validated, %d skipped", validatedCount, skippedCount)
	return nil
}

func main() {
	if err := validateCueSchemas(); err != nil {
		logrus.Fatal(err)
	}
}
