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

import { createContext, ReactElement, ReactNode, useContext, useState } from 'react';
import {
  PanelEditorValues,
  VariableDefinition,
  PluginSchema,
  panelEditorSchema as defaultPanelEditorSchema,
  variableDefinitionSchema,
  buildPanelEditorSchema,
  buildVariableDefinitionSchema,
} from '@perses-dev/spec';
import { DatasourceDefinition, datasourceDefinitionSchema, buildDatasourceDefinitionSchema } from '@perses-dev/core'; // Todo these things should not be part of the plugin system. Only the spec should be used
import { z } from 'zod';

export interface ValidationSchemas {
  datasourceEditorSchema: z.Schema<DatasourceDefinition>;
  panelEditorSchema: z.Schema<PanelEditorValues>;
  variableEditorSchema: z.Schema<VariableDefinition>;
  setDatasourceEditorSchemaPlugin: (pluginSchema: PluginSchema) => void;
  setPanelEditorSchemaPlugin: (pluginSchema: PluginSchema) => void;
  setVariableEditorSchemaPlugin: (pluginSchema: PluginSchema) => void;
}

export const ValidationSchemasContext = createContext<ValidationSchemas | undefined>(undefined);

export function useValidationSchemas(): ValidationSchemas {
  const ctx = useContext(ValidationSchemasContext);
  if (ctx === undefined) {
    throw new Error('No ValidationSchemasContext found. Did you forget a Provider?');
  }
  return ctx;
}

interface ValidationProviderProps {
  children: ReactNode;
}

/*
 * Provide validation schemas for forms handling plugins (datasources, variables, panels).
 */
export function ValidationProvider({ children }: ValidationProviderProps): ReactElement {
  const [datasourceEditorSchema, setDatasourceEditorSchema] =
    useState<z.Schema<DatasourceDefinition>>(datasourceDefinitionSchema);
  const [panelEditorSchema, setPanelEditorSchema] = useState<z.Schema<PanelEditorValues>>(defaultPanelEditorSchema); // TODO I don't get why this does not compile
  const [variableEditorSchema, setVariableEditorSchema] =
    useState<z.Schema<VariableDefinition>>(variableDefinitionSchema);

  function setDatasourceEditorSchemaPlugin(pluginSchema: PluginSchema): void {
    setDatasourceEditorSchema(buildDatasourceDefinitionSchema(pluginSchema));
  }

  function setPanelEditorSchemaPlugin(pluginSchema: PluginSchema): void {
    setPanelEditorSchema(buildPanelEditorSchema(pluginSchema));
  }

  function setVariableEditorSchemaPlugin(pluginSchema: PluginSchema): void {
    setVariableEditorSchema(buildVariableDefinitionSchema(pluginSchema));
  }

  return (
    <ValidationSchemasContext.Provider
      value={{
        datasourceEditorSchema,
        panelEditorSchema,
        variableEditorSchema,
        setDatasourceEditorSchemaPlugin,
        setPanelEditorSchemaPlugin,
        setVariableEditorSchemaPlugin,
      }}
    >
      {children}
    </ValidationSchemasContext.Provider>
  );
}
