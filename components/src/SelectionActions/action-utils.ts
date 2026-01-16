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

import {
  ActionCondition,
  ActionExecutionResult,
  FieldMapping,
  SelectionAction,
  SelectionActionError,
  WebhookRateLimitConfig,
  isCallbackAction,
  isWebhookAction,
} from './selection-action-model';

/**
 * Substitute variables in a template string
 * Supports:
 * - ${varName} for dashboard variables
 * - ${__data.fields["columnName"]} for item data
 *
 * @param template The template string with variable placeholders
 * @param item Item data for ${__data.fields["columnName"]} substitution
 * @param replaceVariables Function for variable replacement (from plugin-system)
 */
export function substituteSelectionVariables(
  template: string,
  item: Record<string, unknown>,
  replaceVariables: (text: string) => string
): string {
  let result = template;

  // Replace ${__data.fields["columnName"]} with item values
  const fieldRegex = /\$\{__data\.fields\["([^"]+)"\]\}/g;
  result = result.replace(fieldRegex, (_, fieldName) => {
    const value = item[fieldName];
    if (value === undefined || value === null) {
      return '';
    }
    return String(value);
  });

  // Use replaceVariables for remaining variables
  // This supports multi-value variables with formatting (e.g., ${var:csv}, ${var:pipe})
  return replaceVariables(result);
}

/**
 * Apply field mapping to transform item data
 */
export function applyFieldMapping(
  item: Record<string, unknown>,
  fieldMappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const { source, target } of fieldMappings) {
    if (source && target) {
      result[target] = item[source];
    }
  }
  return result;
}

/**
 * Build payload for a single item based on action configuration
 */
export function buildPayload(
  item: Record<string, unknown>,
  action: SelectionAction,
  replaceVariables: (text: string) => string
): unknown {
  if (action.payloadTemplate) {
    const substituted = substituteSelectionVariables(action.payloadTemplate, item, replaceVariables);
    try {
      return JSON.parse(substituted);
    } catch {
      // If JSON parsing fails, return the raw substituted string
      return substituted;
    }
  }

  if (action.fieldMapping && action.fieldMapping.length > 0) {
    return applyFieldMapping(item, action.fieldMapping);
  }

  // Return raw item data
  return item;
}

/**
 * Build payload for multiple items (bulk mode)
 */
export function buildBulkPayload(
  items: Array<Record<string, unknown>>,
  action: SelectionAction,
  replaceVariables: (text: string) => string
): unknown[] {
  return items.map((item) => buildPayload(item, action, replaceVariables));
}

/**
 * Generate a mock data hint structure from available columns
 */
export function generateMockDataHint(columns: string[]): string {
  if (columns.length === 0) {
    return '{\n  "column1": "<value>",\n  "column2": "<value>"\n}';
  }

  const mockObj: Record<string, string> = {};
  columns.forEach((col) => {
    mockObj[col] = '<value>';
  });
  return JSON.stringify(mockObj, null, 2);
}

/**
 * Evaluate if a condition matches an item value
 */
export function evaluateCondition(condition: ActionCondition, value: unknown): boolean {
  switch (condition.kind) {
    case 'Value':
      return String(value) === condition.spec.value;

    case 'Range': {
      const numValue = Number(value);
      if (isNaN(numValue)) return false;
      const { min, max } = condition.spec;
      if (min !== undefined && numValue < min) return false;
      if (max !== undefined && numValue > max) return false;
      return true;
    }

    case 'Regex': {
      try {
        const regex = new RegExp(condition.spec.expr);
        return regex.test(String(value));
      } catch {
        return false;
      }
    }

    case 'Misc': {
      switch (condition.spec.value) {
        case 'empty':
          return value === '' || value === undefined;
        case 'null':
          return value === null;
        case 'NaN':
          return Number.isNaN(value);
        case 'true':
          return value === true || value === 'true';
        case 'false':
          return value === false || value === 'false';
        default:
          return false;
      }
    }

    default:
      return false;
  }
}

/**
 * Evaluate if an action condition matches any value in an item
 */
export function evaluateActionCondition(condition: ActionCondition, item: Record<string, unknown>): boolean {
  // Check if condition matches any column value in the item
  for (const value of Object.values(item)) {
    if (evaluateCondition(condition, value)) {
      return true;
    }
  }
  return false;
}

/**
 * Get visible actions based on conditions and selected items
 * An action is visible if:
 * - It has no condition, OR
 * - Its condition matches ANY of the selected items
 */
export function getVisibleActions(
  actions: SelectionAction[],
  selectedItems: Array<Record<string, unknown>>
): SelectionAction[] {
  return actions.filter((action) => {
    if (!action.condition) {
      return true; // No condition means always visible
    }

    // Check if condition matches ANY selected item
    return selectedItems.some((item) => evaluateActionCondition(action.condition!, item));
  });
}

/**
 * Simple rate limiter using token bucket algorithm
 */
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private activeRequests: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;
  private readonly maxConcurrent: number;

  constructor(config: WebhookRateLimitConfig = {}) {
    this.refillRate = config.requestsPerSecond ?? Infinity;
    this.maxConcurrent = config.maxConcurrent ?? Infinity;
    this.maxTokens = this.refillRate;
    this.tokens = this.maxTokens;
    this.lastRefill = Date.now();
    this.activeRequests = 0;
  }

  private refillTokens(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  async acquire(): Promise<void> {
    // Wait for concurrent limit
    while (this.activeRequests >= this.maxConcurrent) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }

    // Wait for rate limit
    this.refillTokens();
    while (this.tokens < 1) {
      const waitTime = ((1 - this.tokens) / this.refillRate) * 1000;
      await new Promise((resolve) => setTimeout(resolve, Math.max(waitTime, 10)));
      this.refillTokens();
    }

    this.tokens -= 1;
    this.activeRequests += 1;
  }

  release(): void {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }
}

export interface ExecuteActionOptions {
  /**
   * Function to replace variables in a string.
   * Supports multi-value variables with formatting (e.g., ${var:csv}, ${var:pipe}).
   */
  replaceVariables: (text: string) => string;
  getItemId?: (item: Record<string, unknown>, index: number) => string;
}

/**
 * Execute a selection action on selected items
 */
export async function executeSelectionAction(
  action: SelectionAction,
  selectedItems: Array<Record<string, unknown>>,
  options: ExecuteActionOptions
): Promise<ActionExecutionResult> {
  const { replaceVariables, getItemId = (_, index): string => String(index) } = options;
  const failedItems: SelectionActionError[] = [];

  if (isCallbackAction(action)) {
    // Dispatch custom event
    const payload = action.bulkMode
      ? buildBulkPayload(selectedItems, action, replaceVariables)
      : selectedItems.map((item) => buildPayload(item, action, replaceVariables));

    const event = new CustomEvent(action.spec.eventName, {
      detail: {
        items: payload,
        action: {
          id: action.id,
          label: action.label,
        },
        timestamp: Date.now(),
      },
    });

    window.dispatchEvent(event);
    return { failedItems };
  }

  if (isWebhookAction(action)) {
    const rateLimiter = new RateLimiter(action.spec.rateLimit);

    if (action.bulkMode) {
      // Single request with all items
      const payload = buildBulkPayload(selectedItems, action, replaceVariables);
      const url = substituteSelectionVariables(action.spec.url, {}, replaceVariables);

      try {
        await rateLimiter.acquire();
        const response = await fetch(url, {
          method: action.spec.method || 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...action.spec.headers,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          // Mark all items as failed
          selectedItems.forEach((item, index) => {
            failedItems.push({
              itemId: getItemId(item, index),
              actionId: action.id,
              actionLabel: action.label,
              errorMessage: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: Date.now(),
            });
          });
        }
      } catch (error) {
        // Mark all items as failed
        selectedItems.forEach((item, index) => {
          failedItems.push({
            itemId: getItemId(item, index),
            actionId: action.id,
            actionLabel: action.label,
            errorMessage: error instanceof Error ? error.message : 'Request failed',
            timestamp: Date.now(),
          });
        });
      } finally {
        rateLimiter.release();
      }
    } else {
      // Individual requests per item with rate limiting
      const promises = selectedItems.map(async (item, index) => {
        const payload = buildPayload(item, action, replaceVariables);
        const url = substituteSelectionVariables(action.spec.url, item, replaceVariables);
        const itemId = getItemId(item, index);

        try {
          await rateLimiter.acquire();
          const response = await fetch(url, {
            method: action.spec.method || 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...action.spec.headers,
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            failedItems.push({
              itemId,
              actionId: action.id,
              actionLabel: action.label,
              errorMessage: `HTTP ${response.status}: ${response.statusText}`,
              timestamp: Date.now(),
            });
          }
        } catch (error) {
          failedItems.push({
            itemId,
            actionId: action.id,
            actionLabel: action.label,
            errorMessage: error instanceof Error ? error.message : 'Request failed',
            timestamp: Date.now(),
          });
        } finally {
          rateLimiter.release();
        }
      });

      await Promise.all(promises);
    }

    return { failedItems };
  }

  return { failedItems };
}
