# Perses Components Package

This [package](https://www.npmjs.com/package/@perses-dev/components) includes individual components used in the Perses app and plugins. These components are broken up in a way that allows embedding in separate applications outside of Perses. For more info about corresponding packages see the [general UI README here](https://github.com/perses/perses/blob/main/ui/README.md) and markdown files in each component folder.

## Usage

To import components from the components package use the syntax below:

```typescript
import { ContentWithLegend } from "@perses-dev/components";
```

## Memoization hooks

`useMemoized` and `useDeepMemo` have been removed. Use `useMemo` from React to memoize values and `useCallback` to memoize
callbacks. React compares dependencies by identity with `Object.is`, so callers previously using `useDeepMemo` should
keep object dependencies stable or depend on the primitive values used by the calculation. Memoization is a performance
optimization; code must remain correct if React recalculates a value.
