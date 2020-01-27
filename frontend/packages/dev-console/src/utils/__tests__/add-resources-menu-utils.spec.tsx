import { URL } from 'url';
import * as React from 'react';
import { GitAltIcon } from '@patternfly/react-icons';
import { KebabOption, asAccessReview } from '@console/internal/components/utils';
import { DeploymentModel } from '@console/internal/models';
import {
  getMenuPath,
  getAddPageUrl,
  createKebabAction,
  KebabAction,
} from '../add-resources-menu-utils';
import {
  transformTopologyData,
  getTopologyResourceObject,
} from '../../components/topology/topology-utils';
import { ImportOptions } from '../../components/import/import-types';
import { MockResources } from '../../components/topology/__tests__/topology-test-data';
import { TopologyDataResources } from '../../components/topology/topology-types';
import { referenceFor } from '@console/internal/module/k8s';

const getTopologyData = (mockData: TopologyDataResources, transformByProp: string[]) => {
  const result = transformTopologyData(mockData, transformByProp);
  const keys = Object.keys(result.topology);
  const resource = getTopologyResourceObject(result.topology[keys[0]]);
  return { resource };
};

describe('addResourceMenuUtils: ', () => {
  it('should give proper menu item path based on the application', () => {
    expect(getMenuPath(true)).toEqual('Add to Application');
    expect(getMenuPath(false)).toEqual('Add to Project');
  });

  it('should return the page url with proper queryparams for git import flow', () => {
    const primaryResource = getTopologyData(MockResources, ['deployments']).resource;
    const connectorSourceObj = getTopologyData(MockResources, ['deploymentConfigs']).resource;
    const contextSource: string = `${referenceFor(connectorSourceObj)}/${
      connectorSourceObj?.metadata?.name
    }`;
    const url = new URL(
      getAddPageUrl(primaryResource, ImportOptions.GIT, true, contextSource),
      'https://mock.test.com',
    );

    expect(url.pathname).toBe('/import/ns/testproject1');
    expect(url.searchParams.get('importType')).toBe('git');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(url.searchParams.get('contextSource')).toBe(
      'apps.openshift.io~v1~DeploymentConfig%2Fnodejs',
    );
    expect(Array.from(url.searchParams.entries())).toHaveLength(3);
  });

  it('should return the page url without application params in the url', () => {
    const { resource } = getTopologyData(MockResources, ['deployments']);
    const url = new URL(getAddPageUrl(resource, ImportOptions.GIT, false), 'https://mock.test.com');
    expect(url.searchParams.has('application')).toBe(false);
  });

  it('should return the page url without contextSource params in the url', () => {
    const { resource } = getTopologyData(MockResources, ['deployments']);
    const url = new URL(getAddPageUrl(resource, ImportOptions.GIT, false), 'https://mock.test.com');
    expect(url.searchParams.has('contextSource')).toBe(false);
  });

  it('should return the page url with proper queryparams for container image flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments']);
    const url = new URL(
      getAddPageUrl(resource, ImportOptions.CONTAINER, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/deploy-image/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(1);
  });

  it('should return the page url with proper queryparams for catalog flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments']);
    const url = new URL(
      getAddPageUrl(resource, ImportOptions.CATALOG, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/catalog/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(1);
  });

  it('should return the page url with proper queryparams for dockerfile flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments']);
    const url = new URL(
      getAddPageUrl(resource, ImportOptions.DOCKERFILE, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/import/ns/testproject1');
    expect(url.searchParams.get('importType')).toBe('docker');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(2);
  });

  it('should return the page url with proper queryparams for database flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments']);
    const url = new URL(
      getAddPageUrl(resource, ImportOptions.DATABASE, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/catalog/ns/testproject1');
    expect(url.searchParams.get('category')).toBe('databases');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(2);
  });

  it('it should return a valid kebabAction on invoking createKebabAction with connectorSourceObj', () => {
    const primaryObj = getTopologyData(MockResources, ['deployments']).resource;
    const connectorSourceObj = getTopologyData(MockResources, ['deploymentConfigs']).resource;
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const label = 'From Git';

    const kebabAction: KebabAction = createKebabAction(label, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(primaryObj, hasApplication, connectorSourceObj);
    const contextSource: string = `${referenceFor(connectorSourceObj)}/${
      connectorSourceObj?.metadata?.name
    }`;

    expect(kebabOption.label).toEqual(label);
    expect(kebabOption.icon).toEqual(icon);
    expect(kebabOption.path).toEqual(null);
    expect(kebabOption.href).toEqual(
      getAddPageUrl(primaryObj, ImportOptions.GIT, hasApplication, contextSource),
    );
    expect(kebabOption.accessReview).toEqual(asAccessReview(DeploymentModel, primaryObj, 'create'));
  });

  it('it should return a valid kebabAction on invoking createKebabAction without connectorSourceObj', () => {
    const primaryObj = getTopologyData(MockResources, ['deployments']).resource;
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const label = 'From Git';

    const kebabAction: KebabAction = createKebabAction(label, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(primaryObj, hasApplication);

    expect(kebabOption.label).toEqual(label);
    expect(kebabOption.icon).toEqual(icon);
    expect(kebabOption.path).toEqual('Add to Application');
    expect(kebabOption.href).toEqual(getAddPageUrl(primaryObj, ImportOptions.GIT, hasApplication));
    expect(kebabOption.accessReview).toEqual(asAccessReview(DeploymentModel, primaryObj, 'create'));
  });

  it('it should not return an access review object, if checkAccess is disabled', () => {
    const primaryObj = getTopologyData(MockResources, ['deployments']).resource;
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const label = 'From Git';

    const kebabAction: KebabAction = createKebabAction(label, icon, ImportOptions.GIT, false); // CheckAccess Disabled
    const kebabOption: KebabOption = kebabAction(primaryObj, hasApplication);

    expect(kebabOption.accessReview).toBe(undefined);
  });
});
