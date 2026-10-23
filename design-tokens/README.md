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
