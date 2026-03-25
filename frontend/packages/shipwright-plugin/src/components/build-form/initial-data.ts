import { BuildStrategyType } from '@console/dev-console/src/components/buildconfig/types';
import { GitProvider } from '@console/git-service/src';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import type { BuildFormikValues } from './types';

export const getInitialBuildFormikValues = (namespace?: string): BuildFormikValues => {
  return {
    editorType: EditorType.Form,
    git: {
      url: '',
      type: GitProvider.INVALID,
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      isUrlValidating: false,
    },
    formData: {
      name: '',
      source: {
        type: 'Git',
        git: {
          formType: 'edit',
          name: '',
          git: {
            url: '',
            type: GitProvider.INVALID,
            ref: '',
            dir: '/',
            showGitType: false,
            secret: '',
            isUrlValidating: false,
          },
          image: {
            selectedKey: '',
            selected: '',
            recommended: '',
            tagObj: '',
            couldNotRecommend: false,
          },
          application: {
            selected: '',
            selectedKey: '',
            name: '',
            isInContext: null,
          },
          build: {
            strategy: BuildStrategyType.Source,
          },
          project: {
            name: namespace,
          },
        },
      },
      build: {
        strategy: '',
        selectedBuildStrategy: undefined,
        kind: '',
      },
      parameters: [],
      volumes: [],
      outputImage: {
        image: '',
        secret: '',
      },

      environmentVariables: [],
    },

    yamlData: '',

    resourceVersion: undefined,
  };
};
