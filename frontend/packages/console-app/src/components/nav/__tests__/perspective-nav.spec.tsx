import * as React from 'react';
import { Nav } from '@patternfly/react-core';
import { shallow, mount } from 'enzyme';
import { Provider } from 'react-redux';
import { Router } from 'react-router';
import { history } from '@console/internal/components/utils';
import store from '@console/internal/redux';
import { usePinnedResources } from '@console/shared/src/hooks/usePinnedResources';
import PerspectiveNav from '../PerspectiveNav';

jest.mock('react', () => ({
  ...require.requireActual('react'),
  useLayoutEffect: require.requireActual('react').useEffect,
}));
jest.mock('@console/dynamic-plugin-sdk/src/perspective/useActivePerspective', () => ({
  default: jest.fn().mockReturnValue(['dev', jest.fn()]),
}));
jest.mock('@console/shared/src/hooks/usePinnedResources', () => ({
  usePinnedResources: jest.fn(),
}));
jest.mock('@console/shared/src/hooks/perspective-utils', () => ({
  usePerspectives: jest.fn(),
}));
jest.mock('react-dnd', () => {
  const reactDnd = require.requireActual('react-dnd');
  return {
    ...reactDnd,
    useDrag: jest.fn().mockReturnValue([{}, {}, jest.fn()]),
    useDrop: jest.fn().mockReturnValue([{}, jest.fn()]),
  };
});
jest.mock('@console/shared/src/hooks/useK8sModel', () => ({
  useK8sModel: jest.fn().mockReturnValue([
    {
      apiVersion: 'v1',
      label: 'Test',
      labelKey: 'public~Test',
      plural: 'tests',
      abbr: 'T',
      namespaced: true,
      kind: 'Test',
      id: 'test',
      labelPlural: 'Tests',
      labelPluralKey: 'public~Tests',
    },
    false,
  ]),
}));

describe('Perspective Nav', () => {
  it('should render dev perspective nav', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig'],
      jest.fn(),
      true,
    ]);
    const wrapper = shallow(<PerspectiveNav />);
    expect(wrapper.find('[data-test-id="dev-perspective-nav"]').exists()).toBeTruthy();
  });

  it('should render non-draggable pinned items when only one pinned resource is available', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([['core~v1~ConfigMap'], jest.fn(), true]);
    const wrapper = mount(
      <Router history={history}>
        <Provider store={store}>
          <Nav>
            <PerspectiveNav />
          </Nav>
        </Provider>
      </Router>,
    );
    expect(wrapper.find('a[data-test="pinned-resource-item"]').length).toBe(1);
    expect(wrapper.find('a[data-test="draggable-pinned-resource-item"]').length).toBe(0);
  });

  it('should render draggable pinned items when more than one pinned resource is available', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig'],
      jest.fn(),
      true,
    ]);
    const wrapper = mount(
      <Router history={history}>
        <Provider store={store}>
          <Nav>
            <PerspectiveNav />
          </Nav>
        </Provider>
      </Router>,
    );
    expect(wrapper.find('a[data-test="pinned-resource-item"]').length).toBe(0);
    expect(wrapper.find('a[data-test="draggable-pinned-resource-item"]').length).toBe(2);
  });

  it('should handle one valid and one invalid pinned resource', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'foo'],
      jest.fn(),
      true,
    ]);
    const wrapper = mount(
      <Router history={history}>
        <Provider store={store}>
          <Nav>
            <PerspectiveNav />
          </Nav>
        </Provider>
      </Router>,
    );
    expect(wrapper.find('a[data-test="pinned-resource-item"]').length).toBe(1);
    expect(wrapper.find('a[data-test="draggable-pinned-resource-item"]').length).toBe(0);
  });

  it('should handle one valid and multiple invalid pinned resources', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'foo', 'bar', 'baz'],
      jest.fn(),
      true,
    ]);
    const wrapper = mount(
      <Router history={history}>
        <Provider store={store}>
          <Nav>
            <PerspectiveNav />
          </Nav>
        </Provider>
      </Router>,
    );
    expect(wrapper.find('a[data-test="pinned-resource-item"]').length).toBe(1);
    expect(wrapper.find('a[data-test="draggable-pinned-resource-item"]').length).toBe(0);
  });

  it('should handle multiple valid and one invalid pinned resource', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig', 'foo'],
      jest.fn(),
      true,
    ]);
    const wrapper = mount(
      <Router history={history}>
        <Provider store={store}>
          <Nav>
            <PerspectiveNav />
          </Nav>
        </Provider>
      </Router>,
    );
    expect(wrapper.find('a[data-test="pinned-resource-item"]').length).toBe(0);
    expect(wrapper.find('a[data-test="draggable-pinned-resource-item"]').length).toBe(2);
  });

  it('should handle multiple valid and multiple invalid pinned resources', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([
      ['core~v1~ConfigMap', 'build.openshift.io~v1~BuildConfig', 'foo', 'bar', 'baz'],
      jest.fn(),
      true,
    ]);
    const wrapper = mount(
      <Router history={history}>
        <Provider store={store}>
          <Nav>
            <PerspectiveNav />
          </Nav>
        </Provider>
      </Router>,
    );
    expect(wrapper.find('a[data-test="pinned-resource-item"]').length).toBe(0);
    expect(wrapper.find('a[data-test="draggable-pinned-resource-item"]').length).toBe(2);
  });

  it('should handle all invalid pinned resources', () => {
    (usePinnedResources as jest.Mock).mockReturnValue([['foo', 'bar', 'baz'], jest.fn(), true]);
    const wrapper = mount(
      <Router history={history}>
        <Provider store={store}>
          <Nav>
            <PerspectiveNav />
          </Nav>
        </Provider>
      </Router>,
    );
    expect(wrapper.find('a[data-test="pinned-resource-item"]').length).toBe(0);
    expect(wrapper.find('a[data-test="draggable-pinned-resource-item"]').length).toBe(0);
  });

  // TODO: More unit tests for dynmamic plugins
});
