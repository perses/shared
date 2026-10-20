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

import type { DrawerProps as MuiDrawerProps } from '@mui/material';
import { Drawer as MuiDrawer, useMediaQuery } from '@mui/material';
import type { ReactElement } from 'react';
import { useCallback, useMemo, useRef } from 'react';

import { combineSx } from '../utils';
import type { DrawerCloseHandler, DrawerCloseHandlerContextValue } from './drawer-close-handler';
import { DrawerCloseHandlerContext } from './drawer-close-handler';

export interface DrawerProps extends MuiDrawerProps {
  isOpen: boolean;
  /**
   * Callback fired when the user clicks outside the drawer or presses Escape.
   * Not called if a child registered a handler with `useDrawerCloseHandler`: that handler is called instead.
   */
  onClose: () => void;
  anchor?: 'left' | 'right';
}

const DRAWER_DEFAULT_WIDTH = 1080;

export const Drawer = ({
  anchor = 'right',
  isOpen,
  onClose,
  PaperProps,
  children,
  ...rest
}: DrawerProps): ReactElement => {
  const isSmaller = useMediaQuery(`(max-width:${DRAWER_DEFAULT_WIDTH}px)`);

  const closeHandlersRef = useRef<DrawerCloseHandler[]>([]);
  const closeHandlerContext = useMemo<DrawerCloseHandlerContextValue>(
    () => ({
      registerCloseHandler: (handler) => {
        closeHandlersRef.current.push(handler);
        return (): void => {
          closeHandlersRef.current = closeHandlersRef.current.filter((h) => h !== handler);
        };
      },
    }),
    [],
  );

  const handleClose = useCallback((): void => {
    const closeHandler = closeHandlersRef.current.at(-1);
    if (closeHandler) {
      closeHandler();
    } else {
      onClose();
    }
  }, [onClose]);

  return (
    <MuiDrawer
      {...rest}
      open={isOpen}
      onClose={handleClose}
      anchor={anchor}
      PaperProps={{
        ...PaperProps,
        sx: combineSx(
          {
            width: isSmaller ? '100%' : `${DRAWER_DEFAULT_WIDTH}px`,
            overflow: 'hidden',
          },
          PaperProps?.sx,
        ),
      }}
      aria-hidden={!isOpen} // Ensure the drawer is not focusable when closed + disable console.error about focusable elements
    >
      <DrawerCloseHandlerContext.Provider value={closeHandlerContext}>{children}</DrawerCloseHandlerContext.Provider>
    </MuiDrawer>
  );
};
