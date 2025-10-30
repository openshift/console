# OLMv1 Package

This package provides components and utilities for OLMv1 (Operator Lifecycle Manager v1) catalog functionality.

## Feature Flag

The package exports a `FLAG_OLMV1_ENABLED` feature flag that mirrors the user's OLMv1 toggle switch setting.

### Usage Example

```typescript
import { useFlag } from '@console/shared/src/hooks/flag';
import { FLAG_OLMV1_ENABLED } from '@console/operator-lifecycle-manager-v1/src/const';

const MyComponent = () => {
  const olmv1Enabled = useFlag(FLAG_OLMV1_ENABLED);

  return (
    <div>
      {olmv1Enabled && <OLMv1SpecificFeature />}
    </div>
  );
};
```

### In Console Extensions

You can also use the flag in `console-extensions.json`:

```json
{
  "type": "console.some-extension-type",
  "properties": {
    ...
  },
  "flags": {
    "required": ["OLMV1_ENABLED"]
  }
}
```

This flag is automatically synchronized with the user setting `console.olmv1.enabled` which can be controlled through:

1. **User Preferences**: Navigate to User Preferences → Operators → Enable OLMv1 catalog
2. **Catalog Toolbar Toggle**: Use the toggle switch in the Developer Catalog when viewing operators

Both controls are synchronized and modify the same user setting, ensuring a consistent experience across the console.
