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

/**
 * Selection configuration
 */
export interface SelectionConfig {
  enabled: boolean;
  variant?: 'single' | 'multiple';
}

/**
 * Field mapping for payload transformation
 */
export interface FieldMapping {
  source: string;
  target: string;
}

/**
 * Rate limit configuration for webhook actions
 */
export interface WebhookRateLimitConfig {
  requestsPerSecond?: number;
  maxConcurrent?: number;
}

/**
 * Available action icons
 */
export type ActionIcon =
  | 'send'
  | 'delete'
  | 'copy'
  | 'download'
  | 'refresh'
  | 'play'
  | 'stop'
  | 'check'
  | 'close'
  | 'warning';

/**
 * Condition types for action visibility
 */
export interface ValueCondition {
  kind: 'Value';
  spec: {
    value: string;
  };
}

export interface RangeCondition {
  kind: 'Range';
  spec: {
    min?: number;
    max?: number;
  };
}

export interface RegexCondition {
  kind: 'Regex';
  spec: {
    expr: string;
  };
}

export interface MiscCondition {
  kind: 'Misc';
  spec: {
    value: 'empty' | 'null' | 'NaN' | 'true' | 'false';
  };
}

export type ActionCondition = ValueCondition | RangeCondition | RegexCondition | MiscCondition;

/**
 * Callback action spec - dispatches a custom window event
 */
export interface CallbackActionSpec {
  eventName: string;
}

/**
 * Webhook action spec - calls an HTTP endpoint
 */
export interface WebhookActionSpec {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  rateLimit?: WebhookRateLimitConfig;
}

/**
 * Selection action definition
 */
export interface SelectionAction {
  id: string;
  label: string;
  icon?: ActionIcon;
  kind: 'callback' | 'webhook';
  spec: CallbackActionSpec | WebhookActionSpec;

  // Payload transformation options (mutually exclusive)
  payloadTemplate?: string;
  fieldMapping?: FieldMapping[];

  // Execution options
  bulkMode?: boolean;

  // Confirmation dialog options
  requireConfirmation?: boolean;
  confirmationMessage?: string;

  // Conditional visibility (action shown if condition matches ANY selected item)
  condition?: ActionCondition;
}

/**
 * Error tracking for failed selection actions
 */
export interface SelectionActionError {
  itemId: string;
  actionId: string;
  actionLabel: string;
  errorMessage: string;
  timestamp: number;
}

/**
 * Result of action execution
 */
export interface ActionExecutionResult {
  failedItems: SelectionActionError[];
}

/**
 * Type guard for CallbackActionSpec
 */
export function isCallbackAction(action: SelectionAction): action is SelectionAction & { spec: CallbackActionSpec } {
  return action.kind === 'callback';
}

/**
 * Type guard for WebhookActionSpec
 */
export function isWebhookAction(action: SelectionAction): action is SelectionAction & { spec: WebhookActionSpec } {
  return action.kind === 'webhook';
}
