import * as _ from 'lodash';
import { coFetchJSON } from '@console/internal/co-fetch';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { GitOpsManifestData, GitOpsAppGroupData } from './gitops-types';
import { mockEnvsData } from './gitops-data';

export const getManifestURLs = (namespaces: K8sResourceKind[]): string[] => {
  const annotation = 'app.openshift.io/vcs-uri';
  return _.uniq(
    namespaces
      .filter((ns) => {
        return !!ns.metadata?.annotations?.[annotation];
      })
      .map((ns) => {
        return ns.metadata?.annotations?.[annotation];
      }),
  );
};

export const fetchAppGroups = async (
  baseURL: string,
  manifestURL: string,
): Promise<GitOpsAppGroupData[]> => {
  let data: GitOpsManifestData;
  try {
    data = await coFetchJSON(`${baseURL}&url=${manifestURL}`);
  } catch {} // eslint-disable-line no-empty
  return data?.applications ?? [];
};

export const fetchAllAppGroups = async (baseURL: string, manifestURLs: string[]) => {
  let emptyMsg: string = null;
  let allAppGroups: GitOpsAppGroupData[] = null;
  if (baseURL) {
    if (_.isEmpty(manifestURLs)) {
      emptyMsg = 'No GitOps Manifest URLs found';
    } else {
      try {
        allAppGroups = _.sortBy(
          _.flatten(
            await Promise.all(
              _.map(manifestURLs, (manifestURL) => fetchAppGroups(baseURL, manifestURL)),
            ),
          ),
          ['name'],
        );
      } catch {} // eslint-disable-line no-empty
      if (_.isEmpty(allAppGroups)) {
        emptyMsg = 'No Application groups found';
      }
    }
  }
  return [allAppGroups, emptyMsg];
};

export const getEnvData = async (envURI: string, env: string, appURI: string) => {
  let data;
  try {
    data = await coFetchJSON(`${envURI}/${env}${appURI}`);
  } catch {} // eslint-disable-line no-empty
  data = await Promise.resolve(mockEnvsData[env]); // will remove this once backend is ready
  return data;
};

export const getPipelinesBaseURI = (secretNS: string, secretName: string) => {
  return secretNS && secretName
    ? `/api/gitops/pipelines?secretNS=${secretNS}&secretName=${secretName}`
    : undefined;
};

export const getApplicationsBaseURI = (
  appName: string,
  secretNS: string,
  secretName: string,
  manifestURL: string,
) => {
  return secretNS && secretName
    ? `/application/${appName}?secretNS=${secretNS}&secretName=${secretName}&url=${manifestURL}`
    : undefined;
};
