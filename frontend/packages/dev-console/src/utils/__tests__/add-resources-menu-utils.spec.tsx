import { URL } from 'url';
import * as React from 'react';
import { GitAltIcon } from '@patternfly/react-icons';
import { KebabOption } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { MockResources } from '@console/shared/src/utils/__tests__/test-resource-data';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { baseDataModelGetter } from '@console/topology/src/data-transforms/data-transformer';
import { getWorkloadResources } from '@console/topology/src/data-transforms/transform-utils';
import { TopologyDataResources } from '@console/topology/src/topology-types';
import {
  getTopologyResourceObject,
  WORKLOAD_TYPES,
} from '@console/topology/src/utils/topology-utils';
import { TEST_KINDS_MAP } from '../../../../topology/src/__tests__/topology-test-data';
import { ImportOptions } from '../../components/import/import-types';
import { INCONTEXT_ACTIONS_CONNECTS_TO } from '../../const';
import {
  getMenuPath,
  getAddPageUrl,
  createKebabAction,
  KebabAction,
} from '../add-resources-menu-utils';

const getTopologyData = (mockData: TopologyDataResources, name: string) => {
  const model = { nodes: [], edges: [] };
  const workloadResources = getWorkloadResources(mockData, TEST_KINDS_MAP, WORKLOAD_TYPES);
  const result = baseDataModelGetter(model, 'test-project', mockData, workloadResources, []);
  const node = result.nodes.find((n) => n.data.resources.obj.metadata.name === name);
  return getTopologyResourceObject(node.data);
};

describe('addResourceMenuUtils: ', () => {
  it('should give proper menu item path based on the application', () => {
    expect(getMenuPath(true)).toEqual('devconsole~Add to Application');
    expect(getMenuPath(false)).toEqual('devconsole~Add to Project');
  });

  it('should return the page url with proper queryparams for git import flow', async () => {
    const primaryResource = await getTopologyData(MockResources, 'analytics-deployment');
    const connectorSourceObj = await getTopologyData(MockResources, 'nodejs');
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
    expect(url.searchParams.get('action')).toBe(
      JSON.stringify({
        type: INCONTEXT_ACTIONS_CONNECTS_TO,
        payload: 'apps~v1~DeploymentConfig/nodejs',
      }),
    );
    expect(Array.from(url.searchParams.entries())).toHaveLength(3);
  });

  it('should return the page url with no-application value param in the url', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.GIT, false),
      'https://mock.test.com',
    );
    expect(url.searchParams.get('application')).toBe(UNASSIGNED_KEY);
  });

  it('should return the page url without contextSource params in the url', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.GIT, false),
      'https://mock.test.com',
    );
    expect(url.searchParams.has('contextSource')).toBe(false);
  });

  it('should return the page url with proper queryparams for container image flow', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.CONTAINER, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/deploy-image/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(1);
  });

  it('should return the page url with proper queryparams for event source creation', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.EVENTSOURCE, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/catalog/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(2);
  });

  it('should return the page url with proper queryparams for catalog flow', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.CATALOG, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/catalog/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(1);
  });

  it('should return the page url with proper queryparams for dockerfile flow', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.DOCKERFILE, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/import/ns/testproject1');
    expect(url.searchParams.get('importType')).toBe('docker');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(2);
  });

  it('should return the page url with proper queryparams for database flow', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.DATABASE, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/catalog/ns/testproject1');
    expect(url.searchParams.get('category')).toBe('databases');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(2);
  });

  it('should return the page url with proper queryparams for upload JAR flow', async () => {
    const resource = await getTopologyData(MockResources, 'analytics-deployment');
    const url = new URL(
      getAddPageUrl(resource, '', ImportOptions.UPLOADJAR, true),
      'https://mock.test.com',
    );
    expect(url.pathname).toBe('/upload-jar/ns/testproject1');
    expect(url.searchParams.get('application')).toBe('application-1');
    expect(Array.from(url.searchParams.entries())).toHaveLength(1);
  });

  it('it should return a valid kebabAction on invoking createKebabAction with connectorSourceObj', async () => {
    const primaryObj = await getTopologyData(MockResources, 'analytics-deployment');
    const connectorSourceObj = await getTopologyData(MockResources, 'nodejs');
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const labelKey = 'devconsole~From Git';

    const kebabAction: KebabAction = createKebabAction(labelKey, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(
      primaryObj,
      '',
      hasApplication,
      connectorSourceObj,
      [],
    );
    const contextSource: string = `${referenceFor(connectorSourceObj)}/${
      connectorSourceObj?.metadata?.name
    }`;

    expect(kebabOption.labelKey).toEqual(labelKey);
    expect(kebabOption.icon).toEqual(icon);
    expect(kebabOption.path).toBeFalsy();
    expect(kebabOption.href).toEqual(
      getAddPageUrl(primaryObj, '', ImportOptions.GIT, hasApplication, contextSource),
    );
  });

  it('it should return a valid kebabAction on invoking createKebabAction without connectorSourceObj', async () => {
    const primaryObj = await getTopologyData(MockResources, 'analytics-deployment');
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const labelKey = 'devconsole~From Git';

    const kebabAction: KebabAction = createKebabAction(labelKey, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(primaryObj, '', hasApplication, undefined, []);

    expect(kebabOption.labelKey).toEqual(labelKey);
    expect(kebabOption.icon).toEqual(icon);
    expect(kebabOption.pathKey).toEqual('devconsole~Add to Application');
    expect(kebabOption.href).toEqual(
      getAddPageUrl(primaryObj, '', ImportOptions.GIT, hasApplication),
    );
  });

  it('it should not return an access review object, if checkAccess is disabled', async () => {
    const primaryObj = await getTopologyData(MockResources, 'analytics-deployment');
    const icon = <GitAltIcon />;
    const hasApplication = true;
    const label = 'From Git';

    const kebabAction: KebabAction = createKebabAction(label, icon, ImportOptions.GIT);
    const kebabOption: KebabOption = kebabAction(primaryObj, null, hasApplication, undefined, []);

    expect(kebabOption.accessReview).toBe(undefined);
  });
});
