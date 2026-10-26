# Next components: authoring guide

This directory contains the next-generation reusable components. This guide documents local authoring conventions; follow the repository [style guide](../../../STYLEGUIDE.md) for general TypeScript, React, accessibility, and testing rules, and the [contributing guide](../../../CONTRIBUTING.md) for contribution requirements.

## Component structure

- Keep a primitive's implementation, stylesheet, tests, and stories together under `primitives/ComponentName/`.
- Use `ps-ComponentName` for the root class and `ps-ComponentName__slot` for named parts, such as `ps-TextField__wrapper` and `ps-TextField__input`.
- Represent sizes and visual states with the component's `data-*` attributes or native pseudo-classes. Preserve semantic HTML and ARIA attributes; styling attributes do not replace accessibility semantics.
- Treat exported props, class names, custom properties intended for consumer overrides, and observable CSS behavior as compatibility-sensitive.

## CSS conventions

### Cascade layers and tokens

Import the shared layer declaration and put component rules in `perses.components`:

```css
@import '@perses-dev/design-tokens/css/layers';

@layer perses.components {
  /* Component rules. */
}
```

The shared [layer declaration](../../../design-tokens/src/css/layers.css) places `perses.utilities` after `perses.components`, so normal utility declarations take precedence over normal component declarations. Layer order is considered before selector specificity; `:where()` controls specificity within a layer.

Use design tokens for colors, spacing, typography, radii, and control sizes. When exposing a component-specific token, provide a shared-token fallback, for example:

```css
--ps-textfield-size: var(--perses-textfield-size-md, var(--perses-control-size-md));
```

### Low-specificity defaults with `:where()`

Wrap the **entire selector** for base styles, base slot styles, and size defaults in `:where()`. Its argument contributes zero specificity, making these defaults easier to customize without escalating selector specificity.

Examples from [TextField](./primitives/TextField/textField.css):

```css
@layer perses.components {
  :where(.ps-TextField__wrapper) {
    display: flex;
    align-items: center;
    min-height: var(--ps-textfield-size);
  }

  :where(textarea.ps-TextField__input) {
    resize: vertical;
  }

  :where(.ps-TextField[data-size='md'] .ps-TextField__wrapper) {
    --ps-textfield-size: var(--perses-textfield-size-md, var(--perses-control-size-md));
    padding: var(--perses-spacing-sm) var(--perses-spacing-md);
  }
}
```

Wrapping only part of a selector leaves the remaining parts' specificity intact. For example, `:where(.ps-TextField[data-size='md']) .ps-TextField__wrapper` still has class specificity; wrapping the full descendant selector makes the whole selector zero-specificity.

### State and variant overrides

Keep selectors for focus, disabled, multiline, and status overrides outside `:where()` when they intentionally need to take precedence over defaults. Do not mechanically wrap every selector: distinguish defaults from overrides.

```css
@layer perses.components {
  .ps-TextField__wrapper:focus-within {
    outline: var(--perses-focus-ring-width) solid var(--perses-focus-ring-color);
    outline-offset: var(--perses-focus-ring-offset);
  }

  .ps-TextField[data-disabled] .ps-TextField__label {
    opacity: 0.5;
  }

  .ps-TextField[data-status='error'] .ps-TextField__helper {
    color: var(--perses-status-text-error);
  }
}
```

When zero-specificity defaults set the same property on the same element in the same layer, later rules win. Put base defaults before size defaults, and keep state overrides easy to identify. Avoid `!important` or increasingly specific selectors as a substitute for the layer and default/override structure.

## Checks when changing styles

- Compare neighboring primitives before introducing a new pattern.
- Check base styles, each supported size, and relevant interactive and validation states.
- Preserve visible focus indicators and accessible disabled/error behavior.
- Keep stories and focused tests aligned with public behavior. CSS-source contract tests, such as
  [`controlSize.test.ts`](./primitives/controlSize.test.ts), may need selector updates when adding `:where()`.
- Run the affected workspace's checks and the repository validation required by the contributor guide.
