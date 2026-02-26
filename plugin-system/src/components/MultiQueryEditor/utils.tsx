import { QueryDefinition } from '@perses-dev/core';

export function defaultQueryName(index: number): string {
  return `Query #${index + 1}`;
}

export function getQueryName(definitions: QueryDefinition[], query: QueryDefinition): string {
  if (query.spec.name) {
    return query.spec.name;
  }
  const index = definitions.findIndex((definition) => definition === query);
  return defaultQueryName(index);
}

export function generateQueryNames(definitions: QueryDefinition[]): string[] {
  return definitions.map((queryDef: QueryDefinition, index: number) => queryDef.spec.name ?? defaultQueryName(index));
}
