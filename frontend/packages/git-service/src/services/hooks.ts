import * as React from 'react';
import { SecretKind } from '@console/internal/module/k8s';
import { GitProvider } from '../types';
import { detectGitProvider } from '../utils/git-provider-detector';
import { detectImportStrategies, DetectedStrategy } from '../utils/import-strategy-detector';
import { getGitService } from './git-service';

type DetectedServiceData = {
  loaded: boolean;
  loadError?: any;
  gitProvider: GitProvider;
  strategies: DetectedStrategy[];
};

export const useImportStrategyDetection = (
  repository: string,
  ref?: string,
  contextDir?: string,
  secret?: SecretKind,
  gitType?: GitProvider,
): DetectedServiceData => {
  const [detectedStrategies, setDetectedStrategies] = React.useState<DetectedStrategy[]>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [loadError, setLoadError] = React.useState<any>();
  const gitProvider = gitType || detectGitProvider(repository);

  React.useEffect(() => {
    setLoaded(false);
    const gitService = getGitService(repository, gitProvider, ref, contextDir, secret);
    if (gitService) {
      detectImportStrategies(gitService)
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
