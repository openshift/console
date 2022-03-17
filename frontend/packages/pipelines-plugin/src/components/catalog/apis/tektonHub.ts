import { coFetch } from '@console/internal/co-fetch';
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

export const TEKTON_HUB_API_ENDPOINT = 'https://api.hub.tekton.dev/v1';
export const TEKTON_HUB_ENDPOINT = `https://hub.tekton.dev`;
export const TEKTON_HUB_INTEGRATION_KEY = 'enable-devconsole-integration';

export const getHubUIPath = (path: string = ''): string => {
  if (!path) {
    return null;
  }
  return path ? `${TEKTON_HUB_ENDPOINT}/${path}` : TEKTON_HUB_ENDPOINT;
};

export const getApiResponse = async (url: string) => (await coFetch(url)).json();

export const useTektonHubResources = (hasPermission: boolean): ApiResult<TektonHubTask[]> => {
  return useApiResponse<TektonHubTask>(`${TEKTON_HUB_API_ENDPOINT}/resources`, hasPermission);
};

export const getTektonHubTaskVersions = async (
  resourceId: string,
): Promise<TektonHubTaskVersion[]> => {
  const response = await getApiResponse(
    `${TEKTON_HUB_API_ENDPOINT}/resource/${resourceId}/versions`,
  );
  return response?.data?.versions ?? [];
};
