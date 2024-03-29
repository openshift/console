import { K8sResourceCommon } from '@console/dynamic-plugin-sdk';
import { Condition } from './pipelineRun';

export type TektonHub = K8sResourceCommon & {
  spec: {
    api: {
      hubConfigUrl: string;
      secret: string;
    };
    db: {
      secret: string;
    };
    targetNamespace: string;
  };
  status: {
    apiUrl: string;
    uiUrl: string;
    authUrl: string;
    conditions: Condition[];
    hubInstallerSets: {
      ApiInstallerSet: string;
      DbInstallerSet: string;
      DbMigrationInstallerSet: string;
      UiInstallerSet: string;
    };
    observedGeneration: number;
    version: string;
  };
};
