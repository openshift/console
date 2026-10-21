import { Range } from 'monaco-editor';
import type * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import type { SchemasSettings } from 'monaco-yaml';
import { configureMonacoYaml } from 'monaco-yaml';
import * as yaml from 'yaml-ast-parser';
import { openAPItoJSONSchema } from '@console/internal/module/k8s/openapi-to-json-schema';
import { getSwaggerDefinitions } from '@console/internal/module/k8s/swagger';

export const defaultEditorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  scrollBeyondLastLine: false,
  tabSize: 2,
};

const findManagedMetadata = (model: monaco.editor.ITextModel) => {
  const modelValue = model.getValue();
  const doc = yaml.safeLoad(modelValue);
  const rootMappings = doc?.mappings || [];
  for (const rootElement of rootMappings) {
    const rootKey = rootElement.key;
    const rootValue = rootElement.value;

    // Search for metadata
    if (rootKey.value === 'metadata') {
      const metadataMappings = rootValue.mappings || [];
      for (const metadataChildren of metadataMappings) {
        const childKey = metadataChildren.key;

        // Search for managedFields
        if (childKey.value === 'managedFields') {
          const startLine = model.getPositionAt(metadataChildren.startPosition).lineNumber;
          const endLine = model.getPositionAt(metadataChildren.endPosition).lineNumber;
          return {
            start: startLine,
            end: endLine,
          };
        }
      }
    }
  }
  return {
    start: -1,
    end: -1,
  };
};

export const fold = (
  editor: monaco.editor.IStandaloneCodeEditor,
  model: monaco.editor.ITextModel,
  resetMouseLocation: boolean,
): void => {
  const managedLocation = findManagedMetadata(model);
  const { start } = managedLocation;
  const { end } = managedLocation;

  if (start >= 0 && end >= 0) {
    const top = editor.getScrollTop();
    editor.setSelection(new Range(start, 0, end, 0));
    editor
      .getAction('editor.fold')
      .run()
      .then(() => {
        if (resetMouseLocation) {
          editor.setSelection(new Range(0, 0, 0, 0));
        }
        editor.setScrollTop(Math.abs(top));
      })
      .catch(() => {});
  }
};

/**
 * Register automatic for managedFields folding in the editor
 */
export const registerAutoFold = (
  editor: monaco.editor.IStandaloneCodeEditor,
  alreadyInUse: boolean = false,
) => {
  let initialFoldingTriggered = false;
  const model = editor.getModel();
  const tryFolding = () => {
    const document = model.getValue();
    if (!initialFoldingTriggered && document !== '') {
      setTimeout(() => fold(editor, model, true));
      initialFoldingTriggered = true;
    }
  };
  if (alreadyInUse) {
    tryFolding();
  }

  model.onDidChangeContent(() => {
    tryFolding();
  });
};

export const getConsoleYamlSchemas = (): SchemasSettings[] => {
  // Prepare the schema
  const yamlOpenAPI = getSwaggerDefinitions();

  // Convert the openAPI schema to something the language server understands
  const kubernetesJSONSchema = openAPItoJSONSchema(yamlOpenAPI);

  return [
    {
      uri: 'inmemory:yaml',
      fileMatch: ['*'],
      schema: kubernetesJSONSchema,
    },
  ];
};

/**
 * This works because we enabled globalAPI in the webpack config. This means that the
 * monaco instance is shared across all consumers of the console application.
 */
let currentMonacoYamlInstance: ReturnType<typeof configureMonacoYaml> | null = null;

export const registerYAMLinMonaco = (
  monacoInstance: typeof monaco,
): typeof currentMonacoYamlInstance => {
  /*
   * monaco-yaml only supports one instance per monaco instance, and since globalAPI
   * is enabled, we need to make sure we don't re-register our language service.
   * We check for more than 1 registered language for YAML -- monaco-editor ships
   * built-in YAML support, and we register our own.
   */
  if (monacoInstance.languages.getLanguages().filter((x) => x.id === 'yaml').length <= 1) {
    const schemas = getConsoleYamlSchemas();

    currentMonacoYamlInstance = configureMonacoYaml(monacoInstance, {
      isKubernetes: true,
      validate: true,
      schemas,
      hover: true,
      completion: true,
    });
  }

  return currentMonacoYamlInstance;
};
