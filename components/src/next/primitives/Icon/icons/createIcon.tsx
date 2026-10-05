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

import { forwardRef } from 'react';
import type { ForwardRefExoticComponent, RefAttributes, SVGProps } from 'react';

export type IconComponent = ForwardRefExoticComponent<SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>>;

export function createIcon(name: string, width: number, height: number, paths: string[]): IconComponent {
  const iconPaths = paths.map((path, index) => ({ key: `${name}-${index}`, path }));

  const Component = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(function FontAwesomeIcon(props, ref) {
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox={['0 0', width, height].join(' ')}
        width="1em"
        height="1em"
        fill="currentColor"
        focusable="false"
        {...props}
      >
        {iconPaths.map(({ key, path }) => (
          <path key={key} d={path} />
        ))}
      </svg>
    );
  });
  Component.displayName = name;
  return Component;
}
