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
	"context"
	"flag"
	"time"

	"github.com/perses/common/async"
	"github.com/perses/shared/scripts/command"
	"github.com/perses/shared/scripts/npm"
	"github.com/perses/shared/scripts/tag"
	"github.com/sirupsen/logrus"
)

func main() {
	workspaces, err := npm.GetWorkspaces()
	if err != nil {
		logrus.WithError(err).Fatal("unable to get the list of the workspaces")
	}

	librariesToBuild := make([]async.Future[string], 0, len(workspaces))

	t := tag.Flag()
	flag.Parse()

	if *t != "" {
		libraryPath, _ := tag.Parse(t)
		librariesToBuild = append(librariesToBuild, async.Async(func() (string, error) {
			return libraryPath, command.RunInDirectory(libraryPath, "npm", "run", "build")
		}))
	} else {
		logrus.Info("no tag provided, building all libraries")

		librariesToBuild = append(librariesToBuild, async.Async(func() (string, error) {
			return "[all]", command.Run("npm", "run", "build")
		}))
	}
	isErr := false
	for _, libraryToBuild := range librariesToBuild {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
		workspace, buildErr := libraryToBuild.AwaitWithContext(ctx)
		if buildErr != nil {
			isErr = true
			logrus.WithError(buildErr).Errorf("failed to build library %s", workspace)
		}
		cancel()
	}
	if isErr {
		logrus.Fatal("some libraries have not been built successfully")
	}
}
