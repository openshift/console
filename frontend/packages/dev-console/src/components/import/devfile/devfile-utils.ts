import * as _ from 'lodash';
import { GitProvider, getGitService } from '@console/git-service/src';
import { coFetch } from '@console/internal/co-fetch';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { safeYAMLToJS, safeJSToYAML } from '@console/shared/src/utils/yaml';
import { DevfileComponent } from './devfile-types';

export const suffixSlash = (val: string) => (val.endsWith('/') ? val : `${val}/`);

export const prefixDotSlash = (val) => (val.startsWith('/') ? `.${val}` : val);

export const getResourceContent = async (
  resourceURI: string,
  url: string,
  ref: string,
  dir: string,
  type: GitProvider,
  secretResource?: K8sResourceKind,
): Promise<string> => {
  if (resourceURI.startsWith('http://') || resourceURI.startsWith('https://')) {
    const response = await coFetch(resourceURI);
    return response.text();
  }

  const gitService = getGitService(url, type, ref, dir, secretResource);
  if (!gitService) {
    throw new Error(
      `Could not fetch kubernetes resource from ${resourceURI}. Git provider ${type} is not supported.`,
    );
  }

  let resourcePath;
  if (resourceURI.startsWith('/')) {
    resourcePath = resourceURI;
  } else {
    const contextDir = suffixSlash(dir);
    resourcePath = `${contextDir}${resourceURI}`;
  }
  return gitService.getFileContent(resourcePath);
};

export const getParsedComponent = async (
  currentComponent: DevfileComponent,
  url: string,
  ref: string,
  dir: string,
  type: GitProvider,
  secretResource?: K8sResourceKind,
): Promise<DevfileComponent> => {
  let resourceContent;
  const component = currentComponent;
  if (component.kubernetes && component.kubernetes.uri) {
    resourceContent = await getResourceContent(
      component.kubernetes.uri,
      url,
      ref,
      dir,
      type,
      secretResource,
    );
    if (resourceContent) {
      component.kubernetes = _.omit({ ...component.kubernetes, inlined: resourceContent }, ['uri']);
    }
  } else if (component.openshift && component.openshift.uri) {
    resourceContent = await getResourceContent(
      component.openshift.uri,
      url,
      ref,
      dir,
      type,
      secretResource,
    );
    if (resourceContent) {
      component.openshift = _.omit({ ...component.openshift, inlined: resourceContent }, ['uri']);
    }
  }
  return component;
};

export const convertURItoInlineYAML = async (
  devfileContent: string,
  url: string,
  ref: string,
  dir: string,
  type: GitProvider,
  secretResource?: K8sResourceKind,
) => {
  const devfileJSON = safeYAMLToJS(devfileContent);
  for (let component of devfileJSON.components) {
    // eslint-disable-next-line no-await-in-loop
    component = await getParsedComponent(component, url, ref, dir, type, secretResource);
  }

  return safeJSToYAML(devfileJSON);
};
