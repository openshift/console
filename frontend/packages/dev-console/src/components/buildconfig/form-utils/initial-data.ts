import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { GitTypes } from '../../import/import-types';
import { BuildConfigFormikValues, BuildStrategyType } from './types';

export const getInitialBuildConfigFormikValues = (): BuildConfigFormikValues => {
  return {
    editorType: EditorType.Form,
    formData: {
      name: '',

      source: {
        type: 'none',
        git: {
          formType: 'edit',
          name: '',
          git: {
            url: '',
            type: GitTypes.invalid,
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
            name: undefined,
          },
        },
        dockerfile: '',
      },

      images: {
        buildFrom: {
          type: 'none',
          imageStreamTag: {
            fromImageStreamTag: false,
            isSearchingForImage: false,
            imageStream: {
              namespace: '',
              image: '',
              tag: '',
            },
            project: {
              name: '',
            },
            isi: {
              name: '',
              image: {},
              tag: '',
              status: { metadata: {}, status: '' },
              ports: [],
            },
            image: {
              name: '',
              image: {},
              tag: '',
              status: { metadata: {}, status: '' },
              ports: [],
            },
          },
          imageStreamImage: '',
          dockerImage: '',
        },
        pushTo: {
          type: 'none',
          imageStreamTag: {
            fromImageStreamTag: false,
            isSearchingForImage: false,
            imageStream: {
              namespace: '',
              image: '',
              tag: '',
            },
            project: {
              name: '',
            },
            isi: {
              name: '',
              image: {},
              tag: '',
              status: { metadata: {}, status: '' },
              ports: [],
            },
            image: {
              name: '',
              image: {},
              tag: '',
              status: { metadata: {}, status: '' },
              ports: [],
            },
          },
          imageStreamImage: '',
          dockerImage: '',
        },
      },

      environmentVariables: [],

      triggers: {
        configChange: false,
        imageChange: false,
        otherTriggers: [],
      },

      secrets: [],

      policy: {
        runPolicy: null,
      },

      hooks: {
        enabled: false,
        type: 'command',
        commands: [''],
        shell: '',
        arguments: [],
      },
    },

    yamlData: '',

    resourceVersion: undefined,
  };
};
