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

import type { Metadata, ProjectMetadata } from './resource';

/**
 * Name of a `User` subject referring to every user known by Perses, including the users created after the role binding
 * (for example, at their first login through an OAuth/OIDC provider).
 */
export const WILDCARD_USER = '*';

export interface Subject {
  kind: 'User';
  // name of the user (metadata.name), or WILDCARD_USER to refer to every user
  name: string;
}

export interface RoleBindingSpec {
  // name of the role or global role (metadata.name)
  role: string;
  subjects: Subject[];
}

/**
 * A role binding that belongs to a project.
 */
export interface RoleBindingResource {
  kind: 'RoleBinding';
  metadata: ProjectMetadata;
  spec: RoleBindingSpec;
}

/**
 * A global role binding that doesn´t belong to a project.
 */
export interface GlobalRoleBindingResource {
  kind: 'GlobalRoleBinding';
  metadata: Metadata;
  spec: RoleBindingSpec;
}

export type RoleBinding = RoleBindingResource | GlobalRoleBindingResource;
