import * as React from 'react';
import { Provider } from 'react-redux';
import { mount, ReactWrapper } from 'enzyme';

import store from '@console/internal/redux';
import { DetailsPage } from '@console/internal/components/factory';
import { DetailsPageProps } from '@console/dynamic-plugin-sdk';
import { PodModel, ConfigMapModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { Firehose } from '@console/internal/components/utils';

describe(DetailsPage.displayName, () => {
  let wrapper: ReactWrapper<DetailsPageProps>;

  beforeEach(() => {
    const match = { params: { ns: 'default' }, isExact: true, path: '', url: '' };

    // Need full mount with redux store since this is a redux-connected component
    wrapper = mount(
      <DetailsPage
        match={match}
        name="test-name"
        namespace="default"
        kind={referenceForModel(PodModel)}
        pages={[]}
      />,
      {
        wrappingComponent: ({ children }) => <Provider store={store}>{children}</Provider>,
      },
    );
  });

  it('renders a `Firehose` using the given props', () => {
    expect(wrapper.find<any>(Firehose).props().resources[0]).toEqual({
      kind: referenceForModel(PodModel),
      name: 'test-name',
      namespace: 'default',
      isList: false,
      prop: 'obj',
    });
  });

  it('adds extra resources to `Firehose` if provided in props', () => {
    const resources = [
      {
        kind: referenceForModel(ConfigMapModel),
        name: 'test-configmap',
        namespace: 'kube-system',
        isList: false,
        prop: 'configMap',
      },
    ];
    wrapper = wrapper.setProps({ resources });

    expect(wrapper.find<any>(Firehose).props().resources.length).toEqual(resources.length + 1);
    resources.forEach((resource, i) => {
      expect(wrapper.find<any>(Firehose).props().resources[i + 1]).toEqual(resource);
    });
  });
});
