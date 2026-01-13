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

package tag

import (
	"flag"
	"regexp"

	"github.com/sirupsen/logrus"
)

var versionPattern = regexp.MustCompile(`^v(\d+\.\d+\.\d+(?:-[\w\d.]+)?)$`)

func Flag() *string {
	return flag.String("tag", "", "Release tag (format: v1.2.3)")
}

// Parse parses a tag in the format "v1.2.3" and returns the version without the 'v' prefix
func Parse(tag *string) string {
	if tag == nil || *tag == "" {
		logrus.Fatal("Tag parameter is required (format: v1.2.3)")
	}

	tagValue := *tag
	matches := versionPattern.FindStringSubmatch(tagValue)
	if len(matches) != 2 {
		logrus.Fatalf("Invalid tag format: %s. Expected format: v1.2.3", tagValue)
	}

	// Return version without 'v' prefix
	return matches[1]
}
