import * as React from 'react';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { SecretKind } from '@console/internal/module/k8s';
import {
  DeployStrategy,
  GitSource,
  BuildType,
  SecretType as GitSecretType,
  GitProvider,
} from '../types';
import { detectBuildTypes } from '../utils/build-tool-type-detector';
import { detectDeployStrategies } from '../utils/deploy-strategy-detector';
import { detectGitProvider } from '../utils/git-provider-detector';
import { getGitService } from './git-service';

type AsyncServiceData = {
  loaded: boolean;
  loadError?: any;
  gitProvider: GitProvider;
};

const gitServiceFromSource = (
  gitProvider: GitProvider,
  repository: string,
  ref?: string,
  contextDir?: string,
  secret?: SecretKind,
) => {
  let secretType: GitSecretType;
  let secretContent: any;
  switch (secret?.type) {
    case SecretType.basicAuth:
      secretType = GitSecretType.BASIC_AUTH;
      secretContent = secret.data;
      break;
    case SecretType.sshAuth:
      secretType = GitSecretType.SSH;
      secretContent = secret['ssh-privatekey'];
      break;
    default:
      secretType = GitSecretType.NO_AUTH;
  }
  const gitSource: GitSource = {
    url: repository,
    ref,
    contextDir,
    secretType,
    secretContent,
  };
  return getGitService(gitSource, gitProvider);
};

export const useDeployStrategyDetection = (
  repository: string,
  ref?: string,
  contextDir?: string,
  secret?: SecretKind,
  gitType?: GitProvider,
): AsyncServiceData & { strategies: DeployStrategy[] } => {
  const [detectedStrategies, setDetectedStrategies] = React.useState<DeployStrategy[]>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<any>();
  const gitProvider = gitType || detectGitProvider(repository);

  React.useEffect(() => {
    setLoaded(false);
    const gitService = gitServiceFromSource(gitProvider, repository, ref, contextDir, secret);
    if (gitService) {
      detectDeployStrategies(gitService)
        .then((strategies) => {
          setDetectedStrategies(strategies);
          setLoaded(true);
        })
        .catch((e) => {
          setLoadError(e);
          setLoaded(true);
        });
    } else {
      setDetectedStrategies([]);
      setLoaded(true);
    }
  }, [repository, ref, contextDir, secret, gitType, gitProvider]);

  return { loaded, loadError, strategies: detectedStrategies, gitProvider };
};

export const useBuildTypeDetection = (
  repository: string,
  ref?: string,
  contextDir?: string,
  secret?: SecretKind,
  gitType?: GitProvider,
): AsyncServiceData & { detectedBuildTypes: BuildType[] } => {
  const [detectedTypes, setDetectedTypes] = React.useState<BuildType[]>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<any>();
  const gitProvider = gitType || detectGitProvider(repository);

  React.useEffect(() => {
    const gitService = gitServiceFromSource(gitProvider, repository, ref, contextDir, secret);
    if (gitService) {
      detectBuildTypes(gitService)
        .then((types) => {
          setDetectedTypes(types);
          setLoaded(true);
        })
        .catch((e) => {
          setLoadError(e);
          setLoaded(true);
        });
    } else {
      setDetectedTypes([]);
      setLoaded(true);
    }
  }, [repository, ref, contextDir, secret, gitType, gitProvider]);

  return { loaded, loadError, detectedBuildTypes: detectedTypes, gitProvider };
};
