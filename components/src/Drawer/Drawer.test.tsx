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

import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactElement } from 'react';

import { Drawer } from './Drawer';
import { useDrawerCloseHandler } from './drawer-close-handler';

function CloseHandler({ handler }: { handler: () => void }): ReactElement {
  useDrawerCloseHandler(handler);
  return <div>content</div>;
}

function pressEscape(): void {
  fireEvent.keyDown(screen.getByText('content'), { key: 'Escape' });
}

function clickOut(): void {
  const backdrop = document.querySelector('.MuiBackdrop-root');
  if (!backdrop) throw new Error('backdrop not found');
  fireEvent.click(backdrop);
}

describe('Drawer', () => {
  it('should call onClose on click out and Escape when no close handler is registered', () => {
    const onClose = vi.fn();
    render(
      <Drawer isOpen={true} onClose={onClose}>
        <div>content</div>
      </Drawer>,
    );
    clickOut();
    pressEscape();
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it('should call the registered close handler instead of onClose', () => {
    const onClose = vi.fn();
    const handler = vi.fn();
    render(
      <Drawer isOpen={true} onClose={onClose}>
        <CloseHandler handler={handler} />
      </Drawer>,
    );
    clickOut();
    pressEscape();
    expect(handler).toHaveBeenCalledTimes(2);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should use the latest version of the registered handler', () => {
    const onClose = vi.fn();
    const firstHandler = vi.fn();
    const secondHandler = vi.fn();
    const { rerender } = render(
      <Drawer isOpen={true} onClose={onClose}>
        <CloseHandler handler={firstHandler} />
      </Drawer>,
    );
    rerender(
      <Drawer isOpen={true} onClose={onClose}>
        <CloseHandler handler={secondHandler} />
      </Drawer>,
    );
    clickOut();
    expect(firstHandler).not.toHaveBeenCalled();
    expect(secondHandler).toHaveBeenCalledTimes(1);
  });

  it('should use the most recently registered handler, and fall back once it is unregistered', () => {
    const onClose = vi.fn();
    const outerHandler = vi.fn();
    const innerHandler = vi.fn();
    const { rerender } = render(
      <Drawer isOpen={true} onClose={onClose}>
        <CloseHandler handler={outerHandler} />
      </Drawer>,
    );
    rerender(
      <Drawer isOpen={true} onClose={onClose}>
        <CloseHandler handler={outerHandler} />
        <CloseHandler handler={innerHandler} />
      </Drawer>,
    );
    clickOut();
    expect(innerHandler).toHaveBeenCalledTimes(1);
    expect(outerHandler).not.toHaveBeenCalled();

    rerender(
      <Drawer isOpen={true} onClose={onClose}>
        <CloseHandler handler={outerHandler} />
      </Drawer>,
    );
    clickOut();
    expect(innerHandler).toHaveBeenCalledTimes(1);
    expect(outerHandler).toHaveBeenCalledTimes(1);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('should do nothing when used outside of a Drawer', () => {
    const handler = vi.fn();
    expect(() => render(<CloseHandler handler={handler} />)).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });
});
