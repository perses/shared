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

package npm

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Package struct {
	Name       string   `json:"name"`
	Version    string   `json:"version"`
	Workspaces []string `json:"workspaces"`
}

func GetPackage(dirPath string) (Package, error) {
	data, err := os.ReadFile(filepath.Join(dirPath, "package.json"))
	if err != nil {
		return Package{}, err
	}
	pkg := Package{}
	if unmarshalErr := json.Unmarshal(data, &pkg); unmarshalErr != nil {
		return Package{}, unmarshalErr
	}
	return pkg, nil
}

func GetWorkspaces() ([]string, error) {
	data, err := os.ReadFile("package.json")
	if err != nil {
		return nil, err
	}
	pkg := Package{}
	if unmarshalErr := json.Unmarshal(data, &pkg); unmarshalErr != nil {
		return nil, unmarshalErr
	}
	return pkg.Workspaces, nil
}
