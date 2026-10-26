# Perses Components Package

This [package](https://www.npmjs.com/package/@perses-dev/components) includes individual components used in the Perses app and plugins. These components are broken up in a way that allows embedding in separate applications outside of Perses. For more info about corresponding packages see the [general UI README here](https://github.com/perses/perses/blob/main/ui/README.md) and markdown files in each component folder.

## Usage

To import components from the components package use the syntax below:

```typescript
import { ContentWithLegend } from "@perses-dev/components";
```

## Next-generation text primitives

`Text` and `TextHelper` are available from `@perses-dev/components/next/primitives`:

```tsx
import { Text, TextHelper, TextField } from '@perses-dev/components/next/primitives';

<Text as="p" size="sm" weight="medium" color="secondary">
  Dashboard settings
</Text>

<div>
  <button aria-describedby="publish-help">Publish</button>
  <TextHelper id="publish-help">
    Publishing makes this dashboard visible to your team.
  </TextHelper>
</div>

<TextField label="Name" helperText="Shown to the other members of your team." />
```

- `Text` defaults to a `span`, the `md` font-size token, and the `primary` text color, with no margins. Use `as` to
  render `p`, `div`, `strong`, `em`, or `small`; `size` and `weight` select design tokens independently of the HTML
  element. `color` accepts semantic names (`primary`, `secondary`, `disabled`, and the status names) or any CSS color
  value, such as `#663399`, `rebeccapurple`, `rgb(100 50 200 / 80%)`, `var(--custom-color)`, or `currentColor`.
  Named design-system colors keep their token mappings; other colors pass through as CSS, and an explicit
  `style.color` takes precedence. Omitted `weight` preserves the element's normal weight. It supports the same
  spacing, sizing, and display props as `Box` and forwards a ref to the rendered element.
- `TextHelper` renders a paragraph using `xs` secondary text. Its optional `status` selects an `error`, `warning`,
  `success`, or `info` text color. Set `disabled` to use the disabled text color instead; this takes precedence over
  status colors without disabling the associated control. `TextField` forwards the effective disabled state,
  including disabled state inherited from a Base UI fieldset. The helper wraps long content, including unbroken
  strings, without increasing its parent's intrinsic width; the parent or sibling control must establish the
  available width. This width containment is not applied to ordinary `Text`.
- Standalone helpers need an `id` referenced by the control's `aria-describedby`. `TextField` retains its existing
  `helperText` API and uses Base UI's `Field.Description` to associate the helper automatically. A helper's `status`
  does not add live-region announcements or set a control's `aria-invalid`.

Both primitives are included in `defaultComponents`. Complete custom `PersesComponents` maps must also supply `Text`
(and its forwarded `HTMLElement` ref) and `TextHelper` (with an `HTMLParagraphElement` ref); maps that spread
`defaultComponents` pick them up automatically.
