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

import { Button as BaseButton } from '@base-ui/react/button';

type ButtonVariant = 'solid' | 'outline' | 'ghost';
type ButtonColor = 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'info';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ComponentPropsWithoutRef<'button'> {
  variant?: ButtonVariant;
  color?: ButtonColor;
  size?: ButtonSize;
}

export function Button({
  variant = 'solid',
  color = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonProps): JSX.Element {
  return (
    <BaseButton
      className={`ps-Button ${className ?? ''}`.trim()}
      data-variant={variant}
      data-color={color}
      data-size={size}
      {...props}
    />
  );
}
