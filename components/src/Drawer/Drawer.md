# Drawer

Drawer provides supplementary content that are anchored to the left or right edge of the screen.

## Usage

```tsx
<Drawer isOpen={true} onClose={onClose}>
  <div>More info...</div>
</Drawer>
```

## Props

| Name     |                                                   |
|----------|---------------------------------------------------|
| isOpen   | if true, the component is shown                   |
| children | the content of the component                      |
| onClose  | callback fired when component closes              |
| anchor   | [optional] side from which the drawer will appear |

## Closing on click out with unsaved changes

When the drawer contains an editor form, let the form handle the close requests (click out / Escape) through its
`FormEditorHandle`, so that it can ask for confirmation before discarding unsaved changes:

```tsx
const formRef = useRef<FormEditorHandle>(null);

<Drawer isOpen={isOpen} onClose={() => (formRef.current ? formRef.current.requestClose() : onClose())}>
  <MyEditorForm ref={formRef} onClose={onClose} />
</Drawer>
```

The form exposes its cancel logic with `useImperativeHandle(ref, () => ({ requestClose: handleCancel }))`.
