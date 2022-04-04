import * as React from 'react';
import { ResourceYAMLEditorProps } from '@console/dynamic-plugin-sdk';

export const AsyncResourceYAMLEditor: React.FC<ResourceYAMLEditorProps> = React.lazy(() =>
  import('@console/internal/components/droppable-edit-yaml').then((m) => ({
    default: m.ResourceYAMLEditor,
  })),
);
