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

package common

test1: #url & "http://localhost:9090"
test2: #url & "https://localhost:9090"

linkURLAccepted: [...#linkURL] & [
	"https://example.com/path?query=1#fragment",
	"HTTP://example.com",
	" https://example.com",
	"/projects/demo/dashboards/demo?var-job=node",
	"../explore?explorer=Tempo",
	"?var-job=node",
	"#fragment",
	"//example.com/path",
	"",
	"mailto:someone@example.com",
	"tel:+33123456789",
	"sms:+33123456789",
	"slack://channel?team=T123&id=C123",
	"msteams:/l/chat/0/0",
	"vscode://file/path/to/file",
	"vscode-insiders://file/path/to/file",
	"zoommtg://zoom.us/join?confno=123",
	"$link",
	"${__data.fields[\"url\"]}",
	"/explore?traceId=${traceId}",
]

// matchN(0, [#linkURL]) holds when the value doesn't satisfy #linkURL.
linkURLRejected: [...matchN(0, [#linkURL])] & [
	"javascript:alert(1)",
	"JaVaScRiPt:alert(1)",
	" \u0001javascript:alert(1)",
	"java\tscript:alert(1)",
	"java\nscript:alert(1)",
	"java\rscript:alert(1)",
	"data:text/html,<script>alert(1)</script>",
	"vbscript:msgbox(1)",
	"file:///etc/passwd",
	"ftp://example.com",
	"localhost:9090/graph",
]
