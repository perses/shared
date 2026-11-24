# Perses Design Tokens

`@perses-dev/design-tokens` provides primitive and semantic design tokens as TypeScript values and CSS custom properties.

## CSS entry points

Import tokens and semantic styles independently, without a document reset:

```ts
import '@perses-dev/design-tokens/css/tokens';
import '@perses-dev/design-tokens/css/semantic';
```

The reset is opt-in:

```ts
import '@perses-dev/design-tokens/css/reset';
```

The aggregate `@perses-dev/design-tokens/css` imports reset, tokens, and semantic styles. Each CSS entry automatically
initializes the same complete layer order before its own declarations:

```css
@layer perses.reset, perses.tokens, perses.semantic, perses.components, perses.utilities;
```

`@perses-dev/design-tokens/css/layers` is the public, order-only prelude. It contains no reset, selectors, or token values.
Components use this export internally; consumers do not need a bootstrap import to initialize library order.

## Border radius

`tokens.radius.<step>` references `--perses-radius-<step>`, independently of spacing and control sizes.

| Step | `none` | `sm` | `md` | `lg` | `xl` | `full` |
|------|--------|------|------|------|------|--------|
| Default | `0` | `2px` | `4px` | `8px` | `12px` | `9999px` |

Override these variables globally or in a scoped container. Exported types: `RadiusScale` and `RadiusVar` (included in
`PersesTokenVar`).

## Disabled opacity

`tokens.opacity.disabled` references `var(--perses-opacity-disabled)`, which defaults to `0.5` in both light and dark modes.
Use it for disabled-state opacity without replacing status or custom colors. Override the semantic token globally or in a
scoped container:

```css
:root {
  --perses-opacity-disabled: 0.6;
}
```

The variable is included in the public `SemanticOpacityVar` and `PersesTokenVar` types. The existing
`--perses-text-disabled` and `tokens.text.disabled` color tokens remain available for consumers that need them.
