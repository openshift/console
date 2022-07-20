import * as React from 'react';
import { YAMLEditorProps } from '@console/dynamic-plugin-sdk';

export const AsyncYAMLEditor: React.FC<YAMLEditorProps> = React.lazy(() =>
  import('@console/shared/src/components/editor/YAMLEditor').then((m) => ({
    default: m.default,
  })),
);
