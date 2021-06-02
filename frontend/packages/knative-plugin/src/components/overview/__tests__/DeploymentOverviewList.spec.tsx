import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { PodControllerOverviewItem } from '@console/shared';
import {
  sampleKnativeReplicaSets,
  sampleKnativePods,
} from '../../../topology/__tests__/topology-knative-test-data';
import DeploymentOverviewList from '../DeploymentOverviewList';

type DeploymentOverviewListProps = React.ComponentProps<typeof DeploymentOverviewList>;
let current: PodControllerOverviewItem;

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

describe('DeploymentOverviewList', () => {
  let wrapper: ShallowWrapper<DeploymentOverviewListProps>;
  beforeEach(() => {
    current = {
      alerts: {},
      revision: 1,
      obj: sampleKnativeReplicaSets.data[0],
      pods: sampleKnativePods.data,
    };
  });
  it('should render DeploymentOverviewList with ResourceLink', () => {
    wrapper = shallow(<DeploymentOverviewList current={current} />);
    expect(wrapper.find(SidebarSectionHeading)).toHaveLength(1);
    expect(wrapper.find(ResourceLink)).toHaveLength(1);
  });
});
