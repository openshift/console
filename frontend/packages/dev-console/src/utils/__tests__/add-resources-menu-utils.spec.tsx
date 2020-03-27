import { URL } from 'url';
import * as React from 'react';
import { GitAltIcon } from '@patternfly/react-icons';
import { KebabOption } from '@console/internal/components/utils';
import {
  getMenuPath,
  getAddPageUrl,
  createKebabAction,
  KebabAction,
} from '../add-resources-menu-utils';
import { getTopologyResourceObject } from '../../components/topology/topology-utils';
import { UNASSIGNED_KEY } from '../../const';
import { ImportOptions } from '../../components/import/import-types';
import { MockResources } from '../../components/topology/__tests__/topology-test-data';
import { TopologyDataResources } from '../../components/topology/topology-types';
import { referenceFor } from '@console/internal/module/k8s';
import { transformTopologyData } from '../../components/topology/data-transforms/data-transformer';

const getTopologyData = (
  mockData: TopologyDataResources,
  transformByProp: string[],
  name: string,
) => {
  const result = transformTopologyData(mockData, transformByProp);
  const keys = Object.keys(result.topology);
  const itemKey = keys.find((key) => result.topology[key].resources.obj.metadata.name === name);
  const resource = getTopologyResourceObject(result.topology[itemKey]);
  return { resource };
};

describe('addResourceMenuUtils: ', () => {
  it('should give proper menu item path based on the application', () => {
    expect(getMenuPath(true)).toEqual('Add to Application');
    expect(getMenuPath(false)).toEqual('Add to Project');
  });

  it('should return the page url with proper queryparams for git import flow', () => {
    const primaryResource = getTopologyData(MockResources, ['deployments'], 'analytics-deployment')
      .resource;
    const connectorSourceObj = getTopologyData(MockResources, ['deploymentConfigs'], 'nodejs')
      .resource;
    const contextSource: string = `${referenceFor(connectorSourceObj)}/${
      connectorSourceObj?.metadata?.name
    }`;
    const url = new URL(
      getAddPageUrl(primaryResource, '', ImportOptions.GIT, true, contextSource),
      'https://mock.test.com',
    );

    expect(url.pathname).toBe('/import/ns/testproject1');
    expect(url.searchParams.get('importType')).toBe('git');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(url.searchParams.get('contextSource')).toBe(
      'apps.openshift.io~v1~DeploymentConfig/nodejs',
    );
    expect(Array.from(url.searchParams.entries())).toHaveLength(3);
  });

  it('should return the page url with no-application value param in the url', () => {
    const { resource } = getTopologyData(MockResources, ['deployments'], 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.GIT, false),
      'https://mock.test.com',
    );
    expect(url.searchParams.get('application')).toBe(UNASSIGNED_KEY);
  });

  it('should return the page url without contextSource params in the url', () => {
    const { resource } = getTopologyData(MockResources, ['deployments'], 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.GIT, false),
      'https://mock.test.com',
    );
    expect(url.searchParams.has('contextSource')).toBe(false);
  });

  it('should return the page url with proper queryparams for container image flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments'], 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.CONTAINER, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/deploy-image/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(1);
  });

  it('should return the page url with proper queryparams for catalog flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments'], 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.CATALOG, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/catalog/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(1);
  });

  it('should return the page url with proper queryparams for dockerfile flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments'], 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.DOCKERFILE, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/import/ns/testproject1');
    expect(url.searchParams.get('importType')).toBe('docker');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(2);
  });

  it('should return the page url with proper queryparams for database flow', () => {
    const { resource } = getTopologyData(MockResources, ['deployments'], 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.DATABASE, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/catalog/ns/testproject1');
    expect(url.searchParams.get('category')).toBe('databases');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(2);
  });

  it('it should return a valid kebabAction on invoking createKebabAction with connectorSourceObj', () => {
    const primaryObj = getTopologyData(MockResources, ['deployments'], 'analytics-deployment')
      .resource;
    const connectorSourceObj = getTopologyData(MockResources, ['deploymentConfigs'], 'nodejs')
      .resource;
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const label = 'From Git';

    const kebabAction: KebabAction = createKebabAction(label, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(
      primaryObj,
      '',
      hasApplication,
      connectorSourceObj,
    );
    const contextSource: string = `${referenceFor(connectorSourceObj)}/${
      connectorSourceObj?.metadata?.name
    }`;

    expect(kebabOption.label).toEqual(label);
    expect(kebabOption.icon).toEqual(icon);
    expect(kebabOption.path).toEqual(null);
    expect(kebabOption.href).toEqual(
      getAddPageUrl(primaryObj, '', ImportOptions.GIT, hasApplication, contextSource),
    );
  });

  it('it should return a valid kebabAction on invoking createKebabAction without connectorSourceObj', () => {
    const primaryObj = getTopologyData(MockResources, ['deployments'], 'analytics-deployment')
      .resource;
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const label = 'From Git';

    const kebabAction: KebabAction = createKebabAction(label, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(primaryObj, '', hasApplication);

    expect(kebabOption.label).toEqual(label);
    expect(kebabOption.icon).toEqual(icon);
    expect(kebabOption.path).toEqual('Add to Application');
    expect(kebabOption.href).toEqual(
      getAddPageUrl(primaryObj, '', ImportOptions.GIT, hasApplication),
    );
  });

  it('it should not return an access review object, if checkAccess is disabled', () => {
    const primaryObj = getTopologyData(MockResources, ['deployments'], 'analytics-deployment')
      .resource;
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const label = 'From Git';

    const kebabAction: KebabAction = createKebabAction(label, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(primaryObj, null, hasApplication);

    expect(kebabOption.accessReview).toBe(undefined);
  });
});
