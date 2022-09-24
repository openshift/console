import * as React from 'react';
import { YAMLEditorProps, YAMLEditorRef } from '@console/dynamic-plugin-sdk';

export const AsyncYAMLEditor: React.RefForwardingComponent<
  React.RefAttributes<YAMLEditorRef>,
  YAMLEditorProps
> = React.lazy(() =>
  import('@console/shared/src/components/editor/YAMLEditor').then((m) => ({
    default: m.default,
  })),
);
