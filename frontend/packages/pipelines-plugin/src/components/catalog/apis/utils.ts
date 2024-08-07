import { safeLoad } from 'js-yaml';
import { consoleFetchJSON, K8sResourceKind } from '@console/dynamic-plugin-sdk/src/lib-core';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';

export const ARTIFACTHUB_SEARCH_URL = '/api/dev-console/artifacthub/search';
export const ARTIFACTHUB_TASK_DETAILS_URL = '/api/dev-console/artifacthub/get';
export const GITHUB_ARTIFACTHUB_TASK_YAML_URL = '/api/dev-console/artifacthub/yaml';

export type ArtifactHubRepository = {
  name: string;
  kind: number;
  url: string;
  display_name: string;
  repository_id: string;
  organization_name: string;
  organization_display_name: string;
};

export type ArtifactHubVersion = {
  version: string;
  contains_security_update: boolean;
  prerelease: boolean;
  ts: number;
};

export type ArtifactHubTask = {
  package_id: string;
  name: string;
  description: string;
  version: string;
  display_name: string;
  repository: ArtifactHubRepository;
};

export type ArtifactHubTaskDetails = {
  package_id: string;
  name: string;
  description: string;
  display_name: string;
  keywords: string[];
  platforms: string[];
  version: ArtifactHubVersion[];
  available_versions: [];
  content_url: string;
  repository: ArtifactHubRepository;
};

export type DevConsoleEndpointResponse = {
  statusCode: number;
  headers: Record<string, string[]>;
  body: string;
};

type TaskSearchRequest = {
  searchQuery?: string;
};

type TaskDetailsRequest = {
  repoName: string;
  name: string;
  version: string;
};

type TaskYAMLRequest = {
  yamlPath: string;
};

/**
 * Fetches the YAML content of a task from GitHub.
 * @param taskYAMLRequest The request object containing the path to the task YAML file.
 * @returns The parsed YAML content of the task.
 */
export const getTaskYAMLFromGithub = async (
  taskYAMLRequest: TaskYAMLRequest,
): Promise<K8sResourceKind> => {
  const taskYAMLResponse: DevConsoleEndpointResponse = await consoleFetchJSON.post(
    GITHUB_ARTIFACTHUB_TASK_YAML_URL,
    taskYAMLRequest,
  );

  if (!taskYAMLResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }

  if (taskYAMLResponse.statusCode < 200 || taskYAMLResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${taskYAMLResponse.statusCode}`,
      taskYAMLResponse.statusCode,
      null,
      taskYAMLResponse,
    );
  }

  try {
    // Parse the YAML response body
    return safeLoad(taskYAMLResponse.body);
  } catch (e) {
    throw new Error('Failed to parse task YAML response body as YAML');
  }
};

/**
 * Fetches the details of a task from ArtifactHub.
 * @param taskDetailsRequest The request object containing the task details.
 * @returns The details of the task.
 */
export const getTaskDetails = async (
  taskDetailsRequest: TaskDetailsRequest,
): Promise<ArtifactHubTaskDetails> => {
  const taskDetailsResponse: DevConsoleEndpointResponse = await consoleFetchJSON.post(
    ARTIFACTHUB_TASK_DETAILS_URL,
    taskDetailsRequest,
  );
  if (!taskDetailsResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (taskDetailsResponse.statusCode < 200 || taskDetailsResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${taskDetailsResponse.statusCode}`,
      taskDetailsResponse.statusCode,
      null,
      taskDetailsResponse,
    );
  }

  try {
    return JSON.parse(taskDetailsResponse.body) as ArtifactHubTaskDetails;
  } catch (e) {
    throw new Error('Failed to parse task details response body as JSON');
  }
};

/**
 * Fetches the tasks from ArtifactHub.
 * @param (optional) searchrequest The search request object.
 * @returns The array of tasks matching the search request.
 */
export const searchTasks = async (
  searchrequest?: TaskSearchRequest,
): Promise<ArtifactHubTask[]> => {
  const searchResponse: DevConsoleEndpointResponse = await consoleFetchJSON.post(
    ARTIFACTHUB_SEARCH_URL,
    searchrequest || {},
  );
  if (!searchResponse.statusCode) {
    throw new Error('Unexpected proxy response: Status code is missing!');
  }
  if (searchResponse.statusCode < 200 || searchResponse.statusCode >= 300) {
    throw new HttpError(
      `Unexpected status code: ${searchResponse.statusCode}`,
      searchResponse.statusCode,
      null,
      searchResponse,
    );
  }

  try {
    return JSON.parse(searchResponse.body).packages as ArtifactHubTask[];
  } catch (e) {
    throw new Error('Failed to parse search response body as JSON');
  }
};
