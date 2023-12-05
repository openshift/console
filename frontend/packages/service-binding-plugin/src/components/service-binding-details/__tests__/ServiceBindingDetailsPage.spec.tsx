import * as React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import * as Router from 'react-router-dom-v5-compat';
import { Firehose } from '@console/internal/components/utils/firehose';
import { modelFor, useModelFinder } from '@console/internal/module/k8s';
import store from '@console/internal/redux';
import { useK8sModel } from '@console/shared/src/hooks/useK8sModel';
import {
  connectedServiceBinding,
  connectedServiceBindingWithLabelSelector,
  failedServiceBinding,
} from '../../../__tests__/mock-data';
import { ServiceBindingModel } from '../../../models';
import ServiceBindingDetailsPage from '../ServiceBindingDetailsPage';

jest.mock('@console/plugin-sdk', () => ({
  ...require.requireActual('@console/plugin-sdk'),
  useExtensions: () => [],
  useResolvedExtensions: () => [[]],
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  Link: 'Link',
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  useRoutes: jest.fn(),
}));

jest.mock('@console/shared/src/components/error/error-boundary', () => ({
  ...require.requireActual('@console/shared/src/components/error/error-boundary'),
  withFallback: (children) => children,
}));

jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  ...require.requireActual('@console/shared/src/hooks/useK8sModel'),
  useK8sModel: jest.fn(),
}));

jest.mock('@console/internal/module/k8s/k8s-models', () => ({
  ...require.requireActual('@console/internal/module/k8s/k8s-models'),
  modelFor: jest.fn(),
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...require.requireActual('@console/internal/module/k8s'),
  useModelFinder: jest.fn(() => ({
    findModel: jest.fn(),
  })),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  ...require.requireActual('@console/internal/components/utils/rbac'),
  useAccessReview: () => true,
}));

jest.mock('@console/internal/components/utils/timestamp', () => ({
  Timestamp: ({ timestamp }) => timestamp || null,
}));

jest.mock('@console/internal/components/utils/firehose', () => ({
  ...require.requireActual('@console/internal/components/utils/firehose'),
  Firehose: jest.fn(),
}));

jest.mock('@console/shared/src/components/actions', () => ({
  ...require.requireActual('@console/shared/src/components/actions'),
  ActionServiceProvider: () => null,
}));

(modelFor as jest.Mock).mockReturnValue(ServiceBindingModel);
(useK8sModel as jest.Mock).mockReturnValue([ServiceBindingModel]);
(useModelFinder as jest.Mock).mockImplementation(() => ({ findModel: () => ServiceBindingModel }));

describe('ServiceBindingDetailsPage', () => {
  it('should render a connected SB with the right status and attributes', () => {
    ((Firehose as any) as jest.Mock).mockImplementation((props) => {
      const childProps = {
        obj: {
          loaded: true,
          data: connectedServiceBinding,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    jest
      .spyOn(Router, 'useParams')
      .mockReturnValue({ ns: 'a-namespace', name: 'connected-service-binding' });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: '' });
    jest.spyOn(Router, 'useRoutes').mockReturnValue([{ path: '/' }]);

    const wrapper = mount(
      <ServiceBindingDetailsPage kind="binding.operators.coreos.com~v1alpha1~ServiceBinding" />,
      {
        wrappingComponent: ({ children }) => (
          <Provider store={store}>
            <Router.BrowserRouter>{children}</Router.BrowserRouter>
          </Provider>
        ),
      },
    );

    expect(wrapper.find({ children: 'ServiceBinding details' }).exists()).toBe(true);

    // Name
    expect(wrapper.find({ children: 'Name' }).exists()).toBe(true);
    expect(wrapper.find({ children: 'connected-service-binding' }).exists()).toBe(true);

    // Status
    expect(wrapper.find({ children: 'Status' }).exists()).toBe(true);
    expect(wrapper.find('[status="Connected"]').exists()).toBe(true);
    expect(wrapper.find('[status="Error"]').exists()).toBe(false);

    // Application
    expect(wrapper.find('[label="Application"]').exists()).toBe(true);
    expect(wrapper.find({ children: 'nodeinfo-from-source' }).exists()).toBe(true);

    // Services
    expect(wrapper.find({ children: 'Services' }).exists()).toBe(true);
    expect(wrapper.find('[data-test="example"]').exists()).toBe(true);

    // Conditions
    expect(wrapper.find({ children: 'Conditions' }).exists()).toBe(true);
    expect(wrapper.find('[data-test="Ready"]').exists()).toBe(true);
  });

  it('should render a failed SB with the right status and attributes', () => {
    ((Firehose as any) as jest.Mock).mockImplementation((props) => {
      const childProps = {
        obj: {
          loaded: true,
          data: failedServiceBinding,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    jest
      .spyOn(Router, 'useParams')
      .mockReturnValue({ ns: 'a-namespace', name: 'failed-service-binding' });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: '' });
    jest.spyOn(Router, 'useRoutes').mockReturnValue([{ path: '/' }]);

    const wrapper = mount(
      <ServiceBindingDetailsPage kind="binding.operators.coreos.com~v1alpha1~ServiceBinding" />,
      {
        wrappingComponent: ({ children }) => (
          <Provider store={store}>
            <Router.BrowserRouter>{children}</Router.BrowserRouter>
          </Provider>
        ),
      },
    );

    // Name
    expect(wrapper.find({ children: 'ServiceBinding details' }).exists()).toBe(true);
    expect(wrapper.find({ children: 'Name' }).exists()).toBe(true);
    expect(wrapper.find({ children: 'failed-service-binding' }).exists()).toBe(true);

    // Status
    expect(wrapper.find({ children: 'Status' }).exists()).toBe(true);
    expect(wrapper.find('[status="Connected"]').exists()).toBe(false);
    expect(wrapper.find('[status="Error"]').exists()).toBe(true);

    // Application
    expect(wrapper.find('[label="Application"]').exists()).toBe(true);
    expect(wrapper.find({ children: 'nodeinfo' }).exists()).toBe(true);

    // Services
    expect(wrapper.find({ children: 'Services' }).exists()).toBe(true);
    expect(wrapper.find('[data-test="redis-standalone"]').exists()).toBe(true);

    // Conditions
    expect(wrapper.find({ children: 'Conditions' }).exists()).toBe(true);
    expect(wrapper.find('[data-test="Ready"]').exists()).toBe(true);
    expect(wrapper.find('[value="ErrorReadingBinding"]').exists()).toBe(true);
    expect(wrapper.find({ children: 'redisSecret is not found' }).exists()).toBe(true);
  });

  it('should render a connected SB using label selector with the right status and attributes', () => {
    ((Firehose as any) as jest.Mock).mockImplementation((props) => {
      const childProps = {
        obj: {
          loaded: true,
          data: connectedServiceBindingWithLabelSelector,
        },
      };
      return React.Children.map(props.children, (child) => React.cloneElement(child, childProps));
    });

    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'a-namespace',
      name: 'connected-service-binding-with-label-selector',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({ pathname: '' });
    jest.spyOn(Router, 'useRoutes').mockReturnValue([{ path: '/' }]);

    const wrapper = mount(
      <ServiceBindingDetailsPage kind="binding.operators.coreos.com~v1alpha1~ServiceBinding" />,
      {
        wrappingComponent: ({ children }) => (
          <Provider store={store}>
            <Router.BrowserRouter>{children}</Router.BrowserRouter>
          </Provider>
        ),
      },
    );

    expect(wrapper.find({ children: 'ServiceBinding details' }).exists()).toBe(true);

    // Name
    expect(wrapper.find({ children: 'Name' }).exists()).toBe(true);
    expect(
      wrapper.find({ children: 'connected-service-binding-with-label-selector' }).exists(),
    ).toBe(true);

    // Status
    expect(wrapper.find({ children: 'Status' }).exists()).toBe(true);
    expect(wrapper.find('[status="Connected"]').exists()).toBe(true);
    expect(wrapper.find('[status="Error"]').exists()).toBe(false);

    // Application
    expect(wrapper.find('[label="Label Selector"]').exists()).toBe(true);
    expect(wrapper.text().includes('test=test')).toBe(true);

    // Services
    expect(wrapper.find({ children: 'Services' }).exists()).toBe(true);
    expect(wrapper.find('[data-test="example"]').exists()).toBe(true);

    // Conditions
    expect(wrapper.find({ children: 'Conditions' }).exists()).toBe(true);
    expect(wrapper.find('[data-test="Ready"]').exists()).toBe(true);
  });
});
