import * as React from 'react';
import { Provider } from 'react-redux';
import * as Router from 'react-router-dom-v5-compat';
import { mount, ReactWrapper } from 'enzyme';

import store from '@console/internal/redux';
import { DetailsPage, DetailsPageProps } from '@console/internal/components/factory/details';
import { PodModel, ConfigMapModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { Firehose } from '@console/internal/components/utils';

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

describe(DetailsPage.displayName, () => {
  let wrapper: ReactWrapper<DetailsPageProps>;

  beforeEach(() => {
    // Need full mount with redux store since this is a redux-connected component
    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'default' });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: '' });
    wrapper = mount(
      <DetailsPage
        name="test-name"
        namespace="default"
        kind={referenceForModel(PodModel)}
        pages={[]}
        kindObj={PodModel}
      />,
      {
        wrappingComponent: ({ children }) => (
          <Provider store={store}>
            <Router.BrowserRouter>{children}</Router.BrowserRouter>
          </Provider>
        ),
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
    wrapper = wrapper.setProps({ resources, kindObj: ConfigMapModel });

    expect(wrapper.find<any>(Firehose).props().resources.length).toEqual(resources.length + 1);
    resources.forEach((resource, i) => {
      expect(wrapper.find<any>(Firehose).props().resources[i + 1]).toEqual(resource);
    });
  });
});
