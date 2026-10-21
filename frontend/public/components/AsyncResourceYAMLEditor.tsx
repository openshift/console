import type { FC } from 'react';
import { lazy } from 'react';
import { ResourceYAMLEditorProps } from '@console/dynamic-plugin-sdk';

export const AsyncResourceYAMLEditor: FC<ResourceYAMLEditorProps> = lazy(() =>
  import('@console/internal/components/droppable-edit-yaml').then((m) => ({
    default: m.ResourceYAMLEditor,
  })),
);
