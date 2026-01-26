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

package proxy

myDirectSpec: #baseHTTPDatasourceSpec & {
	directUrl: "http://localhost:8080"
}

myProxySpec: #baseHTTPDatasourceSpec & {
	proxy: #HTTPProxy & {
		kind: "HTTPProxy"
		spec: {
			url: "https://prometheus.demo.prometheus.io"
			allowedEndpoints: [
				{
					endpointPattern: "/api/v1/labels"
					method:          "POST"
				},
				{
					endpointPattern: "/api/v1/series"
					method:          "POST"
				},
			]
		}
	}
}
