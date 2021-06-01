import * as React from 'react';
import { JSONSchema7 } from 'json-schema';
import MonacoEditor from 'react-monaco-editor';
import { ResourceSidebar } from '@console/internal/components/sidebars/resource-sidebar';
import { K8sKind } from '@console/internal/module/k8s';
import { Sample } from '../../utils';
import { downloadYaml } from './yaml-download-utils';

type YAMLEditorSidebarProps = {
  editorRef: React.MutableRefObject<MonacoEditor>;
  model?: K8sKind;
  samples?: Sample[];
  schema?: JSONSchema7;
  snippets?: Sample[];
  sidebarLabel?: string;
  sanitizeYamlContent?: (id: string, yaml: string, kind: string) => string;
  toggleSidebar: () => void;
};

const YAMLEditorSidebar: React.FC<YAMLEditorSidebarProps> = ({
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

  const insertYamlContent = React.useCallback(
    (id, yamlContent, kind) => {
      const yaml = sanitizeYamlContent ? sanitizeYamlContent(id, yamlContent, kind) : yamlContent;

      const selection = editor.getSelection();
      const range = new window.monaco.Range(
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
      const newContentSelection = new window.monaco.Selection(
        selection.startLineNumber,
        selection.startColumn,
        selection.startLineNumber + lineCount - 1,
        selection.startColumn + indentedLines[indentedLines.length - 1].length,
      );

      const op = { range, text: indentedText, forceMoveMarkers: true };
      editor.executeEdits(id, [op], [newContentSelection]);
      editor.focus();
    },
    [editor, sanitizeYamlContent],
  );

  const replaceYamlContent = React.useCallback(
    (id, yamlContent, kind) => {
      const yaml = sanitizeYamlContent ? sanitizeYamlContent(id, yamlContent, kind) : yamlContent;
      editor.setValue(yaml);
    },
    [editor, sanitizeYamlContent],
  );

  const downloadYamlContent = React.useCallback(
    (id = 'default', yamlContent = '', kind) => {
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

export default YAMLEditorSidebar;
