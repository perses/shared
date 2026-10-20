# Drawer

Drawer provides supplementary content that are anchored to the left or right edge of the screen.

## Usage

```tsx
<Drawer isOpen={true} onClose={onClose}>
  <div>More info...</div>
</Drawer>
```

## Props

| Name     |                                                                                               |
|----------|-----------------------------------------------------------------------------------------------|
| isOpen   | if true, the component is shown                                                               |
| children | the content of the component                                                                  |
| onClose  | callback fired when the user clicks outside the drawer or presses Escape                      |
| anchor   | [optional] side from which the drawer will appear                                             |

## Intercepting close requests

Content rendered inside the drawer (typically a form) can intercept the close requests triggered by clicking outside
of the drawer or pressing Escape, using the `useDrawerCloseHandler` hook. When a handler is registered, it is called
instead of `onClose`, and it is responsible for closing the drawer, e.g. after asking the user to confirm discarding
unsaved changes. If several handlers are registered, the most recently registered one is used.

```tsx
function MyForm({ onClose }: { onClose: () => void }) {
  const [isDiscardDialogOpened, setDiscardDialogOpened] = useState(false);

  const handleCancel = (): void => {
    if (hasUnsavedChanges) {
      setDiscardDialogOpened(true);
    } else {
      onClose();
    }
  };

  useDrawerCloseHandler(handleCancel);

  // ...
}

<Drawer isOpen={isOpen} onClose={onClose}>
  <MyForm onClose={onClose} />
</Drawer>
```
