# Next components: authoring guide

This directory contains the next-generation reusable components. This guide documents local authoring conventions; follow the repository [style guide](../../../STYLEGUIDE.md) for general TypeScript, React, accessibility, and testing rules, and the [contributing guide](../../../CONTRIBUTING.md) for contribution requirements.

## Component structure

- Keep a primitive's implementation, stylesheet, tests, and stories together under `primitives/ComponentName/`.
- Use `ps-ComponentName` for the root class and `ps-ComponentName__slot` for named parts, such as `ps-TextField__wrapper` and `ps-TextField__input`.
- Represent sizes and visual states with the component's `data-*` attributes or native pseudo-classes. Preserve semantic HTML and ARIA attributes; styling attributes do not replace accessibility semantics.
- Treat exported props, class names, custom properties intended for consumer overrides, and observable CSS behavior as compatibility-sensitive.

### Adding and registering a component

Consumers swap primitives through `ComponentsProvider`, so a component is only usable once it is registered. For a new `ComponentName`:

- Create `primitives/ComponentName/` with the implementation, stylesheet, tests, stories, and an `index.ts` barrel.
- Export the barrel from [`primitives/index.ts`](./primitives/index.ts) and add the component and its prop types to [`exports.test.tsx`](./primitives/exports.test.tsx).
- Add the component to the `PersesComponents` interface in [`contexts/ComponentsContext.ts`](./contexts/ComponentsContext.ts) and to `defaultComponents` in [`primitives/defaults.ts`](./primitives/defaults.ts). Every entry is required, so a missing default is a type error.

Registering the component in `PersesComponents` enables the compile-time check in [`types.test.tsx`](./types.test.tsx), which verifies that its `style` prop accepts custom properties. Stylesheets under `primitives/` are discovered automatically by [`css/layers.test.ts`](./css/layers.test.ts).

### Inline `style` and custom properties

React's `CSSProperties` does not accept CSS custom properties, so consumers would otherwise have to cast every `--perses-*` or application variable they pass through `style`. Type the `style` prop with `PersesCSSProperties` from `../types` (also exported publicly) instead of relying on the `HTMLAttributes` default:

```ts
export interface BoxProps extends HTMLAttributes<HTMLDivElement> {
  style?: PersesCSSProperties;
}
```

When a component documents its own override variables, declare them in a `ComponentNameStyle` interface that extends `CSSProperties` and wrap it so consumers keep those typed keys while still being able to add other custom properties:

```ts
export interface CheckboxStyle extends CSSProperties {
  '--perses-checkbox-size-md'?: string;
}

style?: PersesCSSProperties<CheckboxStyle>;
```

React appends `px` to numeric values of standard properties such as `marginTop: 8`, but not to custom properties: `'--app-size': 8` is emitted as a bare `8`. Include the unit yourself, for example `'--app-size': '8px'`.

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

  .ps-TextField[data-disabled] {
    opacity: var(--perses-opacity-disabled, 0.5);
  }

  .ps-TextField[data-status='error'] .ps-TextField__helper {
    color: var(--perses-status-text-error);
  }
}
```

Apply `--perses-opacity-disabled` (default `0.5`) once at the disabled group's root, preserving status and custom colors without dimming labels or helpers again. Checkbox and Switch dim their label wrapper based on the control's effective Base UI disabled state, including inheritance; unlabeled controls dim themselves.

When zero-specificity defaults set the same property on the same element in the same layer, later rules win. Put base defaults before size defaults, and keep state overrides easy to identify. Avoid `!important` or increasingly specific selectors as a substitute for the layer and default/override structure.

## Slots

Components may expose `slotProps` to style named internal parts. Each slot accepts `SlotStyleProps` from
`@perses-dev/components/next`: `className` and `style`, including CSS custom properties. Slots customize appearance,
not structure or behavior. See each component's Slots story for available targets and examples.

- Expose intentional, stable slot names as public API, not Base UI internals.
- Preserve existing top-level prop destinations; avoid duplicating root styling in a slot.
- Read styling fields explicitly. Never spread slot objects or forward unsupported keys, even when types are bypassed.
- Append consumer classes to required classes. Merge inline styles by property, allowing visual overrides while
  preserving functional styles. Keep behavior-critical parts private unless their styling policy is documented.
- Styling does not render optional parts. Consumer overrides must preserve usable layout, visible focus, and accessibility.
- If a slot is the element that
uses the component's own custom properties, type it as `SlotStyleProps<ComponentNameStyle>` (for example
`control?: SlotStyleProps<CheckboxStyle>`) so those values are type-checked the same way as the top-level `style`. 

## Checks when changing styles

- Compare neighboring primitives before introducing a new pattern.
- Check base styles, each supported size, and relevant interactive and validation states.
- Preserve visible focus indicators and accessible disabled/error behavior.
- Keep stories and focused tests aligned with public behavior. CSS-source contract tests, such as
  [`controlSize.test.ts`](./primitives/controlSize.test.ts), may need selector updates when adding `:where()`.
- Run the affected workspace's checks and the repository validation required by the contributor guide.
