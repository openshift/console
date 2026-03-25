import type { MutableRefObject, FC } from 'react';
import { useCallback } from 'react';
import type { JSONSchema7 } from 'json-schema';
import { Range, Selection } from 'monaco-editor';
import type { CodeEditorRef } from '@console/dynamic-plugin-sdk';
import { ResourceSidebar } from '@console/internal/components/sidebars/resource-sidebar';
import type { K8sKind } from '@console/internal/module/k8s';
import type { Sample } from '@console/shared/src/hooks/useResourceSidebarSamples';
import { downloadYaml } from './yaml-download-utils';

type CodeEditorSidebarProps = {
  editorRef: MutableRefObject<CodeEditorRef>;
  model?: K8sKind;
  samples?: Sample[];
  schema?: JSONSchema7;
  snippets?: Sample[];
  sidebarLabel?: string;
  sanitizeYamlContent?: (id: string, yaml: string, kind: string) => string;
  toggleSidebar: () => void;
};

export const CodeEditorSidebar: FC<CodeEditorSidebarProps> = ({
  editorRef,
  model,
  samples,
  schema,
  snippets,
  sidebarLabel,
  sanitizeYamlContent,
  toggleSidebar,
}) => {
  const editor = editorRef.current?.editor;

  const insertYamlContent = useCallback(
    (id: string = 'default', yamlContent: string = '', kind) => {
      const yaml = sanitizeYamlContent ? sanitizeYamlContent(id, yamlContent, kind) : yamlContent;

      const selection = editor?.getSelection();
      const range = new Range(
        selection.startLineNumber,
        selection.startColumn,
        selection.endLineNumber,
        selection.endColumn,
      );

      // Grab the current position and indent every row to left-align the text at the same indentation
      const indentSize = new Array(selection.startColumn).join(' ');
      const lines = yaml.split('\n');
      const lineCount = lines.length;
      const indentedLines = lines.map((line, i) => {
        if (i === 0) {
          // Already indented, leave it alone
          return line;
        }
        return `${indentSize}${line}`;
      });
      const indentedText = indentedLines.join('\n');

      // Grab the selection size of what we are about to add
      const newContentSelection = new Selection(
        selection.startLineNumber,
        selection.startColumn,
        selection.startLineNumber + lineCount - 1,
        selection.startColumn + indentedLines[indentedLines.length - 1].length,
      );

      const op = { range, text: indentedText, forceMoveMarkers: true };
      editor?.executeEdits(id, [op], [newContentSelection]);
      editor?.focus();
    },
    [editor, sanitizeYamlContent],
  );

  const replaceYamlContent = useCallback(
    (id: string = 'default', yamlContent: string = '', kind: string) => {
      const yaml = sanitizeYamlContent ? sanitizeYamlContent(id, yamlContent, kind) : yamlContent;
      editor?.setValue(yaml);
    },
    [editor, sanitizeYamlContent],
  );

  const downloadYamlContent = useCallback(
    (id: string = 'default', yamlContent: string = '', kind: string) => {
      try {
        const yaml = sanitizeYamlContent ? sanitizeYamlContent(id, yamlContent, kind) : yamlContent;
        downloadYaml(yaml);
      } catch (e) {
        downloadYaml(yamlContent);
      }
    },
    [sanitizeYamlContent],
  );

  return (
    <ResourceSidebar
      kindObj={model}
      samples={samples}
      snippets={snippets}
      schema={schema}
      sidebarLabel={sidebarLabel}
      loadSampleYaml={replaceYamlContent}
      insertSnippetYaml={insertYamlContent}
      downloadSampleYaml={downloadYamlContent}
      toggleSidebar={toggleSidebar}
    />
  );
};
