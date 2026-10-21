import type { GitSectionFormData } from '@console/dev-console/src/components/import/git/GitSection';
import type { GitData } from '@console/dev-console/src/components/import/import-types';
import type { NameValueFromPair, NameValuePair } from '@console/shared/src';
import type { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import type { BuildStrategyKind, ClusterBuildStrategyKind } from '../../types';

export type BuildFormikValues = {
  editorType: EditorType;
  yamlData: string;
  resourceVersion: string | undefined;
  formReloadCount?: number;
  git?: GitData;
  formData: {
    name: string;
    source?: {
      type: 'Git';
      git: GitSectionFormData;
    };
    environmentVariables?: (NameValuePair | NameValueFromPair)[];
    outputImage: {
      image: string;
      secret: string;
    };
    parameters?: [];
    volumes?: {
      name: string;
      overridable: boolean;
      resourceType: string;
      resource: string;
    }[];
    build: {
      strategy: string;
      selectedBuildStrategy: ClusterBuildStrategyKind | BuildStrategyKind;
      kind: string;
    };
  };
};

export type BuildParam = {
  default?: string;
  defaults?: string[];
  description?: string;
  name: string;
  type?: 'string' | 'array';
};

export type ModalParameter = BuildParam & {
  value?: string | string[];
};

export enum VolumeTypes {
  EmptyDirectory = 'emptyDir',
  ConfigMap = 'configMap',
  Secret = 'secret',
  PVC = 'pvc',
}
