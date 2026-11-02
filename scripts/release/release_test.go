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

import "testing"

func TestReleaseSeries(t *testing.T) {
	tests := []struct {
		version    string
		wantSeries string
		wantBranch string
		wantErr    bool
	}{
		{version: "0.56.0-beta.0", wantSeries: "v0.56", wantBranch: "release/v0.56"},
		{version: "0.56.0-rc.1", wantSeries: "v0.56", wantBranch: "release/v0.56"},
		{version: "0.56.0", wantSeries: "v0.56", wantBranch: "release/v0.56"},
		{version: "0.56.12", wantSeries: "v0.56", wantBranch: "release/v0.56"},
		{version: "1.0.0", wantSeries: "v1.0", wantBranch: "release/v1.0"},
		{version: "v0.56.0", wantErr: true},
		{version: "0.56", wantErr: true},
		{version: "", wantErr: true},
	}

	for _, test := range tests {
		t.Run(test.version, func(t *testing.T) {
			series, err := releaseSeries(test.version)
			if test.wantErr {
				if err == nil {
					t.Fatalf("releaseSeries(%q) error = nil, want an error", test.version)
				}
				return
			}
			if err != nil {
				t.Fatalf("releaseSeries(%q) error = %v", test.version, err)
			}
			if series != test.wantSeries {
				t.Errorf("releaseSeries(%q) = %q, want %q", test.version, series, test.wantSeries)
			}
			if branch := releaseBranch(series); branch != test.wantBranch {
				t.Errorf("releaseBranch(%q) = %q, want %q", series, branch, test.wantBranch)
			}
		})
	}
}

func TestIsPrerelease(t *testing.T) {
	tests := map[string]bool{
		"0.56.0-beta.0": true,
		"0.56.0-rc.1":   true,
		"2.0.0-1":       true,
		"0.56.0":        false,
		"0.56.3":        false,
	}

	for version, want := range tests {
		if got := isPrerelease(version); got != want {
			t.Errorf("isPrerelease(%q) = %t, want %t", version, got, want)
		}
	}
}
