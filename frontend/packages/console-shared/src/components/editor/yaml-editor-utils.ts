import * as URL from 'url';
import { global_BackgroundColor_200 as globalBackground200 } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_200';
import { global_BackgroundColor_dark_100 as editorBackground } from '@patternfly/react-tokens/dist/js/global_BackgroundColor_dark_100';
import { global_Color_light_100 as globalColorLight100 } from '@patternfly/react-tokens/dist/js/global_Color_light_100';
import {
  MonacoToProtocolConverter,
  ProtocolToMonacoConverter,
} from 'monaco-languageclient/lib/monaco-converter';
import * as yaml from 'yaml-ast-parser';
import { getLanguageService, TextDocument } from 'yaml-language-server';
import { openAPItoJSONSchema } from '@console/internal/module/k8s/openapi-to-json-schema';
import { getSwaggerDefinitions } from '@console/internal/module/k8s/swagger';

window.monaco.editor.defineTheme('console', {
  base: 'vs-dark',
  inherit: true,
  rules: [
    // avoid pf tokens for `rules` since tokens are opaque strings that might not be hex values
    { token: 'number', foreground: 'ace12e' },
    { token: 'type', foreground: '73bcf7' },
    { token: 'string', foreground: 'f0ab00' },
    { token: 'keyword', foreground: 'cbc0ff' },
  ],
  colors: {
    'editor.background': editorBackground.value,
    'editorGutter.background': '#292e34', // no pf token defined
    'editorLineNumber.activeForeground': globalColorLight100.value,
    'editorLineNumber.foreground': globalBackground200.value,
  },
});

const { Range } = window.monaco;

export const defaultEditorOptions = { readOnly: false, scrollBeyondLastLine: false };

const MODEL_URI = 'inmemory://model.yaml';
const MONACO_URI = monaco.Uri.parse(MODEL_URI);

const createDocument = (model) => {
  return TextDocument.create(MODEL_URI, model.getModeId(), model.getVersionId(), model.getValue());
};

// Unfortunately, `editor.focus()` doesn't work when hiding the shortcuts
// popover. We need to find the actual DOM element.
export const hackyFocusEditor = () =>
  setTimeout(() => document.querySelector<any>('.monaco-editor textarea')?.focus());

export const registerYAMLLanguage = (monaco) => {
  // register the YAML language with Monaco
  monaco.languages.register({
    id: 'yaml',
    extensions: ['.yml', '.yaml'],
    aliases: ['YAML', 'yaml'],
    mimetypes: ['application/yaml'],
  });
};

export const createYAMLService = () => {
  const resolveSchema = (url: string): Promise<string> => {
    const promise = new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.responseText);
      xhr.onerror = () => reject(xhr.statusText);
      xhr.open('GET', url, true);
      xhr.send();
    });
    return promise as Promise<string>;
  };

  const workspaceContext = {
    resolveRelativePath: (relativePath, resource) => URL.resolve(resource, relativePath),
  };

  const yamlService = getLanguageService(resolveSchema, workspaceContext);

  // Prepare the schema
  const yamlOpenAPI = getSwaggerDefinitions();

  // Convert the openAPI schema to something the language server understands
  const kubernetesJSONSchema = openAPItoJSONSchema(yamlOpenAPI);

  const schemas = [
    {
      uri: 'inmemory:yaml',
      fileMatch: ['*'],
      schema: kubernetesJSONSchema,
    },
  ];
  yamlService.configure({
    validate: true,
    schemas,
    hover: true,
    completion: true,
  });
  return yamlService;
};

export const registerYAMLCompletion = (languageID, monaco, m2p, p2m, yamlService) => {
  monaco.languages.registerCompletionItemProvider(languageID, {
    provideCompletionItems(model, position) {
      const document = createDocument(model);
      return yamlService
        .doComplete(document, m2p.asPosition(position.lineNumber, position.column), true)
        .then((list) => {
          return p2m.asCompletionResult(list);
        });
    },
  });
};

export const registerYAMLDocumentSymbols = (languageID, monaco, p2m, yamlService) => {
  monaco.languages.registerDocumentSymbolProvider(languageID, {
    provideDocumentSymbols(model) {
      const document = createDocument(model);
      return p2m.asSymbolInformations(yamlService.findDocumentSymbols(document));
    },
  });
};

export const registerYAMLHover = (languageID, monaco, m2p, p2m, yamlService) => {
  monaco.languages.registerHoverProvider(languageID, {
    provideHover(model, position) {
      const doc = createDocument(model);
      return yamlService
        .doHover(doc, m2p.asPosition(position.lineNumber, position.column), true)
        .then((hover) => {
          return p2m.asHover(hover);
        })
        .then((e) => {
          for (const el of <any>document.getElementsByClassName('monaco-editor-hover')) {
            el.onclick = (event) => event.preventDefault();
            el.onauxclick = (event) => {
              window.open(event.target.getAttribute('data-href'), '_blank').opener = null;
              event.preventDefault();
            };
          }
          return e;
        });
    },
  });
};

const findManagedMetadata = (model) => {
  const document = createDocument(model);
  const doc = yaml.safeLoad(document.getText());
  const rootMappings = doc.mappings || [];
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
          const startLine = document.positionAt(metadataChildren.startPosition).line + 1;
          const endLine = document.positionAt(metadataChildren.endPosition).line;
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

export const fold = (editor, model, resetMouseLocation: boolean): void => {
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

export const enableYAMLValidation = (
  editor,
  monaco,
  p2m,
  monacoURI,
  yamlService,
  alreadyInUse: boolean = false,
) => {
  const pendingValidationRequests = new Map();

  const getModel = () => monaco.editor.getModels()[0];

  const cleanPendingValidation = (document) => {
    const request = pendingValidationRequests.get(document.uri);
    if (request !== undefined) {
      clearTimeout(request);
      pendingValidationRequests.delete(document.uri);
    }
  };

  const cleanDiagnostics = () =>
    monaco.editor.setModelMarkers(monaco.editor.getModel(monacoURI), 'default', []);

  const doValidate = (document) => {
    if (document.getText().length === 0) {
      cleanDiagnostics();
      return;
    }
    yamlService
      .doValidation(document, true)
      .then((diagnostics) => {
        const markers = p2m.asDiagnostics(diagnostics);
        monaco.editor.setModelMarkers(getModel(), 'default', markers);
      })
      .catch(() => {});
  };

  let initialFoldingTriggered = false;
  const tryFolding = () => {
    const document = createDocument(getModel());
    if (!initialFoldingTriggered && document.getText() !== '') {
      fold(editor, getModel(), true);
      initialFoldingTriggered = true;
    }
  };
  if (alreadyInUse) {
    tryFolding();
  }

  getModel().onDidChangeContent(() => {
    tryFolding();

    const document = createDocument(getModel());
    cleanPendingValidation(document);
    pendingValidationRequests.set(
      document.uri,
      setTimeout(() => {
        pendingValidationRequests.delete(document.uri);
        doValidate(document);
      }),
    );
  });
};

export const registerYAMLinMonaco = (editor, monaco, alreadyInUse: boolean = false) => {
  const LANGUAGE_ID = 'yaml';

  const m2p = new MonacoToProtocolConverter();
  const p2m = new ProtocolToMonacoConverter();

  const yamlService = createYAMLService();

  // validation is not a 'registered' feature like the others, it relies on calling the yamlService
  // directly for validation results when content in the editor has changed
  enableYAMLValidation(editor, monaco, p2m, MONACO_URI, yamlService, alreadyInUse);

  /**
   * This exists because react-monaco-editor passes the same monaco
   * object each time. Without it you would be registering all the features again and
   * getting duplicate results.
   *
   * Monaco does not provide any apis for unregistering or checking if the features have already
   * been registered for a language.
   *
   * We check that > 1 YAML language exists because one is the default and one is the initial register
   * that setups our features.
   */
  if (monaco.languages.getLanguages().filter((x) => x.id === LANGUAGE_ID).length > 1) {
    return;
  }

  registerYAMLLanguage(monaco); // register the YAML language with monaco
  registerYAMLCompletion(LANGUAGE_ID, monaco, m2p, p2m, yamlService);
  registerYAMLDocumentSymbols(LANGUAGE_ID, monaco, p2m, yamlService);
  registerYAMLHover(LANGUAGE_ID, monaco, m2p, p2m, yamlService);
};
