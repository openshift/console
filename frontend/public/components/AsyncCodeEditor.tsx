import type { RefAttributes, ForwardRefExoticComponent } from 'react';
import { lazy } from 'react';
import { CodeEditorProps, CodeEditorRef } from '@console/dynamic-plugin-sdk';

export const AsyncCodeEditor: ForwardRefExoticComponent<
  CodeEditorProps & RefAttributes<CodeEditorRef>
> = lazy(() =>
  import('@console/shared/src/components/editor/CodeEditor').then((m) => ({
    default: m.CodeEditor,
  })),
);
