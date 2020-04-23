import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import NoKnativeServiceAlert from '../NoKnativeServiceAlert';
import { knativeServiceObj } from '../../../topology/__tests__/topology-knative-test-data';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

describe('NoKnativeServiceAlert', () => {
  const namespaceName = 'myApp';
  it('should not display alert if not loaded', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([null, false]);
    const wrapper = shallow(<NoKnativeServiceAlert namespace={namespaceName} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });

  it('should display alert if loaded and have data as empty', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[], true]);
    const wrapper = shallow(<NoKnativeServiceAlert namespace={namespaceName} />);
    expect(wrapper.find(Alert).exists()).toBe(true);
    expect(wrapper.find(Alert)).toHaveLength(1);
  });

  it('should not alert if loaded and have data', () => {
    (useK8sWatchResource as jest.Mock).mockReturnValueOnce([[knativeServiceObj], true]);
    const wrapper = shallow(<NoKnativeServiceAlert namespace={namespaceName} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });
});
