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

#httpMethod: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"

#batchMode: "batch" | "individual"

#contentType: "none" | "json" | "text"

#baseAction: {
	name:            string
	icon?:           string
	confirmMessage?: string
	enabled:        bool | *true
	bodyTemplate?: string
	batchMode:     #batchMode | *"individual"
}

#eventAction: {
	#baseAction
	type:      "event"
	eventName: string
}

#webhookAction: {
	#baseAction
	type:   "webhook"
	url:    string
	method: #httpMethod | *"POST"
	contentType: #contentType | *"none"
	headers?: [string]: string
}

#itemAction: 
    (#eventAction & {type: "event"}) |
    (#webhookAction & {type: "webhook"})

#actions: {
	enabled: bool | *true
	actionsList: [#itemAction, ...]
	displayInHeader?: bool | *true
	displayWithItem?: bool | *true
}