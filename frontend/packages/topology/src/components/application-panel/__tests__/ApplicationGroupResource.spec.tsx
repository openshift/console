import * as React from 'react';
import { shallow } from 'enzyme';
import { Link } from 'react-router-dom';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import ApplicationGroupResource from '../ApplicationGroupResource';
import TopologyApplicationResourceList from '../TopologyApplicationList';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key.split('~')[1] }),
  };
});

describe(ApplicationGroupResource.displayName, () => {
  it('should component exists', () => {
    const wrapper = shallow(
      <ApplicationGroupResource
        title="Deployments"
        resourcesData={sampleDeployments.data}
        group="a"
      />,
    );
    expect(wrapper.isEmptyRender()).toBe(false);
  });

  it('should not exists when resourceData is an empty array', () => {
    const wrapper = shallow(
      <ApplicationGroupResource title="Deployments" resourcesData={[]} group="a" />,
    );
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should render view all link if resource is greater than MAX_RESOURCE', () => {
    const resourcesData: K8sResourceKind[] = [
      { kind: 'DeploymentConfig', metadata: { name: 'a', uid: '1' } },
      { kind: 'DeploymentConfig', metadata: { name: 'b', uid: '2' } },
      { kind: 'DeploymentConfig', metadata: { name: 'c', uid: '3' } },
      { kind: 'DeploymentConfig', metadata: { name: 'd', uid: '4' } },
      { kind: 'DeploymentConfig', metadata: { name: 'e', uid: '5' } },
      { kind: 'DeploymentConfig', metadata: { name: 'f', uid: '6' } },
      { kind: 'DeploymentConfig', metadata: { name: 'g', uid: '7' } },
    ];
    const wrapper = shallow(
      <ApplicationGroupResource
        title="Deployment Config"
        resourcesData={resourcesData}
        group="a"
      />,
    );
    expect(wrapper.find(Link).exists()).toBe(true);
  });

  it('should not render `view all` link if resource is less than MAX_RESOURCE', () => {
    const resourcesData: K8sResourceKind[] = [
      { kind: 'DeploymentConfig', metadata: { name: 'a', uid: '1' } },
    ];
    const wrapper = shallow(
      <ApplicationGroupResource
        title="Deployment Config"
        resourcesData={resourcesData}
        group="a"
      />,
    );
    expect(wrapper.find(Link).exists()).toBe(false);
  });

  it('should render TopologyApplicationResourceList if resourceData is greater than 0', () => {
    const resourcesData: K8sResourceKind[] = [
      { kind: 'DeploymentConfig', metadata: { name: 'a', uid: '1' } },
    ];
    const wrapper = shallow(
      <ApplicationGroupResource
        title="Deployment Config"
        resourcesData={resourcesData}
        group="a"
      />,
    );
    expect(wrapper.find(TopologyApplicationResourceList).exists()).toBe(true);
  });
});
