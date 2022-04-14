import { coFetch } from '@console/internal/co-fetch';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { TektonHubModel } from '../../../models';
import { TektonHub } from '../../../types/hub';
import useApiResponse, { ApiResult } from '../hooks/useApiResponse';

export type TektonHubItem = {
  id: number;
  name: string;
};
export type TektonHubCategory = TektonHubItem;

export type TektonHubTag = TektonHubItem;

export type TektonHubPlatform = TektonHubItem;

export type TektonHubCatalog = TektonHubItem & {
  type: string;
};

export type TektonHubTaskVersion = {
  id: number;
  version: string;
  hubURLPath: string;
  rawURL: string;
  webURL: string;
  platforms: TektonHubPlatform[];
};

export type TektonHubLatestVersion = TektonHubTaskVersion & {
  displayName: string;
  description: string;
  minPipelinesVersion: string;
  updatedAt: string;
};

export type TektonHubTask = {
  id: number;
  name: string;
  categories: TektonHubCategory[];
  catalog: TektonHubCatalog;
  platforms: TektonHubPlatform[];
  kind: string;
  latestVersion: TektonHubLatestVersion;
  tags: TektonHubTag[];
  rating: number;
};
export const TEKTON_HUB_API_VERSION = 'v1';
export const TEKTON_HUB_API_ENDPOINT = 'https://api.hub.tekton.dev';
export const TEKTON_HUB_ENDPOINT = `https://hub.tekton.dev`;
export const TEKTON_HUB_INTEGRATION_KEY = 'enable-devconsole-integration';

export const getHubUIPath = (path: string = '', baseURL: string = TEKTON_HUB_ENDPOINT): string => {
  if (!path) {
    return null;
  }
  return `${baseURL}/${path}`;
};

export const getApiResponse = async (url: string) => (await coFetch(url)).json();

export const useInclusterTektonHubURLs = () => {
  const [hub, loaded] = useK8sGet<TektonHub>(TektonHubModel, 'hub');
  // check in-cluster hub exists, if yes use incluster hub instance api url and ui url
  return {
    loaded,
    apiURL: hub?.status?.apiUrl || TEKTON_HUB_API_ENDPOINT,
    uiURL: hub?.status?.uiUrl || TEKTON_HUB_ENDPOINT,
  };
};

export const useTektonHubResources = (
  baseURL,
  hasPermission: boolean,
): ApiResult<TektonHubTask[]> => {
  return useApiResponse<TektonHubTask>(
    `${baseURL}/${TEKTON_HUB_API_VERSION}/resources`,
    hasPermission,
  );
};

export const getTektonHubTaskVersions = async (
  resourceId: string,
  baseURL?: string,
): Promise<TektonHubTaskVersion[]> => {
  const API_BASE_URL = baseURL || TEKTON_HUB_API_ENDPOINT;
  const response = await getApiResponse(
    `${API_BASE_URL}/${TEKTON_HUB_API_VERSION}/resource/${resourceId}/versions`,
  );
  return response?.data?.versions ?? [];
};
