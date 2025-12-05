import * as React from 'react';
import { CodeEditorProps, CodeEditorRef } from '@console/dynamic-plugin-sdk';

export const AsyncCodeEditor: React.ForwardRefExoticComponent<
  CodeEditorProps & React.RefAttributes<CodeEditorRef>
> = React.lazy(() =>
  import('@console/shared/src/components/editor/CodeEditor').then((m) => ({
    default: m.CodeEditor,
  })),
);
