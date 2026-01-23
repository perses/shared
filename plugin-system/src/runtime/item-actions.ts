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
  ActionStatus,
  interpolateSelectionBatch,
  interpolateSelectionIndividual,
  SelectionItem,
  VariableStateMap,
} from '@perses-dev/components';
import { fetch } from '@perses-dev/core';
import { ItemAction, EventAction, WebhookAction } from '../components/ItemSelectionActionsOptionsEditor';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

function buildWebhookHeaders(action: WebhookAction): Record<string, string> {
  const headers: Record<string, string> = { ...(action.headers ?? {}) };
  const contentType = action.contentType ?? 'none';
  const supportsBody = BODY_METHODS.has(action.method);

  if (supportsBody && contentType === 'json') {
    headers['Content-Type'] = 'application/json';
  } else if (supportsBody && contentType === 'text') {
    headers['Content-Type'] = 'text/plain; charset=utf-8';
  }

  return headers;
}

/**
 * Parameters for executing a selection action
 */
export interface ExecuteActionParams<Id = unknown> {
  /** The action to execute */
  action: ItemAction;
  /** Map of selection IDs to their data */
  selectionMap: Map<Id, SelectionItem>;
  /** Optional dashboard variable state for interpolation */
  variableState?: VariableStateMap;
  /** Callback to update action status */
  setActionStatus: (actionName: string, status: Partial<ActionStatus>, itemId?: Id) => void;
}

/**
 * Result of action execution
 */
export interface ActionExecutionResult {
  success: boolean;
  error?: Error;
  /** For individual batch mode, results per item */
  itemResults?: Map<unknown, { success: boolean; error?: Error }>;
}

/**
 * Execute an event action by dispatching a single CustomEvent with batch data
 */
function executeEventBatch<Id>(
  action: EventAction,
  selectionMap: Map<Id, SelectionItem>,
  variableState: VariableStateMap | undefined,
  setActionStatus: ExecuteActionParams<Id>['setActionStatus']
): ActionExecutionResult {
  try {
    setActionStatus(action.name, { loading: true });

    const items = Array.from(selectionMap.values());

    // Interpolate body template if provided
    let body: string | undefined;
    if (action.bodyTemplate) {
      const bodyResult = interpolateSelectionBatch(action.bodyTemplate, items, variableState);
      body = bodyResult.text;
    } else {
      body = JSON.stringify({ items });
    }

    const event = new CustomEvent(action.eventName, {
      detail: body,
      bubbles: true,
      cancelable: true,
    });

    window.dispatchEvent(event);

    setActionStatus(action.name, { loading: false, success: true });
    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    setActionStatus(action.name, { loading: false, error: err });
    return { success: false, error: err };
  }
}

/**
 * Execute events actions by dispatching one CustomEvent per selection
 */
function executeEventIndividual<Id>(
  action: EventAction,
  selectionMap: Map<Id, SelectionItem>,
  variableState: VariableStateMap | undefined,
  setActionStatus: ExecuteActionParams<Id>['setActionStatus']
): ActionExecutionResult {
  const entries = Array.from(selectionMap.entries());
  const count = entries.length;
  const itemResults = new Map<Id, { success: boolean; error?: Error }>();

  // Initialize all items as loading
  setActionStatus(action.name, { loading: true, itemStatuses: new Map() });

  for (let index = 0; index < entries.length; index++) {
    const [id, item] = entries[index]!;

    setActionStatus(action.name, { loading: true }, id);

    try {
      // Interpolate body template if provided
      let body: string | undefined;
      if (action.bodyTemplate) {
        const bodyResult = interpolateSelectionIndividual(action.bodyTemplate, item, index, count, variableState);
        body = bodyResult.text;
      } else {
        body = JSON.stringify({ id, data: item });
      }

      const event = new CustomEvent(action.eventName, {
        detail: body,
        bubbles: true,
        cancelable: true,
      });

      window.dispatchEvent(event);
      itemResults.set(id, { success: true });
      setActionStatus(action.name, { loading: false, success: true }, id);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setActionStatus(action.name, { loading: false, error: err }, id);
      itemResults.set(id, { success: false, error: err });
    }
  }

  setActionStatus(action.name, { loading: false, success: true });

  return {
    success: true,
    itemResults,
  };
}

/**
 * Execute a webhook action in individual mode (one request per selection)
 */
async function executeWebhookIndividual<Id>(
  action: WebhookAction,
  selectionMap: Map<Id, SelectionItem>,
  variableState: VariableStateMap | undefined,
  setActionStatus: ExecuteActionParams<Id>['setActionStatus']
): Promise<ActionExecutionResult> {
  const entries = Array.from(selectionMap.entries());
  const count = entries.length;
  const itemResults = new Map<Id, { success: boolean; error?: Error }>();

  // Initialize all items as loading
  setActionStatus(action.name, { loading: true, itemStatuses: new Map() });

  // Execute requests sequentially to avoid overwhelming the server
  for (let index = 0; index < entries.length; index++) {
    const [id, item] = entries[index]!;

    setActionStatus(action.name, { loading: true }, id);

    try {
      // Interpolate URL
      const urlResult = interpolateSelectionIndividual(action.url, item, index, count, variableState);

      // Interpolate body template if provided
      const contentType = action.contentType ?? 'none';
      const supportsBody = BODY_METHODS.has(action.method) && contentType !== 'none';
      let body: string | undefined;
      if (supportsBody && action.bodyTemplate) {
        const bodyResult = interpolateSelectionIndividual(action.bodyTemplate, item, index, count, variableState);
        body = bodyResult.text;
      }

      // Make the request
      const response = await fetch(urlResult.text, {
        method: action.method,
        headers: buildWebhookHeaders(action),
        body: body,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      setActionStatus(action.name, { loading: false, success: true }, id);
      itemResults.set(id, { success: true });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setActionStatus(action.name, { loading: false, error: err }, id);
      itemResults.set(id, { success: false, error: err });
    }
  }

  // Update overall action status
  const allSucceeded = Array.from(itemResults.values()).every((r) => r.success);
  const anyFailed = Array.from(itemResults.values()).some((r) => !r.success);

  if (allSucceeded) {
    setActionStatus(action.name, { loading: false, success: true });
  } else if (anyFailed) {
    setActionStatus(action.name, {
      loading: false,
      error: new Error('Some requests failed'),
    });
  }

  return {
    success: allSucceeded,
    itemResults,
  };
}

/**
 * Execute a webhook action in batch mode (single request with all selections)
 */
async function executeWebhookBatch<Id>(
  action: WebhookAction,
  selectionMap: Map<Id, SelectionItem>,
  variableState: VariableStateMap | undefined,
  setActionStatus: ExecuteActionParams<Id>['setActionStatus']
): Promise<ActionExecutionResult> {
  const items = Array.from(selectionMap.values());

  setActionStatus(action.name, { loading: true });

  try {
    // Interpolate URL
    const urlResult = interpolateSelectionBatch(action.url, items, variableState);

    // Interpolate body template if provided
    const contentType = action.contentType ?? 'none';
    const supportsBody = BODY_METHODS.has(action.method) && contentType !== 'none';
    let body: string | undefined;
    if (supportsBody && action.bodyTemplate) {
      const bodyResult = interpolateSelectionBatch(action.bodyTemplate, items, variableState);
      body = bodyResult.text;
    }

    // Make the request
    const response = await fetch(urlResult.text, {
      method: action.method,
      headers: buildWebhookHeaders(action),
      body: body,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    setActionStatus(action.name, { loading: false, success: true });
    return { success: true };
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    setActionStatus(action.name, { loading: false, error: err });
    return { success: false, error: err };
  }
}

/**
 * Execute a webhook action
 */
async function executeWebhookAction<Id>(
  action: WebhookAction,
  selectionMap: Map<Id, SelectionItem>,
  variableState: VariableStateMap | undefined,
  setActionStatus: ExecuteActionParams<Id>['setActionStatus']
): Promise<ActionExecutionResult> {
  if (action.batchMode === 'batch') {
    return executeWebhookBatch(action, selectionMap, variableState, setActionStatus);
  } else {
    return executeWebhookIndividual(action, selectionMap, variableState, setActionStatus);
  }
}

/**
 * Execute an event action
 */
async function executeEventAction<Id>(
  action: EventAction,
  selectionMap: Map<Id, SelectionItem>,
  variableState: VariableStateMap | undefined,
  setActionStatus: ExecuteActionParams<Id>['setActionStatus']
): Promise<ActionExecutionResult> {
  if (action.batchMode === 'batch') {
    return executeEventBatch(action, selectionMap, variableState, setActionStatus);
  } else {
    return executeEventIndividual(action, selectionMap, variableState, setActionStatus);
  }
}

/**
 * Execute a selection action (event or webhook)
 *
 * @param params - Execution parameters including action, selections, and callbacks
 * @returns Promise resolving to the execution result
 */
export async function executeAction<Id = unknown>(params: ExecuteActionParams<Id>): Promise<ActionExecutionResult> {
  const { action, selectionMap, variableState, setActionStatus } = params;

  if (selectionMap.size === 0) {
    return { success: true };
  }

  if (action.type === 'event') {
    return executeEventAction(action, selectionMap, variableState, setActionStatus);
  } else if (action.type === 'webhook') {
    return executeWebhookAction(action, selectionMap, variableState, setActionStatus);
  }

  return { success: false, error: new Error(`Unknown action type`) };
}
