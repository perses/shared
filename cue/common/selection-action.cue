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

import (
	"strings"
)

// Selection configuration
#selectionConfig: {
	enabled:  bool
	variant?: "single" | "multiple"
}

// Field mapping for payload transformation
#fieldMapping: {
	source: strings.MinRunes(1)
	target: strings.MinRunes(1)
}

// Rate limit configuration for webhook actions
#rateLimitConfig: {
	requestsPerSecond?: number & > 0
	maxConcurrent?:     number & > 0
}

// Condition types for action visibility (reusing pattern from table cell conditions)
#valueCondition: {
	kind: "Value"
	spec: {
		value: strings.MinRunes(1)
	}
}

#rangeCondition: {
	kind: "Range"
	spec: {
		min?: number
		max?: number & >= min
	}
}

#regexCondition: {
	kind: "Regex"
	spec: {
		expr: strings.MinRunes(1)
	}
}

#miscCondition: {
	kind: "Misc"
	spec: {
		value: "empty" | "null" | "NaN" | "true" | "false"
	}
}

#actionCondition: {
	#valueCondition | #rangeCondition | #regexCondition | #miscCondition
}

// Action kind-specific specs
#callbackActionSpec: {
	eventName: strings.MinRunes(1)
}

#webhookActionSpec: {
	url:     strings.MinRunes(1)
	method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
	headers?: {
		[string]: string
	}
	rateLimit?: #rateLimitConfig
}

// Available action icons
#actionIcon: "send" | "delete" | "copy" | "download" | "refresh" | "play" | "stop" | "check" | "close" | "warning"

// Selection action definition
#selectionAction: {
	id:    strings.MinRunes(1)
	label: strings.MinRunes(1)
	icon?: #actionIcon
	kind:  "callback" | "webhook"
	spec:  #callbackActionSpec | #webhookActionSpec

	// Payload transformation options (mutually exclusive)
	payloadTemplate?: string
	fieldMapping?: [...#fieldMapping]

	// Execution options
	bulkMode?: bool

	// Confirmation dialog options
	requireConfirmation?: bool
	confirmationMessage?: string

	// Conditional visibility (action shown if condition matches ANY selected row)
	condition?: #actionCondition
}
