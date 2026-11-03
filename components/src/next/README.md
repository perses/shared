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

If a nested part also fades (for example a decorative checkbox inside a disabled menu item), mark it `data-decorative` and skip the fade on it so the row is not dimmed twice.

Selected, hovered, and focused must look different from each other:

- **Selected:** show a check mark or other shape, never color alone. A `color` prop tints this indicator, not the whole
  row. In `forced-colors`, use `CanvasText`.
- **Hovered:** use a faint `--perses-status-bg-default` background, and skip it when disabled.
- **Focused (`:focus-visible`):** use `--perses-focus-ring-width` and `--perses-focus-ring-offset` with
  `--perses-focus-ring-color`. In `forced-colors`, use `Highlight`.

```css
:where(.ps-Example:focus-visible) {
  outline: var(--perses-focus-ring-width) solid var(--perses-focus-ring-color);
  outline-offset: var(--perses-focus-ring-offset);
}
```

When the element sits in a scrolling or clipping container, such as a menu popup, use a negative outline offset so the
ring stays inside the element and is not clipped.

When zero-specificity defaults set the same property on the same element in the same layer, later rules win. Put base defaults before size defaults, and keep state overrides easy to identify. Avoid `!important` or increasingly specific selectors as a substitute for the layer and default/override structure.

### Portaled components

Popups rendered in a portal (Menu, Tooltip) live outside the `ThemeModeProvider` wrapper and lose its tokens. Read `ThemeModeContext` and set `data-perses-mode` on the portaled element, as [Menu](./primitives/Menu/Menu.tsx) does. Use `data-perses-mode` only for colors and tokens, never for layout: it can land on any portaled element, so a layout rule keyed on it (such as `min-height: 100vh`) will resize popups.

### Self-contained sizing

The document reset in `@perses-dev/design-tokens/css/reset` is opt-in, so component CSS must not rely on it. A
component that depends on the reset renders one way in a host that loads it and another way in a host that does not.
Each component therefore sets the browser defaults it needs in its own base rule: `box-sizing: border-box` on elements
whose size it constrains, and `margin: 0` on elements that can render as a tag with a user-agent margin. For example:

```css
@layer perses.components {
  /* :where() keeps specificity at zero, so style props and consumer CSS still win. */
  :where(.ps-CardContent) {
    /* Declared sizes include padding and border, with or without the document reset. */
    box-sizing: border-box;
    /* Clears the user-agent margin when rendered as <figure>, <p> or a heading. */
    margin: 0;
  }
}
```

## Variant names

Reuse the shared vocabulary before adding a variant: `solid`, `outline`, `ghost`, `subtle`, `elevated`. Use the
adjective form without `-ed` (`outline`, not `outlined`). Default to the most neutral variant. Variant names are public
API; renaming one after release is a breaking change.

## Content elements

When a component offers optional content before or after its main content, name the `ReactNode` props `startElement` and
`endElement`. Use logical start/end rather than physical left/right, and the `Element` suffix rather than `Adornment`.
These props provide content; `slotProps` only customizes styling.

## Spacing

Spacing-enabled primitives accept these padding and margin shorthands:

| Property | All sides | Inline axis | Block axis | Physical sides |
|----------|-----------|-------------|------------|----------------|
| Padding | `p` | `px` | `py` | `pt`, `pr`, `pb`, `pl` |
| Margin | `m` | `mx` | `my` | `mt`, `mr`, `mb`, `ml` |

Values can be spacing tokens (`"sm"`), numeric pixels (`12`), CSS lengths or expressions (`"1rem"`, `"5%"`,
`"var(--app-space)"`), or responsive objects (`{ default: 'sm', md: 0 }`). Margins also allow negative values and
`"auto"`. Side props take single-side values; multi-value strings belong on all-sides or axis props.

Axes are logical; `t`/`r`/`b`/`l` always mean physical top/right/bottom/left, unaffected by RTL or writing mode.
Precedence is **component defaults → all sides → axes → individual sides → normal inline `style`**, regardless of JSX
prop order. Unspecified sides retain existing values, and side overrides persist across later changes to broader props:

```tsx
<Box p={{ default: 'sm', xl: 'xl' }} pb={{ md: 0 }} m="md" ml="auto" mt={-8} />
```

Here, bottom padding stays zero from `md` onward, including at `xl`. Props target the same element as existing spacing
props; use `slotProps` styles for internal parts, such as a TextField input. Use `style` for full CSS property names
such as `marginTop`.

### Responsive values in JS

Responsive objects are resolved by the CSS cascade, so React never needs to know the viewport. The exception is a prop
that changes **behaviour**, not just appearance: `Tabs orientation` must reach Base UI as a plain string so arrow-key
handling and `data-orientation` agree. For those, resolve the object with `useResponsiveValue` from `primitives/system`:

```tsx
const orientation = useResponsiveValue(orientationProp); // { default: 'horizontal', md: 'vertical' } → 'vertical' at ≥ 900px
```

It applies the same mobile-first rule as the engine (largest matching breakpoint with a value wins, else `default`),
subscribes to `matchMedia` only when given an object, and falls back to `default` without `window.matchMedia`
(server rendering, jsdom). The breakpoint widths come from `system/breakpoints.ts`; `breakpoints.test.ts` keeps them
equal to the `@media` rules in the engine CSS. Do not use the hook for visual props; add a registry entry instead.

### Axis and side variants

A prop that sets both axes or all sides must also offer the narrower forms, named the same way as the engine:
`spacing` → `rowSpacing`/`columnSpacing`, `p` → `px`/`py` → `pt`/`pr`/`pb`/`pl`, `rounded` → `roundedTop…` →
`roundedTopLeft…`. The narrower prop overrides the broader one from its first provided breakpoint onward. Implement
them by aliasing an existing transform in the component's registry rather than writing new conversion code:

```ts
const GRID_STYLE_PROPS = compileStyleProps([spacingProps, { rowGap: spacingProps.gap, columnGap: spacingProps.gap }]);
```

## Border radius

Use `rounded` for all corners, `roundedTop`/`roundedRight`/`roundedBottom`/`roundedLeft` for sides, and
`roundedTopLeft`/`roundedTopRight`/`roundedBottomLeft`/`roundedBottomRight` for individual corners. Directions remain
physical in RTL and other writing modes.

Values accept radius tokens (`none`, `sm`, `md`, `lg`, `xl`, `full`), non-negative pixel numbers, CSS lengths,
percentages or expressions, and responsive objects. Full `border-radius` shorthands, including slash syntax, belong on
`rounded`; side and corner props accept one or two lengths describing a single corner.

Precedence is **defaults → rounded → top/bottom → left/right → corners → inline styles on the same element**, independent
of JSX order. Unspecified corners keep their defaults; narrower overrides persist across later breakpoints:

```tsx
<Box rounded={{ default: 'sm', xl: 'xl' }} roundedBottomRight={{ md: 0 }} />
```

Bottom-right stays square from `md` onward, including at `xl`. Rounding does not change overflow or clipping. Use inline
styles for CSS-wide keywords such as `inherit` or `revert-layer`.

See the Box Radius story for examples. Public types: `RadiusProps`, `RadiusValue`, and `CornerRadiusValue` from
`@perses-dev/components/next/primitives`.

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
- Re-read story prose and JSDoc after behavior changes so defaults and descriptions stay accurate.
- Run the affected workspace's checks and the repository validation required by the contributor guide.

### Visual pass in Ladle before requesting review

- Portaled popups open beside their trigger, in both dark and light mode.
- Popup and page backgrounds are distinguishable in light mode. If you change a shared overlay token, check every component that uses it (Menu, Tooltip).
- Selected, hovered, and focused states are distinct, including in `forced-colors` mode.
- Density: padding applies on all four sides, and `sm` is the default size.
- Disabled content fades once, not twice.
- Compare before and after: run Ladle on the parent commit and on your branch (a `git worktree` on a second port works), and attach both screenshots to the PR.
